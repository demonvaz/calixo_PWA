/**
 * Utility functions for detecting and processing mentions in comments
 */

export interface Mention {
  username: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extract mentions from text (format: @username)
 * Returns array of mentions with their positions
 */
export function extractMentions(text: string): Mention[] {
  const mentions: Mention[] = [];
  const mentionRegex = /@(\w+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return mentions;
}

/**
 * Get unique usernames from mentions
 */
export function getMentionedUsernames(text: string): string[] {
  const mentions = extractMentions(text);
  return [...new Set(mentions.map(m => m.username.toLowerCase()))];
}

/**
 * Replace mentions in text with formatted HTML/JSX
 * Useful for displaying mentions as links
 */
export function formatMentions(text: string): Array<string | { type: 'mention'; username: string }> {
  const mentions = extractMentions(text);
  if (mentions.length === 0) {
    return [text];
  }

  const parts: Array<string | { type: 'mention'; username: string }> = [];
  let lastIndex = 0;

  mentions.forEach((mention) => {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, mention.startIndex));
    }

    // Add mention
    parts.push({
      type: 'mention',
      username: mention.username,
    });

    lastIndex = mention.endIndex;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
