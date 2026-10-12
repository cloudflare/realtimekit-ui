import { Component, Prop, State, Watch, h, writeTask } from '@stencil/core';
import { IconPack, defaultIconPack } from '../../exports';
import { SyncWithStore } from '../../utils/sync-with-store';
import { debounce } from 'lodash-es';

interface Message {
  id: string;
  [key: string]: any;
}

const MAX_VISIBLE_ITEMS = 20;

const OVERSCAN_BUFFER = 5;

/**
 * A component which renders list of messages.
 */
@Component({
  tag: 'rtk-message-list-view',
  styleUrl: 'rtk-message-list-view.css',
})
export class RtkMessageListView {
  /** Messages to render */
  @Prop() messages!: Message[];

  /** Render function of the message */
  @Prop() renderer!: (message: Message, index: number) => HTMLElement;

  /**
   * Function to load more messages.
   * Messages returned from this will be prepended
   */
  @Prop() loadMore: (lastMessage: Message) => Promise<Message[]>;

  /** Maximum visible messages */
  @Prop() visibleItemsCount: number = MAX_VISIBLE_ITEMS;

  /** Estimated height of an item */
  @Prop() estimateItemSize: number = 100;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  @State() range: { start: number; end: number };

  @State() isFetching: boolean = false;

  @State() autoScroll: boolean = true;

  @State() totalHeight: number = 0;

  private $listRef: HTMLDivElement;

  private $listEndRef: HTMLDivElement;

  private sizes = new Map<string, number>();

  private lastScrollTop: number = 0;

  private scrollToBottomRetries: number = 0;

  private elementObserver = (() => {
    let _ro: ResizeObserver | null = null;

    const get = () => {
      if (_ro) {
        return _ro;
      } else if (typeof ResizeObserver !== 'undefined') {
        return (_ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
          entries.forEach((entry) => {
            this.measureElement(entry.target as HTMLDivElement, entry);
          });
        }));
      } else {
        return null;
      }
    };

