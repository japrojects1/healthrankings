import type { Core } from '@strapi/strapi';

/**
 * Upload provider:
 *
 * - When `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, and `CLOUDINARY_SECRET` are set,
 *   uploads go to Cloudinary (durable, CDN-served). REQUIRED in production —
 *   Render's container disk is wiped on every deploy/restart, so the default
 *   local provider loses every uploaded image after a few hours.
 *
 * - When the env vars are missing (e.g. local dev without Cloudinary keys),
 *   we fall through to Strapi's default local provider so contributors can
 *   still smoke-test uploads on their machines.
 */
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const cloudName = env('CLOUDINARY_NAME');
  const apiKey = env('CLOUDINARY_KEY');
  const apiSecret = env('CLOUDINARY_SECRET');

  if (cloudName && apiKey && apiSecret) {
    return {
      upload: {
        config: {
          provider: 'cloudinary',
          providerOptions: {
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
          },
          actionOptions: {
            upload: {},
            uploadStream: {},
            delete: {},
          },
        },
      },
    };
  }

  return {};
};

export default config;
