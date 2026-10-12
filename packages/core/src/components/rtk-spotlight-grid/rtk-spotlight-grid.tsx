import { Component, Host, h, Prop, Element } from '@stencil/core';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { defaultGridSize } from '../../lib/grid';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Render } from '../../lib/render';
import { Meeting, Peer } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { SyncWithStore } from '../../utils/sync-with-store';
import { GridLayout, GridSize } from '../rtk-grid/rtk-grid';

/**
 * A grid component that renders two lists of participants: `pinnedParticipants` and `participants`.
 *
 * You can customize the layout to a `column` view, by default is `row`.
 *
 * - Participants from `pinnedParticipants[]` are rendered inside a larger grid.
 * - Participants from `participants[]` array are rendered in a smaller grid.
 */
@Component({
  tag: 'rtk-spotlight-grid',
  styleUrl: 'rtk-spotlight-grid.css',
  shadow: true,
})
export class RtkSpotlightGrid {
  /** Grid Layout */
  @Prop({ reflect: true }) layout: GridLayout = 'row';

  /** Participants */
  @Prop() participants: Peer[] = [];

  /** Pinned Participants */
  @Prop() pinnedParticipants: Peer[] = [];

  /**
   * Aspect Ratio of participant tile
   *
   * Format: `width:height`
   */
  @Prop() aspectRatio: string = '16:9';

  /** Gap between participant tiles */
  @Prop() gap: number = 8;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** UI Config */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /** Icon Pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Grid size */
  @Prop() gridSize: GridSize = defaultGridSize;

  @Element() host: HTMLRtkSpotlightGridElement;

  private getAdaptiveSize = (length: number) => {
    if (this.size === 'sm') {
      return 'sm';
    }

    if (length > 3) {
      return 'sm';
    } else {
      if (this.size === 'md') {
        return 'sm';
      }

      return 'md';
    }
  };

  render() {
    const defaults = {
      meeting: this.meeting,
      config: this.config,
      states: this.states,
      size: this.size,
      iconPack: this.iconPack,
      t: this.t,
    };

    const nonPinnedParticipants = this.participants.filter((p) =>
      this.pinnedParticipants.some((pt) => pt.id != p.id)
    );

    return (
      <Host>
        <main part="main">
          <Render
            element="rtk-simple-grid"
            defaults={defaults}
            props={{
              part: 'main-grid',
              participants: this.pinnedParticipants,
              aspectRatio: this.aspectRatio,
              gap: this.gap,
              size: this.getAdaptiveSize(this.pinnedParticipants.length),
            }}
          />
        </main>
        {nonPinnedParticipants.length > 0 && (
          <aside
            part="aside"
            class={
              this.gridSize.spotlight ? `grid-width-${this.gridSize.spotlight}` : 'grid-width-md'
            }
          >
            <Render
              element="rtk-simple-grid"
              defaults={defaults}
              props={{
                part: 'aside-grid',
                participants: nonPinnedParticipants,
                aspectRatio: this.aspectRatio,
                gap: this.gap,
                size: this.getAdaptiveSize(nonPinnedParticipants.length),
              }}
            />
          </aside>
        )}
      </Host>
    );
  }
}
