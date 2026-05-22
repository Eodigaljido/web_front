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
  id?: string;
  thumbnail?: string | null;
  overallDurationMinutes?: number;
  mapPoints?: RoutePoint[];
  /** 백엔드 실제 필드명 */
  routeSteps?: Array<
    | CourseStep
    | {
        id?: number;
        name?: string;
        latitude?: number;
        longitude?: number;
        stayMinutes?: number | null;
        address?: string | null;
      }
  >;
};
