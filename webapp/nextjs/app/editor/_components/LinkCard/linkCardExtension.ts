import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import LinkCardView from './LinkCardView';

export interface LinkCardAttributes {
  url: string;
  title: string;
  description: string;
  image: string;
}

const LinkCard = Node.create({
  name: 'linkCard',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: { default: '' },
      title: { default: '' },
      description: { default: '' },
      image: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-link-card]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-link-card': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkCardView);
  },
});

export default LinkCard;
