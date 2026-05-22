export type CourseStep = {
  name: string;
  durationMinutes?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

export type RoutePoint = {
  lat: number;
  lng: number;
  name?: string;
  label?: string;
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
  routePoints?: RoutePoint[];
};

export type CourseApiResponse = Partial<CoursePreview> & {
  overallDurationMinutes?: number;
  mapPoints?: RoutePoint[];
};
