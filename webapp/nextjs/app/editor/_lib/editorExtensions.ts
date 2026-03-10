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
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import ImageNodeView from '../_components/ImageNodeView';
import LinkCard from '../_components/LinkCard/linkCardExtension';

export const editorExtensions = [
  Document,
  Heading,
  Image.extend({
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
  Bold,
  Italic,
  LinkCard,
];
