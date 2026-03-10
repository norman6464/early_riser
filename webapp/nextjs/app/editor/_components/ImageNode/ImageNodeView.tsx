'use client';

import { useState, useRef, useCallback } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import styles from './ImageNodeView.module.css';

export default function ImageNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const width = node.attrs.width as number | null;

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    const img = container.querySelector('img');
    if (!img) return;

    startXRef.current = e.clientX;
    startWidthRef.current = img.getBoundingClientRect().width;
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(100, Math.round(startWidthRef.current + diff));
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateAttributes]);

  return (
    <NodeViewWrapper
      className={`${styles.imageContainer} ${selected ? styles.imageSelected : ''} ${isResizing ? styles.imageResizing : ''}`}
      ref={containerRef}
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        style={width ? { width: `${width}px` } : undefined}
        draggable={false}
      />

      {/* リサイズハンドル（右下） */}
      <div
        className={styles.resizeHandle}
        onMouseDown={handleResizeStart}
        contentEditable={false}
      />

      {/* 幅表示 */}
      {isResizing && width && (
        <div className={styles.widthIndicator} contentEditable={false}>
          {width}px
        </div>
      )}

      {/* 削除ボタン */}
      <button
        type="button"
        className={styles.imageDeleteButton}
        onClick={deleteNode}
        contentEditable={false}
        aria-label="画像を削除"
      >
        &times;
      </button>
    </NodeViewWrapper>
  );
}
