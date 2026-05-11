import type { Core } from '@strapi/strapi';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function extForMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

function sniffMime(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return 'image/png';
  }
  return 'image/png';
}

/**
 * Persists an image buffer into Strapi Media Library via the upload plugin.
 */
export async function uploadImageBufferAsStrapiMedia(
  strapi: Core.Strapi,
  opts: { buffer: Buffer; filenameBase: string; alternativeText: string; mimetype?: string }
): Promise<{ id: number; mimetype: string }> {
  const headerMime = String(opts.mimetype || '').trim().toLowerCase();
  const mime = IMAGE_MIMES.has(headerMime) ? headerMime : sniffMime(opts.buffer);
  const ext = extForMime(mime);

  const base = String(opts.filenameBase || 'hero')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.(png|jpe?g|webp)$/i, '')
    .slice(0, 96);
  const filename = `${base}.${ext}`;

  const tmpPath = path.join(os.tmpdir(), `hr-article-hero-${Date.now()}-${filename}`);
  await fs.writeFile(tmpPath, opts.buffer);
  try {
    const stat = await fs.stat(tmpPath);
    const uploadService = strapi.plugin('upload').service('upload') as {
      upload: (args: unknown, opts?: unknown) => Promise<unknown>;
    };
    const uploaded = await uploadService.upload(
      {
        data: {
          fileInfo: {
            name: filename,
            alternativeText: opts.alternativeText.slice(0, 250),
            caption: '',
          },
        },
        files: {
          filepath: tmpPath,
          originalFilename: filename,
          mimetype: mime,
          size: stat.size,
        },
      },
      {}
    );
    const row = (Array.isArray(uploaded) ? uploaded[0] : uploaded) as { id?: number } | undefined;
    const id = row?.id;
    if (typeof id !== 'number' || !Number.isFinite(id)) {
      throw new Error('Upload did not return a numeric file id');
    }
    return { id, mimetype: mime };
  } finally {
    await fs.unlink(tmpPath).catch(() => {});
  }
}
