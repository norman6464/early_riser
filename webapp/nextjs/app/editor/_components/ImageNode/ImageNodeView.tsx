'use client';

import { useState, useRef, useCallback } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import styles from './ImageNodeView.module.css';

export default function ImageNodeView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const width = node.attrs.width as number | null;

  // CSSの:hoverがTipTapのDOM構造で効かないため、JSで管理
  const showControls = selected || isHovered || isResizing;

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const img = imgRef.current;
    if (!img) return;

    // エディタのフォーカスを奪わないようにする
    editor.view.dom.style.pointerEvents = 'none';

    startXRef.current = e.clientX;
    startWidthRef.current = img.getBoundingClientRect().width;
    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const diff = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(100, Math.round(startWidthRef.current + diff));
      updateAttributes({ width: newWidth });
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      editor.view.dom.style.pointerEvents = '';
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [updateAttributes, editor]);

  return (
    <NodeViewWrapper
      className={`${styles.imageContainer} ${selected ? styles.imageSelected : ''} ${isResizing ? styles.imageResizing : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { if (!isResizing) setIsHovered(false); }}
    >
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        style={width ? { width: `${width}px` } : undefined}
        draggable={false}
      />

      {/* リサイズハンドル（右下） */}
      <div
        className={`${styles.resizeHandle} ${showControls ? styles.resizeHandleVisible : ''}`}
        onPointerDown={handleResizeStart}
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
        className={`${styles.imageDeleteButton} ${showControls ? styles.imageDeleteButtonVisible : ''}`}
        onClick={deleteNode}
        contentEditable={false}
        aria-label="画像を削除"
      >
        &times;
      </button>
    </NodeViewWrapper>
  );
}
