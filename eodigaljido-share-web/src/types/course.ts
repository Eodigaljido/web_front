export type CourseStep = {
  name: string;
  durationMinutes?: number;
};

export type CoursePreview = {
  courseId: string;
  title: string;
  region?: string;
  category?: string;
  durationLabel?: string;
  thumbnailUrl?: string | null;
  departure?: string;
  arrival?: string;
  tags?: string[];
  saveCount?: number;
  rating?: number;
  steps?: CourseStep[];
};

export type CourseApiResponse = Partial<CoursePreview> & {
  overallDurationMinutes?: number;
};