    return {
      disconnect: () => get()?.disconnect(),
      observe: (target: Element) => get()?.observe(target, { box: 'border-box' }),
      unobserve: (target: Element) => get()?.unobserve(target),
    };
  })();

  connectedCallback() {
    const total = this.messages.length - 1;
    this.range = { start: total - this.visibleItemsCount, end: total };
    this.updateVisibleItems(this.range.start, this.range.end);
    this.totalHeight = this.getRangeSize(0, total);
  }

  componentDidLoad() {
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  @Watch('messages')
  messagesUpdated(newValue: Message[], previousValue: Message[]) {
    if (newValue.length > previousValue.length) {
      const diff = newValue.length - previousValue.length;
      this.updateVisibleItems(diff, this.getEndByStart(diff));
      this.scrollToIndex(this.range.start);
    }
  }

  private measureElement = (node: HTMLDivElement, entry: ResizeObserverEntry) => {
    if (!node) return;

    const id = node.dataset.id;

    if (this.sizes.has(id)) {
      this.elementObserver.unobserve(node);
      return;
    }

    if (entry) {
      const box = entry.borderBoxSize[0];
      if (box && box.blockSize > 0) {
        this.saveItemSize(id, box.blockSize);
        this.elementObserver.unobserve(node);
        return;
      }
    }
    const rect = node.getBoundingClientRect();
    if (rect.height > 0) this.saveItemSize(id, rect.height);
  };

  private getVisibleItems = () => {
    return this.messages.slice(this.range.start, this.range.end + 1);
  };

  private updateVisibleItems = (start: number, end: number) => {
    const total = this.messages.length;
    let newStart = start;
    let newEnd = end;
    if (total <= this.visibleItemsCount) {
      // render all
      newStart = 0;
      newEnd = total - 1;
    } else if (end - start < this.visibleItemsCount - 1) {
      // if range is less then visible, adjust start based on end
      newStart = this.range.end - this.visibleItemsCount + 1;
    }

    if (this.range.start !== newStart) {
      this.range = { start: newStart, end: newEnd };
      this.totalHeight = this.getRangeSize(0, total);
    }
  };

  private getEstimatedItemSize = () => {
    return this.estimateItemSize;
  };

  private getRangeSize = (start: number, end: number) => {
    let total = 0;
    let itemSize = 0;
    for (let index = start; index < end; index++) {
      itemSize = this.sizes.get(this.messages[index].id);
      total = total + (!!itemSize ? itemSize : this.getEstimatedItemSize());
    }
    return total;
  };

  private getScrollTop = () => {
    return this.$listRef ? Math.ceil(this.$listRef.scrollTop) : 0;
  };

  private getClientHeight = () => {
    return this.$listRef ? Math.ceil(this.$listRef.clientHeight) : 0;
  };

  private getScrollHeight = () => {
    return this.$listRef ? Math.ceil(this.$listRef.scrollHeight) : 0;
  };

  private getItemsScrolled = () => {
    const offset = this.lastScrollTop;
    if (offset <= 0) {
      return 0;
    }

    let low = 0;
    let middle = 0;
    let middleOffset = 0;
    let high = this.messages.length;

    while (low <= high) {
      middle = (low + high) >>> 1;
      middleOffset = this.getRangeSize(0, middle);

      if (middleOffset === offset) {
        return middle;
      } else if (middleOffset < offset) {
        low = middle + 1;
      } else if (middleOffset > offset) {
        high = middle - 1;
      }
    }

    return low > 0 ? --low : 0;
  };

  private getEndByStart = (start: number) => {
    return Math.min(start + this.visibleItemsCount, this.messages.length - 1);
  };

  private scrollToOffset = (offset: number) => {
    if (this.$listRef) {
      this.$listRef.scrollTop = offset;
    }
  };

  private scrollToIndex = (index: number) => {
    if (index >= this.messages.length - 1) {
      this.scrollToBottom();
    } else {
      const offset = index < 1 ? 0 : this.getRangeSize(0, index);
      this.scrollToOffset(offset);
    }
  };

  private scrollToBottom = () => {
    if (!this.$listEndRef) return;
    writeTask(() => {
      this.$listEndRef.scrollIntoView();
      if (
        this.getScrollHeight() - (this.getScrollTop() + this.getClientHeight()) > 0 &&
        this.scrollToBottomRetries < 10
      ) {
        setTimeout(() => {
          this.scrollToBottom();
        }, 1000 / 60);
      } else {
        this.scrollToBottomRetries = 0;
        this.autoScroll = true;
      }
    });
  };

  private handleScroll = async () => {
    if (this.isFetching) return;
    const scrollTop = this.getScrollTop();

    const direction = scrollTop < this.lastScrollTop || scrollTop === 0 ? 'UP' : 'DOWN';
    this.lastScrollTop = scrollTop;

    if (this.loadMore && scrollTop === 0 && direction === 'UP' && this.isFetching === false) {
      this.isFetching = true;
      const newMessages = await this.loadMore(this.messages[0]);
      if (newMessages && newMessages.length) {
        this.messages = [...newMessages, ...this.messages];
      }
      this.isFetching = false;
    }

    if (direction === 'UP') {
      this.handleTop();
    } else if (direction === 'DOWN') {
      this.handleBottom();
    }
  };

  private handleTop = () => {
    const scrolledItems = this.getItemsScrolled();
    if (scrolledItems <= this.range.end - OVERSCAN_BUFFER) {
      this.autoScroll = false;
    }

    if (scrolledItems > this.range.start + OVERSCAN_BUFFER) {
      return;
    }

    const newStart = Math.max(this.range.start - OVERSCAN_BUFFER, 0);
    this.updateVisibleItems(newStart, this.getEndByStart(newStart));
  };

  private handleBottom = () => {
    const scrolledItems = this.getItemsScrolled();
    if (scrolledItems < this.range.start + OVERSCAN_BUFFER) {
      return;
    }
    const newStart = this.range.start + OVERSCAN_BUFFER;
    const newEnd = this.getEndByStart(newStart);
    if (newEnd === this.messages.length - 1) {
      this.updateVisibleItems(newEnd - this.visibleItemsCount, newEnd);
    } else {
      this.updateVisibleItems(newStart, newEnd);
    }
  };

  private updateTotalHeight = debounce(
    () => {
      this.totalHeight = this.getRangeSize(0, this.messages.length);
    },
    1000 / 30,
    { leading: true }
  );

  private saveItemSize(id: string, height: number) {
    this.sizes.set(id, Math.round(height));
    this.updateTotalHeight();
  }

  private rendererInternal = (
    containerElement: HTMLDivElement,
    message: Message,
    index: number
  ) => {
    if (!containerElement) return;
    if (containerElement.dataset.id === message.id) return;

    const viewElement = this.renderer(message, index);

    if (containerElement.hasChildNodes) {
      containerElement.innerHTML = '';
    }

    this.elementObserver.observe(containerElement);

    containerElement.dataset.id = message.id;
    containerElement.appendChild(viewElement);
  };

  render() {
    return (
      <div
        class="scrollbar content-wrapper"
        ref={(el) => (this.$listRef = el)}
        onScroll={this.handleScroll}
      >
        <div class="scroller">
          <div
            style={{
              height: `${this.totalHeight}px`,
            }}
          ></div>
          <div
            class="smallest-dom-element"
            id="list-end"
            ref={(el) => (this.$listEndRef = el)}
          ></div>
        </div>

        <div
          class="content"
          style={{
            transform: `translateY(${this.getRangeSize(0, this.range.start)}px)`,
          }}
        >
          {this.isFetching && (
            <div class="loader">
              <rtk-spinner size="md" />
            </div>
          )}
          {this.getVisibleItems().map((msg, index) => (
            <div key={msg.id} ref={(el) => this.rendererInternal(el, msg, index)}></div>
          ))}
        </div>
      </div>
    );
  }
}
