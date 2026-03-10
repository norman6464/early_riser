import { ReactNodeViewRenderer } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import History from '@tiptap/extension-history';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import LinkCard from '../_components/LinkCard/linkCardExtension';
import ImageNodeView from '../_components/ImageNode/ImageNodeView';
export const editorExtensions = [
  Document,
  Heading,
  Image.extend({
    // ブロック要素として扱い、NodeViewWrapperがdivでレンダリングされるようにする
    inline: false,
    group: 'block',
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          parseHTML: (element) => {
            const w = element.getAttribute('width') || element.style.width;
            return w ? parseInt(String(w), 10) || null : null;
          },
          renderHTML: (attributes) => {
            if (!attributes.width) return {};
            return { width: attributes.width };
          },
        },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(ImageNodeView);
    },
  }),
  Paragraph,
  Text,
  Link.configure({
    HTMLAttributes: {
      style: 'color: blue; text-decoration: underline; text-decoration-color: blue;',
    },
  }),
  Underline,
  BulletList,
  OrderedList,
  ListItem,
  Blockquote,
  History,
  HorizontalRule,
  Bold,
  Italic,
  LinkCard,
];
