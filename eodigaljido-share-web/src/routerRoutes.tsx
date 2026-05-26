import { useParams } from 'react-router-dom';
import { CollaborativeSharePage } from './pages/CollaborativeSharePage';
import { CourseSharePage } from './pages/CourseSharePage';
import { FriendInvitePage } from './pages/FriendInvitePage';

export function CourseSharePageRoute() {
  const { courseId = '' } = useParams();
  return <CourseSharePage key={courseId} />;
}

export function FriendInvitePageRoute() {
  const { friendCode = '' } = useParams();
  return <FriendInvitePage key={friendCode} />;
}

export function CollaborativeSharePageRoute() {
  const { courseId = '' } = useParams();
  return <CollaborativeSharePage key={courseId} />;
}
