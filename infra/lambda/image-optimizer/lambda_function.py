"""
画像最適化Lambda関数
S3にアップロードされた画像をリサイズ・WebP変換し、最適化済みフォルダに保存する
"""

import os
import io
import urllib.parse
import boto3
from PIL import Image

s3 = boto3.client('s3')

# リサイズの最大幅（px）
MAX_WIDTH = 1200
# WebP品質
WEBP_QUALITY = 80
# 最適化済み画像の保存先プレフィックス
OPTIMIZED_PREFIX = 'optimized/'
# 元画像のプレフィックス
SOURCE_PREFIX = 'images/'


def lambda_handler(event, context):
    """S3イベントトリガーで呼び出されるハンドラー"""
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])

        # 最適化済み画像への再帰呼び出しを防止
        if key.startswith(OPTIMIZED_PREFIX):
            print(f"スキップ: 最適化済み画像 {key}")
            continue

        # 対象プレフィックスのチェック
        if not key.startswith(SOURCE_PREFIX):
            print(f"スキップ: 対象外のキー {key}")
            continue

        print(f"処理開始: {bucket}/{key}")

        try:
            optimize_image(bucket, key)
        except Exception as e:
            print(f"エラー: {bucket}/{key} の処理に失敗 - {e}")
            raise

    return {'statusCode': 200, 'body': 'OK'}


def optimize_image(bucket: str, key: str):
    """画像をリサイズ・WebP変換して保存する"""
    # S3から元画像を取得
    response = s3.get_object(Bucket=bucket, Key=key)
    image_data = response['Body'].read()
    content_type = response.get('ContentType', '')

    # Pillowで画像を開く
    img = Image.open(io.BytesIO(image_data))

    # EXIF情報に基づく回転の適用
    img = apply_exif_rotation(img)

    # RGBAの場合はRGBに変換（WebPはRGBAも対応するが、品質向上のため）
    if img.mode == 'RGBA':
        # 透過画像はそのまま
        pass
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # リサイズ（最大幅を超える場合のみ）
    original_width, original_height = img.size
    if original_width > MAX_WIDTH:
        ratio = MAX_WIDTH / original_width
        new_height = int(original_height * ratio)
        img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
        print(f"リサイズ: {original_width}x{original_height} -> {MAX_WIDTH}x{new_height}")
    else:
        print(f"リサイズ不要: {original_width}x{original_height}")

    # WebP変換して保存
    webp_buffer = io.BytesIO()
    img.save(webp_buffer, format='WEBP', quality=WEBP_QUALITY, method=4)
    webp_buffer.seek(0)

    # 保存先キーを生成（元のファイル名.webp）
    base_name = os.path.splitext(os.path.basename(key))[0]
    optimized_key = f"{OPTIMIZED_PREFIX}{base_name}.webp"

    # S3にアップロード
    s3.put_object(
        Bucket=bucket,
        Key=optimized_key,
        Body=webp_buffer.getvalue(),
        ContentType='image/webp',
        CacheControl='public, max-age=31536000',
    )

    original_size = len(image_data)
    optimized_size = webp_buffer.tell()
    reduction = ((original_size - optimized_size) / original_size) * 100

    print(f"最適化完了: {optimized_key}")
    print(f"サイズ: {original_size:,} bytes -> {optimized_size:,} bytes ({reduction:.1f}% 削減)")


def apply_exif_rotation(img: Image.Image) -> Image.Image:
    """EXIF情報に基づいて画像を正しい向きに回転する"""
    try:
        exif = img.getexif()
        orientation = exif.get(274)  # 274 = Orientation tag

        if orientation == 3:
            img = img.rotate(180, expand=True)
        elif orientation == 6:
            img = img.rotate(270, expand=True)
        elif orientation == 8:
            img = img.rotate(90, expand=True)
    except (AttributeError, KeyError):
        pass

    return img
