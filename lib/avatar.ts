export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024;
export const AVATAR_MAX_DIMENSION = 512;
export const AVATAR_STORAGE_FILENAME = "avatar.webp";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function getAvatarStoragePath(userId: string): string {
  return `${userId}/${AVATAR_STORAGE_FILENAME}`;
}

export function buildAvatarPublicUrl(
  supabaseUrl: string,
  userId: string,
  cacheBust?: number
): string {
  const base = `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${getAvatarStoragePath(userId)}`;
  return cacheBust ? `${base}?t=${cacheBust}` : base;
}

export function isAllowedAvatarMimeType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mimeType);
}

export function isValidAvatarUrl(avatarUrl: string, userId: string): boolean {
  try {
    const url = new URL(avatarUrl);
    const expectedPath = `/storage/v1/object/public/${AVATAR_BUCKET}/${userId}/${AVATAR_STORAGE_FILENAME}`;
    return url.pathname === expectedPath;
  } catch {
    return false;
  }
}
