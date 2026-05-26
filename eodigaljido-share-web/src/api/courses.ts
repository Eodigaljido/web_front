import { apiClient } from './client';
import { mergeCoursePreview, normalizeCourse } from './courseNormalize';
import { isPreviewUnavailable } from './previewErrors';
import type { CourseApiResponse, CoursePreview } from '../types/course';

async function fetchFrom(path: string, courseId: string): Promise<CoursePreview | null> {
  try {
    const { data } = await apiClient.get<CourseApiResponse>(path);
    if (!data?.title && !data?.courseId && !(data as Record<string, unknown>).id) {
      return null;
    }
    return normalizeCourse(data, courseId);
  } catch (error) {
    if (isPreviewUnavailable(error)) return null;
    throw error;
  }
}

export async function fetchCoursePreview(courseId: string): Promise<CoursePreview | null> {
  const encoded = encodeURIComponent(courseId);
  const previewPath = `/api/courses/public/${encoded}/preview`;
  const publicDetailPath = `/api/courses/public/${encoded}`;

  const [preview, publicDetail] = await Promise.all([
    fetchFrom(previewPath, courseId),
    fetchFrom(publicDetailPath, courseId),
  ]);

  if (!preview && !publicDetail) return null;
  if (!preview) return publicDetail;
  if (!publicDetail) return preview;

  return mergeCoursePreview(preview, publicDetail);
}

/** 공동 루트 초대 — collaborative preview 우선, 없으면 공개 코스 preview */
export async function fetchCollaborativePreview(
  courseId: string,
): Promise<CoursePreview | null> {
  const encoded = encodeURIComponent(courseId);
  const paths = [
    `/api/courses/collaborative/${encoded}/preview`,
    `/api/courses/public/${encoded}/preview`,
    `/api/courses/public/${encoded}`,
  ];

  let merged: CoursePreview | null = null;
  for (const path of paths) {
    const result = await fetchFrom(path, courseId);
    if (!result) continue;
    merged = merged ? mergeCoursePreview(merged, result) : result;
  }
  return merged;
}
