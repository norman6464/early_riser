const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface PresignedUrlResponse {
  uploadUrl: string;
  imageUrl: string;
}

export async function getPresignedUrl(contentType: string, fileName: string): Promise<PresignedUrlResponse> {
  const res = await fetch(`${API_URL}/api/images/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType, fileName }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'プリサインURLの取得に失敗しました');
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
    throw new Error('S3へのアップロードに失敗しました');
  }
}
