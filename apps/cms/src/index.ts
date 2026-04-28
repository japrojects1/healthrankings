import type { Core } from '@strapi/strapi';

async function enablePublicPermissions(strapi: Core.Strapi) {
  // Enable public read access for Device content type so the Next.js site can fetch it.
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole?.id) return;

  const permissions = await strapi.query('plugin::users-permissions.permission').findMany({
    where: { role: publicRole.id },
  });

  const wanted = new Set([
    'api::device.device.find',
    'api::device.device.findOne',
  ]);

  const byAction = new Map(permissions.map((p: any) => [p.action, p]));
  for (const action of wanted) {
    const existing = byAction.get(action);
    if (existing && existing.enabled) continue;
    if (existing && !existing.enabled) {
      await strapi.query('plugin::users-permissions.permission').update({
        where: { id: existing.id },
        data: { enabled: true },
      });
      continue;
    }
    await strapi.query('plugin::users-permissions.permission').create({
      data: {
        action,
        enabled: true,
        role: publicRole.id,
      },
    });
  }
}

export default {
  register() {},
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await enablePublicPermissions(strapi);
  },
};
