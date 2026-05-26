import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import {
  CollaborativeSharePageRoute,
  CourseSharePageRoute,
  FriendInvitePageRoute,
} from './routerRoutes';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/courses/public/:courseId', element: <CourseSharePageRoute /> },
  { path: '/friends/add/:friendCode', element: <FriendInvitePageRoute /> },
  { path: '/routes/collaborative/:courseId', element: <CollaborativeSharePageRoute /> },
  { path: '*', element: <NotFoundPage /> },
]);
