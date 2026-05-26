import { createBrowserRouter } from 'react-router-dom';
import { CollaborativeSharePage } from './pages/CollaborativeSharePage';
import { CourseSharePage } from './pages/CourseSharePage';
import { FriendInvitePage } from './pages/FriendInvitePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/courses/public/:courseId', element: <CourseSharePage /> },
  { path: '/friends/add/:friendCode', element: <FriendInvitePage /> },
  { path: '/routes/collaborative/:courseId', element: <CollaborativeSharePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
