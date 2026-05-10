import { Feather } from '@strapi/icons';
import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    notifications: {
      releases: false,
    },
  },
  register(app: StrapiApp) {
    app.addMenuLink({
      to: '/catalog-ai-generator',
      icon: Feather,
      intlLabel: {
        id: 'catalog-ai.generator.menu',
        defaultMessage: 'Device catalog AI',
      },
      permissions: [],
      Component: () => import('./extensions/pages/CatalogAiGenerator'),
    });
  },
};
