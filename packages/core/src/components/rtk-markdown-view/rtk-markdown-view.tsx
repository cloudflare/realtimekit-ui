import { Component, Prop, h } from '@stencil/core';
import {
  MAX_TEXT_LENGTH,
  Token,
  extractReplyBlock,
  parseRichText,
  stripOutReplyBlock,
} from '../../utils/chat';

@Component({
  tag: 'rtk-markdown-view',
  styleUrl: 'rtk-markdown-view.css',
  shadow: true,
})
export class RtkMarkdownView {
  /** raw text to render as markdown */
  @Prop() text: string;

  /** max length of text to render as markdown */
  @Prop() maxLength: number = MAX_TEXT_LENGTH;

  private restoreEmpty = (
    content: string,
    tag: string,
    renderCallback: (content: string) => void
  ) => {
    return content.trim().length === 0 ? `${tag}${content}${tag}` : renderCallback(content);
  };

  private renderLink = (content: string) => {
    return (
      <a class="link" href={content} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  };

  private renderBold = (content: Token[] | string) => {
    if (typeof content === 'string') {
      return this.restoreEmpty(content, '*', (c) => <b>{c}</b>);
    }
    return <b>{this.renderTokens(content)}</b>;
  };
  private renderItalic = (content: Token[] | string) => {
    if (typeof content === 'string') {
      return this.restoreEmpty(content, '_', (c) => <i>{c}</i>);
    }
    return <i>{this.renderTokens(content)}</i>;
  };
  private renderStrikethrough = (content: Token[] | string) => {
    if (typeof content === 'string') {
      return this.restoreEmpty(content, '~', (c) => <s>{c}</s>);
    }
    return <b>{this.renderTokens(content)}</b>;
  };
  private renderPlainText = (content: Token[] | string) => {
    if (typeof content === 'string') {
      return content;
    }
    return <p>{this.renderTokens(content)}</p>;
  };

  private renderTokens = (tokens: Token[]) => {
    return tokens.map((token) => {
      switch (token.type) {
        case 'a':
          if (typeof token.content === 'string') {
            return this.renderLink(token.content);
          }
        case 'b':
          return this.renderBold(token.content);
        case 'i':
          return this.renderItalic(token.content);
        case 's':
          return this.renderStrikethrough(token.content);
        case 'q':
          return <span class="block-quote"></span>;
        case 'plain_text':
        default:
          return this.renderPlainText(token.content);
      }
    });
  };

  private renderMessage(text: string) {
    let lines = text.split('\n');
    let isCodeBlock = false;
    if (lines[0] === '```' && lines[lines.length - 1] === '```') {
      isCodeBlock = true;
      lines = lines.slice(1, -1);
    }
    const message = lines.map((line) => {
      const tokens = parseRichText(line);
      return <p>{this.renderTokens(tokens)}</p>;
    });

    if (isCodeBlock) {
      return <pre style={{ whiteSpace: 'pre', overflow: 'scroll' }}>{lines.join('\n')}</pre>;
    }

    return message;
  }

  render() {
    const slicedMessage = this.text.slice(0, this.maxLength);
    const withReply = extractReplyBlock(slicedMessage, true);
    const withoutReply = stripOutReplyBlock(slicedMessage);

    return (
      <p class="markdown-message">
        {withReply.length !== 0 && <blockquote>{this.renderMessage(withReply)}</blockquote>}
        {withoutReply.length !== 0 && this.renderMessage(withoutReply)}
      </p>
    );
  }
}
