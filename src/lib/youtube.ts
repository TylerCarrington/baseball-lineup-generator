export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  
  // Handles youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID, youtube.com/shorts/ID, etc.
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = cleanUrl.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  
  // Fallback for raw 11-char ID
  if (/^[\w-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }
  
  return null;
}
