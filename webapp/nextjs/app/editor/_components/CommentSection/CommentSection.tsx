'use client';

import { useState, useMemo, useCallback } from 'react';
import { CommentList, type DisplayComment } from './CommentList';
import { CommentForm } from './CommentForm';
import { useComments, type Comment as FetchedComment } from '../../_hooks/useComments';
import { useSaveComment } from '../../_hooks/useSaveComment';
import styles from '../../page.module.css';

interface CommentSectionProps {
  pressReleaseId?: number;
}

interface LocalComment {
  id: number;
  content: string;
  createdAt: Date;
}

export default function CommentSection({ pressReleaseId }: CommentSectionProps) {
  const [localComments, setLocalComments] = useState<LocalComment[]>([]);

  const { data: fetchedComments = [] } = useComments(pressReleaseId);
  const saveComment = useSaveComment();

  const displayComments: DisplayComment[] = useMemo(() => {
    if (pressReleaseId) {
      return (fetchedComments as FetchedComment[]).map((c) => ({
        id: c.id,
        content: c.body,
        createdAt: new Date(c.created_at),
      }));
    }
    return localComments;
  }, [pressReleaseId, fetchedComments, localComments]);

  const handleSubmit = useCallback(
    async (contentJson: string) => {
      if (pressReleaseId) {
        await saveComment.mutateAsync({ body: contentJson });
      } else {
        const newComment: LocalComment = {
          id: Date.now(),
          content: contentJson,
          createdAt: new Date(),
        };
        setLocalComments((prev) => [newComment, ...prev]);
      }
    },
    [pressReleaseId, saveComment],
  );

  return (
    <div className={styles.commentSection}>
      <h2 className={styles.commentTitle}>コメント</h2>
      <CommentList comments={displayComments} />
      <CommentForm pressReleaseId={pressReleaseId} onSubmit={handleSubmit} />
    </div>
  );
}
