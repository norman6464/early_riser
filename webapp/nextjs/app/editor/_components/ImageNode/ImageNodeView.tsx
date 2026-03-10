'use client';

import { useState, useRef, useCallback } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import styles from './ImageNodeView.module.css';

// リサイズ方向の定義
type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

// 各方向のカーソルスタイル
const cursorMap: Record<ResizeDirection, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
};

// 各方向のCSS位置クラス名
const positionClassMap: Record<ResizeDirection, string> = {
  n: 'handleN',
  s: 'handleS',
  e: 'handleE',
  w: 'handleW',
  ne: 'handleNE',
  nw: 'handleNW',
  se: 'handleSE',
  sw: 'handleSW',
};

// 辺ハンドルかどうか
const isEdgeHandle = (dir: ResizeDirection) => ['n', 's', 'e', 'w'].includes(dir);

const ALL_DIRECTIONS: ResizeDirection[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export default function ImageNodeView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const width = node.attrs.width as number | null;
  const height = node.attrs.height as number | null;

  // CSSの:hoverがTipTapのDOM構造で効かないため、JSで管理
  const showControls = selected || isHovered || isResizing;

  const handleResizeStart = useCallback((direction: ResizeDirection) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const img = imgRef.current;
    if (!img) return;

    // エディタのフォーカスを奪わないようにする
    editor.view.dom.style.pointerEvents = 'none';

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = img.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    const aspectRatio = startWidth / startHeight;

    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const diffX = moveEvent.clientX - startX;
      const diffY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // 方向に応じたサイズ変更
      const hasHorizontal = direction.includes('e') || direction.includes('w');
      const hasVertical = direction.includes('n') || direction.includes('s');
      const isCorner = hasHorizontal && hasVertical;

      if (hasHorizontal) {
        const xSign = direction.includes('e') ? 1 : -1;
        newWidth = startWidth + diffX * xSign;
      }

      if (hasVertical) {
        const ySign = direction.includes('s') ? 1 : -1;
        newHeight = startHeight + diffY * ySign;
      }

      // 角ハンドルはアスペクト比を維持
      if (isCorner) {
        // より大きい変化量の方向に合わせてアスペクト比維持
        const widthRatio = Math.abs(newWidth - startWidth) / startWidth;
        const heightRatio = Math.abs(newHeight - startHeight) / startHeight;
        if (widthRatio >= heightRatio) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }

      // 横幅のみの場合はheightをautoに
      if (hasHorizontal && !hasVertical) {
        newWidth = Math.max(50, Math.round(newWidth));
        updateAttributes({ width: newWidth, height: null });
        return;
      }

      // 縦幅のみの場合はwidthをautoに
      if (hasVertical && !hasHorizontal) {
        newHeight = Math.max(50, Math.round(newHeight));
        updateAttributes({ width: null, height: newHeight });
        return;
      }

      // 角の場合は両方設定
      newWidth = Math.max(50, Math.round(newWidth));
      newHeight = Math.max(50, Math.round(newHeight));
      updateAttributes({ width: newWidth, height: newHeight });
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

  // 画像のstyle計算
  const imgStyle: React.CSSProperties = {};
  if (width) imgStyle.width = `${width}px`;
  if (height) imgStyle.height = `${height}px`;

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
        style={Object.keys(imgStyle).length > 0 ? imgStyle : undefined}
        draggable={false}
      />

      {/* 8方向リサイズハンドル */}
      {ALL_DIRECTIONS.map((dir) => (
        <div
          key={dir}
          className={`${styles.resizeHandle} ${isEdgeHandle(dir) ? styles.resizeHandleEdge : styles.resizeHandleCorner} ${styles[positionClassMap[dir]]} ${showControls ? styles.resizeHandleVisible : ''}`}
          style={{ cursor: cursorMap[dir] }}
          onPointerDown={handleResizeStart(dir)}
          contentEditable={false}
        />
      ))}

      {/* サイズ表示 */}
      {isResizing && (width || height) && (
        <div className={styles.sizeIndicator} contentEditable={false}>
          {width || 'auto'} x {height || 'auto'}
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
