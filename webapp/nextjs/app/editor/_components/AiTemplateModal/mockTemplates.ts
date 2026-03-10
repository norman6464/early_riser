import type { TipTapContent } from '@/lib/types';
import type { AiTemplateFormData } from './types';

function textNode(text: string) {
  return { type: 'text', text };
}

function paragraph(text: string) {
  return { type: 'paragraph', content: [textNode(text)] };
}

function heading(text: string, level: number) {
  return { type: 'heading', attrs: { level }, content: [textNode(text)] };
}

function emptyParagraph() {
  return { type: 'paragraph' };
}

export function generateMockTemplate(formData: AiTemplateFormData): { title: string; content: TipTapContent } {
  const { companyName, businessDescription, category } = formData;

  switch (category) {
    case 'new-product':
      return {
        title: `${companyName}、新商品「○○」を発表`,
        content: {
          type: 'doc',
          content: [
            heading('新商品について', 2),
            paragraph(`${companyName}（${businessDescription}）は、この度新商品「○○」を開発・発表いたしました。`),
            emptyParagraph(),
            heading('開発の背景', 2),
            paragraph('近年の市場動向や顧客ニーズの変化を踏まえ、○○の課題を解決するために本商品を開発いたしました。'),
            emptyParagraph(),
            heading('商品の特長', 2),
            paragraph('1. ○○な機能により、従来の課題を解決'),
            paragraph('2. ○○を実現する独自の技術を採用'),
            paragraph('3. ○○なデザインで使いやすさを追求'),
            emptyParagraph(),
            heading('商品概要', 2),
            paragraph('商品名：○○'),
            paragraph('発売日：20XX年XX月XX日'),
            paragraph('価格：○○円（税込）'),
            paragraph('販売チャネル：○○'),
            emptyParagraph(),
            heading('今後の展望', 2),
            paragraph(`${companyName}は今後も革新的な商品開発を通じて、お客様の課題解決に貢献してまいります。`),
            emptyParagraph(),
            heading('会社概要', 2),
            paragraph(`会社名：${companyName}`),
            paragraph(`事業内容：${businessDescription}`),
            paragraph('所在地：○○'),
            paragraph('代表者：○○'),
            paragraph('URL：○○'),
            emptyParagraph(),
            heading('本件に関するお問い合わせ先', 2),
            paragraph(`${companyName} 広報担当`),
            paragraph('TEL：○○-○○○○-○○○○'),
            paragraph('Email：press@example.com'),
          ],
        },
      };

    case 'recruitment':
      return {
        title: `${companyName}、○○職の採用を開始`,
        content: {
          type: 'doc',
          content: [
            heading('採用開始のお知らせ', 2),
            paragraph(`${companyName}（${businessDescription}）は、事業拡大に伴い○○職の採用を開始いたします。`),
            emptyParagraph(),
            heading('採用の背景', 2),
            paragraph('事業の急成長に伴う体制強化のため、新たな人材を募集いたします。当社は○○な環境で、○○に取り組む仲間を求めています。'),
            emptyParagraph(),
            heading('募集要項', 2),
            paragraph('職種：○○'),
            paragraph('雇用形態：正社員'),
            paragraph('勤務地：○○'),
            paragraph('給与：○○'),
            paragraph('応募条件：○○'),
            emptyParagraph(),
            heading('当社で働く魅力', 2),
            paragraph('1. ○○な成長環境'),
            paragraph('2. ○○な福利厚生'),
            paragraph('3. ○○なキャリアパス'),
            emptyParagraph(),
            heading('応募方法', 2),
            paragraph('下記の連絡先までお問い合わせいただくか、採用ページよりご応募ください。'),
            emptyParagraph(),
            heading('会社概要', 2),
            paragraph(`会社名：${companyName}`),
            paragraph(`事業内容：${businessDescription}`),
            paragraph('所在地：○○'),
            paragraph('代表者：○○'),
            paragraph('URL：○○'),
            emptyParagraph(),
            heading('本件に関するお問い合わせ先', 2),
            paragraph(`${companyName} 人事担当`),
            paragraph('TEL：○○-○○○○-○○○○'),
            paragraph('Email：recruit@example.com'),
          ],
        },
      };

    case 'company-story':
      return {
        title: `${companyName}の挑戦 ― ○○で社会を変える`,
        content: {
          type: 'doc',
          content: [
            heading('はじめに', 2),
            paragraph(`${companyName}（${businessDescription}）は、創業以来○○の実現を目指し、挑戦を続けてまいりました。本リリースでは、当社のこれまでの歩みと今後のビジョンをお伝えいたします。`),
            emptyParagraph(),
            heading('創業のきっかけ', 2),
            paragraph('○○という課題に直面したことをきっかけに、「○○を実現したい」という想いから事業を立ち上げました。'),
            emptyParagraph(),
            heading('これまでの歩み', 2),
            paragraph('20XX年：○○を設立'),
            paragraph('20XX年：○○サービスを開始'),
            paragraph('20XX年：○○を達成'),
            paragraph('20XX年：○○へ事業を拡大'),
            emptyParagraph(),
            heading('私たちの強み', 2),
            paragraph('1. ○○に関する深い専門知識'),
            paragraph('2. ○○を可能にする独自の技術'),
            paragraph('3. ○○に寄り添うサポート体制'),
            emptyParagraph(),
            heading('今後のビジョン', 2),
            paragraph(`${companyName}は、○○を通じて社会に貢献し、○○な未来の実現を目指してまいります。`),
            emptyParagraph(),
            heading('会社概要', 2),
            paragraph(`会社名：${companyName}`),
            paragraph(`事業内容：${businessDescription}`),
            paragraph('所在地：○○'),
            paragraph('代表者：○○'),
            paragraph('URL：○○'),
            emptyParagraph(),
            heading('本件に関するお問い合わせ先', 2),
            paragraph(`${companyName} 広報担当`),
            paragraph('TEL：○○-○○○○-○○○○'),
            paragraph('Email：press@example.com'),
          ],
        },
      };

    case 'event-campaign':
      return {
        title: `${companyName}、○○イベントを開催`,
        content: {
          type: 'doc',
          content: [
            heading('イベント開催のお知らせ', 2),
            paragraph(`${companyName}（${businessDescription}）は、○○イベント「○○」を開催いたします。`),
            emptyParagraph(),
            heading('イベント概要', 2),
            paragraph('イベント名：○○'),
            paragraph('開催日時：20XX年XX月XX日（X）XX:XX〜XX:XX'),
            paragraph('会場：○○（住所：○○）'),
            paragraph('参加費：無料 / ○○円'),
            paragraph('定員：○○名'),
            emptyParagraph(),
            heading('開催の目的', 2),
            paragraph('○○をテーマに、○○に関心のある方々に向けて、○○な体験・情報をお届けすることを目的としています。'),
            emptyParagraph(),
            heading('プログラム', 2),
            paragraph('XX:XX　開場・受付'),
            paragraph('XX:XX　オープニング'),
            paragraph('XX:XX　○○セッション'),
            paragraph('XX:XX　○○体験会'),
            paragraph('XX:XX　閉会'),
            emptyParagraph(),
            heading('参加方法', 2),
            paragraph('下記のお問い合わせ先または申込みページよりお申し込みください。'),
            emptyParagraph(),
            heading('会社概要', 2),
            paragraph(`会社名：${companyName}`),
            paragraph(`事業内容：${businessDescription}`),
            paragraph('所在地：○○'),
            paragraph('代表者：○○'),
            paragraph('URL：○○'),
            emptyParagraph(),
            heading('本件に関するお問い合わせ先', 2),
            paragraph(`${companyName} イベント事務局`),
            paragraph('TEL：○○-○○○○-○○○○'),
            paragraph('Email：event@example.com'),
          ],
        },
      };

    default:
      return {
        title: '',
        content: { type: 'doc', content: [emptyParagraph()] },
      };
  }
}
