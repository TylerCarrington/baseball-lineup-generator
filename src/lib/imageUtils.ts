/**
 * Utility functions for image URLs and Imgur links.
 */

export function normalizeImageUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();

  // Imgur album link: https://imgur.com/a/VbTi2Uj
  if (/^https?:\/\/(www\.)?imgur\.com\/a\/([a-zA-Z0-9]+)/i.test(trimmed)) {
    const match = trimmed.match(/^https?:\/\/(www\.)?imgur\.com\/a\/([a-zA-Z0-9]+)/i);
    if (match && match[2]) {
      return `https://i.imgur.com/${match[2]}.jpg`;
    }
  }

  // Imgur gallery link: https://imgur.com/gallery/VbTi2Uj
  if (/^https?:\/\/(www\.)?imgur\.com\/gallery\/([a-zA-Z0-9]+)/i.test(trimmed)) {
    const match = trimmed.match(/^https?:\/\/(www\.)?imgur\.com\/gallery\/([a-zA-Z0-9]+)/i);
    if (match && match[2]) {
      return `https://i.imgur.com/${match[2]}.jpg`;
    }
  }

  // Imgur page link: https://imgur.com/VbTi2Uj (without i.imgur.com and extension)
  if (/^https?:\/\/(www\.)?imgur\.com\/([a-zA-Z0-9]+)$/i.test(trimmed)) {
    const match = trimmed.match(/^https?:\/\/(www\.)?imgur\.com\/([a-zA-Z0-9]+)$/i);
    if (match && match[2] && match[2] !== 'a' && match[2] !== 'gallery') {
      return `https://i.imgur.com/${match[2]}.jpg`;
    }
  }

  return trimmed;
}

export function isImgurAlbumUrl(url: string): boolean {
  if (!url) return false;
  return /^https?:\/\/(www\.)?imgur\.com\/(a|gallery)\//i.test(url.trim());
}
