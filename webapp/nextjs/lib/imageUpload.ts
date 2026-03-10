const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface PresignedUrlResponse {
  uploadUrl: string;
  imageUrl: string;
}

export async function getPresignedUrl(contentType: string, fileName: string): Promise<PresignedUrlResponse> {
  if (!API_URL) {
    throw new Error('画像APIのベースURL (NEXT_PUBLIC_API_URL) が未設定です');
  }
  const res = await fetch(`${API_URL}/api/images/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType, fileName }),
  });

  if (!res.ok) {
    let message = 'プリサインURLの取得に失敗しました';
    try {
      const data = await res.json();
      message = (data?.message as string) || (data?.error as string) || message;
    } catch {
      // no-op
    }
    throw new Error(`${message} (HTTP ${res.status})`);
  }

  return res.json();
}

export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`S3へのアップロードに失敗しました (HTTP ${res.status})`);
  }
}
