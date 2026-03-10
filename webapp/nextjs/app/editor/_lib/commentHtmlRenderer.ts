import { generateHTML } from '@tiptap/html';
import DOMPurify from 'dompurify';
import { Node } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';

const LinkCardHtml = Node.create({
  name: 'linkCard',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      url: { default: '' },
      title: { default: '' },
      description: { default: '' },
      image: { default: '' },
    } as const;
  },
  renderHTML({ HTMLAttributes }) {
    const url = String(HTMLAttributes.url || '');
    const title = String(HTMLAttributes.title || '');
    const description = String(HTMLAttributes.description || '');
    const image = String(HTMLAttributes.image || '');
    const domain = (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return url;
      }
    })();

    const contentChildren: unknown[] = [
      { class: 'clc-content' },
      ['div', { class: 'clc-domain' }, domain],
    ];
    if (title) contentChildren.push(['div', { class: 'clc-title' }, title]);
    if (description) contentChildren.push(['div', { class: 'clc-description' }, description]);

    const children: unknown[] = [
      { href: url, target: '_blank', rel: 'noopener noreferrer', class: 'comment-link-card' },
    ];
    if (image) {
      children.push(
        ['div', { class: 'clc-imageWrapper' }, ['img', { class: 'clc-image', src: image, alt: title || domain }]],
      );
    }
    children.push(['div', ...contentChildren]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ['a', ...children] as any;
  },
});

const commentExtensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Underline,
  Link.configure({ HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
  BulletList,
  OrderedList,
  ListItem,
  Heading,
  Image,
  LinkCardHtml,
];

/**
 * TipTap JSON -> サニタイズ済みHTML に変換する。
 * JSONパースに失敗した場合はプレーンテキストとしてサニタイズして返す。
 */
export function renderCommentHtml(contentString: string): string {
  try {
    const json = JSON.parse(contentString);
    const html = generateHTML(json, commentExtensions);
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  } catch {
    return DOMPurify.sanitize(contentString);
  }
}
