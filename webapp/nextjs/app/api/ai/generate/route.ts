import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI APIキーが設定されていません' },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });
  const body = await request.json();
  const {
    companyName,
    businessDescription,
    employeeCount,
    challenge,
    appeal,
    categoryName,
    purpose,
  } = body;

  if (!companyName || !categoryName) {
    return NextResponse.json(
      { error: '企業名とカテゴリは必須です' },
      { status: 400 }
    );
  }

  // 💡 Systemプロンプト：ここでURLの事例から得た「成功法則」をAIに叩き込みます
  const systemPrompt = `あなたは中小企業の隠れた魅力を引き出し、メディアの注目を集める凄腕のPRディレクターです。
以下の【成功するPRの黄金法則】を必ず守り、読者の心を動かすプレスリリースを作成してください。
出力は指定されたJSON形式のみとし、他のテキストは一切含めないでください。

【成功するPRの黄金法則】
1. ストーリーの重視: 単なる機能紹介ではなく、「なぜそれをやるのか」「どんな苦労や経営課題を乗り越えたのか」という開発秘話や背景を前面に出すこと。
2. 意外性とギャップ: 「土木会社×スキンクリーム」「町工場×スタイリッシュ」「老舗和菓子店×非日常」のような、業界の常識を覆す意外な組み合わせや発想の転換を強調すること。
3. 社会的意義の提示: 自社の利益だけでなく、「製造業のネガティブなイメージを変えたい」「伝統技術を次世代へ繋ぐ」といった大きなビジョンや情熱を語ること。
4. 解像度の高い描写: 「○○」のようなプレースホルダー（穴埋め）は極力避け、提供された情報を最大限に膨らませて具体的な文章にすること。`;

  // 💡 Userプロンプト：優先順位を「目的・カテゴリ」→「背景（企業情報）」の順に変更します
  const userPrompt = `以下の【発信の目的】と【カテゴリ】を最重要テーマとして、3つの異なる切り口（アプローチ）でプレスリリースのテンプレート候補を生成してください。
【企業情報】は、そのストーリーを裏付けるための背景（スパイス）として自然に組み込んでください。

## 1. 最重要テーマ
- プレスリリースの目的: ${purpose || 'ステークホルダーへの周知と自社のブランディング向上'}
- カテゴリ: ${categoryName}

## 2. 背景となる企業情報
- 会社名: ${companyName}
- 自社の課題・背景: ${challenge || '未設定'}
- アピールポイント: ${appeal || '未設定'}
- 事業内容: ${businessDescription || '未設定'}
- 従業員数: ${employeeCount || '未設定'}名

## 3. 指示事項
- 3つの候補は、上記の「黄金法則」に基づき、それぞれ全く異なる切り口（例: 開発ストーリー特化型、業界課題解決型、地域・社会貢献型など）で作成してください。
- 各候補はプレスリリースとして適切な構成（キャッチーな見出し、リード文、本文、今後の展望、会社概要など）を含めること。

## 4. 出力JSON形式（厳守）
{
  "candidates": [
    {
      "title": "読者の目を惹きつけるキャッチーなタイトル",
      "content": {
        "type": "doc",
        "content": [
          {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "見出し"}]},
          {"type": "paragraph", "content": [{"type": "text", "text": "本文テキスト"}]},
          {"type": "paragraph"}
        ]
      }
    }
  ]
}

※contentのノードタイプは heading(attrs: {level: 2}), paragraph, text のみを使用し、空行は {"type": "paragraph"} で表現してください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    // ... 以降のレスポンス処理は元のコードと同じ ...
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json({ error: 'OpenAIからの応答が空です' }, { status: 500 });
    }

    const parsed = JSON.parse(responseText);

    if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
      return NextResponse.json({ error: '不正なレスポンス形式です' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'テンプレートの生成に失敗しました' },
      { status: 500 }
    );
  }
}