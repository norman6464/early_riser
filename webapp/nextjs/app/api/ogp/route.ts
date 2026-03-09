import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { code: 'MISSING_URL', message: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { code: 'INVALID_URL', message: 'Invalid URL format' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'bot' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { code: 'FETCH_FAILED', message: `Failed to fetch URL: ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();

    const getMetaContent = (property: string): string => {
      const regex = new RegExp(
        `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
        'i'
      );
      const match = html.match(regex);
      if (match) return match[1];

      const regex2 = new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`,
        'i'
      );
      const match2 = html.match(regex2);
      return match2 ? match2[1] : '';
    };

    const title =
      getMetaContent('og:title') ||
      getMetaContent('twitter:title') ||
      (() => {
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        return titleMatch ? titleMatch[1] : '';
      })();

    const description =
      getMetaContent('og:description') ||
      getMetaContent('twitter:description') ||
      getMetaContent('description');

    let image = getMetaContent('og:image') || getMetaContent('twitter:image');
    if (image && !image.startsWith('http')) {
      const baseUrl = new URL(url);
      image = new URL(image, baseUrl.origin).toString();
    }

    return NextResponse.json({ url, title, description, image });
  } catch (error) {
    console.error('OGP fetch error:', error);
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch OGP data' },
      { status: 502 }
    );
  }
}
