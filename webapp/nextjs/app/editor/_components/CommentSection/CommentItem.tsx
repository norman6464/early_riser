import { memo } from 'react';
import { renderCommentHtml } from '../../_lib/commentHtmlRenderer';
import { formatDate } from '../../_lib/formatDate';
import styles from '../../page.module.css';

interface CommentItemProps {
  content: string;
  createdAt: Date;
}

function CommentItemInner({ content, createdAt }: CommentItemProps) {
  return (
    <div className={styles.commentItem}>
      <div className={styles.commentHeader}>
        <span className={styles.commentDate}>{formatDate(createdAt)}</span>
      </div>
      <div
        className={styles.commentBody}
        dangerouslySetInnerHTML={{ __html: renderCommentHtml(content) }}
      />
    </div>
  );
}

export const CommentItem = memo(CommentItemInner);
