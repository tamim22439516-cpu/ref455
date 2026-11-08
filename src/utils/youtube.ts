/**
 * Video Utility Helpers for TAWZOON NEXUS
 * Extracts video IDs, builds responsive embeds, and generates auto-thumbnails
 * Supports YouTube, Direct MP4/WebM files, Google Drive previews, and Vimeo
 */

export function extractYouTubeId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const cleaned = url.trim();
  
  // Direct 11-char ID
  if (/^[\w-]{11}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Standard, Shortened, Embed, and Shorts URLs
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i;
  const match = cleaned.match(regex);
  return match ? match[1] : null;
}

export function getYouTubeThumbnail(videoIdOrUrl?: string | null): string | null {
  const id = extractYouTubeId(videoIdOrUrl);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function getYouTubeEmbedUrl(videoIdOrUrl?: string | null, autoplay = false): string | null {
  const id = extractYouTubeId(videoIdOrUrl);
  return id ? `https://www.youtube.com/embed/${id}${autoplay ? '?autoplay=1&rel=0' : '?rel=0'}` : null;
}

export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleaned = url.trim().toLowerCase();
  return (
    cleaned.startsWith('data:video/') ||
    cleaned.startsWith('blob:') ||
    cleaned.includes('/uploads/videos/') ||
    cleaned.endsWith('.mp4') ||
    cleaned.endsWith('.webm') ||
    cleaned.endsWith('.ogv') ||
    cleaned.endsWith('.m4v') ||
    cleaned.includes('.mp4?') ||
    cleaned.includes('.webm?')
  );
}

export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('drive.google.com');
}

export function getGoogleDriveEmbedUrl(url?: string | null): string | null {
  if (!url || !isGoogleDriveUrl(url)) return null;
  // Convert /view to /preview
  return url.replace(/\/view(\?.*)?$/, '/preview');
}

export function isVimeoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('vimeo.com');
}

export function getVimeoEmbedUrl(url?: string | null, autoplay = false): string | null {
  if (!url || !isVimeoUrl(url)) return null;
  const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
  if (match && match[3]) {
    return `https://player.vimeo.com/video/${match[3]}${autoplay ? '?autoplay=1' : ''}`;
  }
  return null;
}

export type VideoSourceType = 'youtube' | 'direct' | 'drive' | 'vimeo' | 'unknown';

export function getVideoType(url?: string | null): VideoSourceType {
  if (!url) return 'unknown';
  if (extractYouTubeId(url)) return 'youtube';
  if (isDirectVideoUrl(url)) return 'direct';
  if (isGoogleDriveUrl(url)) return 'drive';
  if (isVimeoUrl(url)) return 'vimeo';
  return 'unknown';
}

export function getVideoEmbedUrl(url?: string | null, autoplay = false): string | null {
  if (!url) return null;
  const yt = getYouTubeEmbedUrl(url, autoplay);
  if (yt) return yt;
  const drive = getGoogleDriveEmbedUrl(url);
  if (drive) return drive;
  const vimeo = getVimeoEmbedUrl(url, autoplay);
  if (vimeo) return vimeo;
  return null;
}

export function getVideoThumbnail(video?: { thumbnailUrl?: string; videoUrl?: string } | null): string | null {
  if (!video) return null;
  if (video.thumbnailUrl && video.thumbnailUrl.trim().length > 0) {
    return video.thumbnailUrl.trim();
  }
  if (video.videoUrl) {
    const ytThumb = getYouTubeThumbnail(video.videoUrl);
    if (ytThumb) return ytThumb;
  }
  return null;
}

