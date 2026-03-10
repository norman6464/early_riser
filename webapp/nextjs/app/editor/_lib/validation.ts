export const countWithoutLineBreaks = (text: string | null | undefined): number => {
  if (!text) return 0;
  return text.replace(/[\r\n]/g, '').length;
};
