'use client';

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import styles from './LinkCard.module.css';

export default function LinkCardView({ node, deleteNode }: NodeViewProps) {
  const { url, title, description, image } = node.attrs;

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <NodeViewWrapper>
      <div className={styles.card} onClick={handleClick} role="link" tabIndex={0}>
        {image && (
          <div className={styles.imageWrapper}>
            <img src={image} alt={title || ''} className={styles.image} />
          </div>
        )}
        <div className={styles.content}>
          {title && <div className={styles.title}>{title}</div>}
          {description && <div className={styles.description}>{description}</div>}
          <div className={styles.url}>{url}</div>
        </div>
        <button
          className={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            deleteNode();
          }}
          title="削除"
        >
          ×
        </button>
      </div>
    </NodeViewWrapper>
  );
}
