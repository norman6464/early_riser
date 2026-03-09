'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import styles from './page.module.css';

export default function ImageNodeView({ node, deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper className={styles.imageContainer}>
      <img src={node.attrs.src} alt={node.attrs.alt || ''} />
      <button
        type="button"
        className={styles.imageDeleteButton}
        onClick={deleteNode}
        contentEditable={false}
      >
        &times;
      </button>
    </NodeViewWrapper>
  );
}
