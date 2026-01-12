import type { Message } from '@cloudflare/realtimekit';
import { Peer } from '../types/rtk-client';
import { ChatChannel, ChatMessage } from '../types/props';
import { chatUnreadTimestamps } from './user-prefs';

export const parseMessageForTarget = (message) => {
  let parsedMessage = null;
  try {
    const parsed = JSON.parse(message.message);
    const { target, message: m } = parsed;
    if (target === undefined || m === undefined) {
      parsedMessage = message;
    } else {
      parsedMessage = {
        ...message,
        targetUserIds: target,
        message: m,
      };
    }
  } catch (error) {
    parsedMessage = message;
  }
  return parsedMessage as Message;
};

export function alphabeticalSorter(a: string, b: string) {
  return a.localeCompare(b);
}

/**
 * Generate a unique chat group key used in `<rtk-chat /> and <rtk-chat-selector-ui />`
 * @param ids An array of user ids
 * @returns A unique key from the user ids
 */
export function generateChatGroupKey(ids: string[]) {
  return ids.sort((a, b) => a.localeCompare(b)).join('_');
}

export function handleFilesDataTransfer(
  items: DataTransferItemList,
  callback: (type: 'image' | 'file', file: File) => void
) {
  if (items == null) return true;

  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (item.type.startsWith('image/')) {
        callback('image', file);
      } else {
        callback('file', file);
      }
    }
  }
}

interface GetChatGroupsOptions {
  messages: Message[];
  participants: Pick<Peer, 'name' | 'userId'>[];
  selfUserId: string;
}

export function getChatGroups({ messages, participants, selfUserId }: GetChatGroupsOptions) {
  const groups: Record<string, ChatMessage[]> = {};

  // create empty chat groups for all participants
  for (const participant of participants) {
    groups[generateChatGroupKey([participant.userId, selfUserId])] = [];
  }

  messages.forEach((message) => {
    const parsedMessage = parseMessageForTarget(message);

    let key = 'everyone';
    if (parsedMessage.targetUserIds?.length > 0) {
      const allParticipants = new Set<string>([
        parsedMessage.userId,
        ...parsedMessage.targetUserIds,
      ]);
      key = generateChatGroupKey(Array.from(allParticipants));
    }

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push({ type: 'chat', message: parsedMessage });
  });

  return groups;
}

export type GetUnreadChatCountsOptions = {
  messages: Message[];
  selfUserId: string;
  selectedGroupId: string;
  participants: Pick<Peer, 'name' | 'userId'>[];
};

export function getUnreadChatCounts({
  messages,
  selfUserId,
  selectedGroupId,
  participants,
}: GetUnreadChatCountsOptions) {
  const groups: Record<string, ChatMessage[]> = getChatGroups({
    messages,
    selfUserId,
    participants,
  });
  const unreadCounts: Record<string, number> = {};

  for (const key in groups) {
    const lastReadTimestamp = chatUnreadTimestamps[key] ?? 0;

    if (key === selectedGroupId) {
      // reset count to 0 when you select a group
      unreadCounts[key] = 0;
      chatUnreadTimestamps[key] = new Date();
    } else {
      unreadCounts[key] = groups[key].filter((c) => {
        return (
          c.type == 'chat' && c.message.time > lastReadTimestamp && c.message.userId !== selfUserId
        );
      }).length;
    }
  }

  return unreadCounts;
}

export function getParticipantUserId({
  groupId,
  selfUserId,
}: {
  groupId: string;
  selfUserId: string;
}) {
  return groupId.split('_').find((id) => id != selfUserId);
}

export const TEMPORARY_CHANNEL_PREFIX = 'dm__';

export function isDirectMessageChannel(channel: ChatChannel) {
  return channel.isDirectMessage;
}

export function getDMComparator(memberIds: string[]) {
  const uniqueMemberIds = [...new Set(memberIds)];
  return uniqueMemberIds.sort(alphabeticalSorter).join('<>');
}

export function reverse(str: string) {
  return str.split('').reverse().join('');
}

export const emailPattern =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
export const boldPattern = /^\*([^*\s]+)\*/;
export const italicsPattern = /^_([^_\s]+)_/;
export const strikethroughPattern = /^~([^~\s]+)~/;
// Source: https://stackoverflow.com/a/8234912/2013580
export const linkPattern =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.,~#?&//=]*)/;
export const replyBlockPattern = /<blockquote>[.\s\S]*<\/blockquote>\n\n/m;

export function extractReplyBlock(message: string, excludeTags = false) {
  if (!replyBlockPattern.test(message)) {
    return '';
  }
  let startOffset = 0;
  let endOffset = '</blockquote>'.length;

  if (excludeTags) {
    startOffset = '<blockquote>'.length;
    endOffset = 0;
  }
  return message.substring(
    message.indexOf('<blockquote>') + startOffset,
    message.indexOf('</blockquote>') + endOffset
  );
}

export function stripOutReplyBlock(message: string) {
  return message.replace(replyBlockPattern, '');
}

export const MAX_TEXT_LENGTH = 2000;

export interface Token {
  type: string;
  content: Token[] | string;
}

const KNOWN_TAGS = ['<a>', '<b>', '<i>', '<q>', '<s>'];

export function parseRichText(text: string) {
  text = text
    .split(' ')
    .map((word) => {
      if (linkPattern.test(word)) {
        const res = linkPattern.exec(word);
        word = word.replace(res[0], `<a>${res[0]}</a>`);
      } else {
        if (boldPattern.test(word)) {
          const res = boldPattern.exec(word);
          word = word.replace(res[0], `<b>${res[1]}</b>`);
        }
        if (italicsPattern.test(word)) {
          const res = italicsPattern.exec(word);
          word = word.replace(res[0], `<i>${res[1]}</i>`);
        }
        if (strikethroughPattern.test(word)) {
          const res = strikethroughPattern.exec(word);
          word = word.replace(res[0], `<s>${res[1]}</s>`);
        }
      }
      return word;
    })
    .join(' ');

  text = text
    .split(' ')
    .map((word, idx) => {
      if (word === '>' && (idx === 0 || word[idx - 1] === '>')) {
        return `<q></q>`;
      }
      return word;
    })
    .join(' ');

  const [tokens] = tokenizeRichText(text);
  return tokens;
}

export function tokenizeRichText(text: string, endTag: string = ''): [Token[], number] {
  const tokens = [];
  if (text.length === 0) {
    return [tokens, 0];
  }

  let i = 0;
  while (i < text.length) {
    if (endTag.length && endTag === text.substring(i, i + endTag.length)) {
      return [tokens, i + endTag.length];
    }
    if (KNOWN_TAGS.includes(text.substring(i, i + 3))) {
      const [subtokens, pos] = tokenizeRichText(text.substring(i + 3), `</${text[i + 1]}>`);
      tokens.push({
        type: text[i + 1],
        content:
          subtokens.length === 1 && subtokens[0].type === 'plain_text'
            ? subtokens[0].content
            : subtokens,
      });
      i += pos + 3;
    } else {
      let top = tokens[tokens.length - 1];
      if (!top || top.type !== 'plain_text') {
        tokens.push({ type: 'plain_text', content: '' });
        top = tokens[tokens.length - 1];
      }
      top.content += text[i];
      i++;
    }
  }
  return [tokens, i];
}
