/**
 * Shorten a string upto a maximum length of characters and add `...` as suffix if it exceeds the maximum length
 * @param str The The string you want to shorten
 * @param maxLength Maximum length of character
 * @returns Formatted shortedned string
 */
export const shorten = (str: string, maxLength: number = 20) => {
  if (str == null) return '';
  if (str.length > maxLength) {
    return `${str.substring(0, maxLength)}...`;
  }
  return str;
};

/**
 * Checks if a given string consists of only emojis.
 *
 * However this classifies a string with numbers as emoji as well.
 * Which works in our favour for now in chat as it enlarges messages with just numbers.
 * @param str String on which to perform the check on
 * @returns A Boolean value which indicates if string consists of only emojis
 */
export const hasOnlyEmojis = (str: string) => {
  const num = /^\d+$/;
  const re = /^\p{Emoji}+$/u;
  return re.test(str) && !num.test(str);
};

export const sanitizeLink = (link: string) => {
  // TODO: needs more work
  if (link?.trim().toLowerCase().startsWith('javascript:')) {
    return 'https://realtime.cloudflare.com';
  }
  return link;
};

/**
 * Formats a given name and returns **Participant** for unnamed participants.
 * @param name Name of participant
 * @returns Name to use in the UI
 */
export const formatName = (name: string) => {
  name = name?.trim();
  if (name === '') return 'Participant';
  return name;
};
const whiteSpace = new RegExp(/[^\u00BF-\u1FFF\u2C00-\uD7FF\w\s]/, 'g');
const space = new RegExp(/\s+/);

export function getInitials(name: string, maxInitials = 2) {
  // removes any character that is not a letter, number or whitespace
  const cleanedName = name.replace(whiteSpace, '');

  const words = cleanedName.trim().split(space).slice(0, maxInitials);

  return words
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}
