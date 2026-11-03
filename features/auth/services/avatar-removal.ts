export async function safelyRemoveAvatarObject(removeObject: () => Promise<boolean>) {
  try {
    return await removeObject();
  } catch {
    return false;
  }
}

export async function removeAvatarObjectThenUnlink(
  avatarPath: string | null,
  removeObject: (path: string) => Promise<boolean>,
  unlinkProfile: () => Promise<boolean>,
) {
  if (avatarPath && !await safelyRemoveAvatarObject(() => removeObject(avatarPath))) return { removed: false, unlinked: false };
  try {
    if (!await unlinkProfile()) return { removed: Boolean(avatarPath), unlinked: false };
  } catch {
    return { removed: Boolean(avatarPath), unlinked: false };
  }
  return { removed: Boolean(avatarPath), unlinked: true };
}
