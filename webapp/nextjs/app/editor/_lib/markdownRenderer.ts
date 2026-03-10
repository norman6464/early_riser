/**
 * 簡易Markdownをhtml変換する
 * チャットメッセージ用（見出し、太字、リスト等の基本記法に対応）
 */
export function markdownToHtml(text: string): string {
  return text
    .split('\n')
    .map(line => {
      // 見出し（### → h3, ## → h2）
      if (line.startsWith('### ')) {
        return `<h4>${escapeHtml(line.slice(4))}</h4>`;
      }
      if (line.startsWith('## ')) {
        return `<h3>${escapeHtml(line.slice(3))}</h3>`;
      }
      if (line.startsWith('# ')) {
        return `<h3>${escapeHtml(line.slice(2))}</h3>`;
      }
      // 空行
      if (line.trim() === '') {
        return '<br />';
      }
      // 通常行（インライン記法を処理）
      return `<p>${processInline(escapeHtml(line))}</p>`;
    })
    .join('');
}

/** HTMLエスケープ */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** インライン記法を処理（太字、コード） */
function processInline(text: string): string {
  return text
    // 太字 **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // コード `text`
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
