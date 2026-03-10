import { CommentItem } from './CommentItem';
import styles from '../../page.module.css';

export interface DisplayComment {
  id: number;
  content: string;
  createdAt: Date;
}

interface CommentListProps {
  comments: DisplayComment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className={styles.commentsList}>
        <div className={styles.noComments}>コメントはまだありません</div>
      </div>
    );
  }

  return (
    <div className={styles.commentsList}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          content={comment.content}
          createdAt={comment.createdAt}
        />
      ))}
    </div>
  );
}
