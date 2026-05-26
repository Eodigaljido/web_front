import { apiClient } from './client';
import { isPreviewUnavailable } from './previewErrors';
import type { FriendInvitePreview } from '../types/friend';

export async function fetchFriendInvitePreview(
  friendCode: string,
): Promise<FriendInvitePreview | null> {
  try {
    const { data } = await apiClient.get<FriendInvitePreview>(
      `/api/friends/code/${encodeURIComponent(friendCode)}/preview`,
    );
    if (data?.nickname) {
      return {
        friendCode: data.friendCode ?? friendCode,
        nickname: data.nickname,
        profileImageUrl: data.profileImageUrl,
      };
    }
    return null;
  } catch (error) {
    if (isPreviewUnavailable(error)) return null;
    throw error;
  }
}

export function buildFallbackInvite(friendCode: string): FriendInvitePreview {
  return {
    friendCode: friendCode.toUpperCase(),
    nickname: '친구',
    profileImageUrl: null,
  };
}
