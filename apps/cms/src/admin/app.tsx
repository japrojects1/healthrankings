import { Feather, Pencil } from '@strapi/icons';
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
      // Strapi merges custom links with plugin nav and sorts by `position` (default 6).
      // Keep this high so it is easy to find — it is not under Content Manager → Device.
      position: 1,
      permissions: [],
      Component: () => import('./extensions/pages/CatalogAiGenerator'),
    });
    app.addMenuLink({
      to: '/article-ai-writer',
      icon: Pencil,
      intlLabel: {
        id: 'article-ai.writer.menu',
        defaultMessage: 'Article AI writer',
      },
      position: 2,
      permissions: [],
      Component: () => import('./extensions/pages/ArticleAiWriter'),
    });
  },
};
