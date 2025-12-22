/**
 * LearnMappers Console — Sunday App Manifest
 * Console shell + tabbed pages, backed by existing LearnMappers content under /sites/learnmappers.
 */

export default {
  name: 'LearnMappers Console',
  version: '0.1.0',
  apiBase: '/api',

  // Keep discovery off to avoid accidentally exposing Quick Server pages in this console.
  autoDiscover: false,

  contentContainerId: 'contentContainer',
  tabsContainerId: 'mainTabs',
  headerContainerId: 'global-header-container',

  // Shared cartridge location (auth, etc.)
  cartridges: {
    // Smart Cartridges: use a relative base so this console works both:
    // - standalone at `/`  -> /cartridges/...
    // - mounted at `/learnmappers` -> /learnmappers/cartridges/...
    sharedPath: 'cartridges'
  },

  routes: {
    '': {
      page: 'home',
      title: 'Home',
      fallback: './html/home.html'
    },
    home: {
      page: 'home',
      title: 'Home',
      fallback: './html/home.html'
    },
    services: {
      page: 'services',
      title: 'Services',
      fallback: './html/services.html'
    },
    inventory: {
      page: 'inventory',
      title: 'Inventory',
      fallback: './html/inventory.html'
    },
    relationships: {
      page: 'relationships',
      title: 'Relationships',
      fallback: './html/relationships.html'
    },
    imports: {
      page: 'imports',
      title: 'Imports',
      fallback: './html/imports.html'
    },
    docs: {
      page: 'docs',
      title: 'Docs',
      fallback: './html/docs.html'
    },
    carts: {
      page: 'carts',
      title: 'Carts',
      fallback: './html/carts.html'
    },
    settings: {
      page: 'settings',
      title: 'Settings',
      fallback: './html/settings.html'
    },
    login: {
      page: 'login',
      title: 'Sign In',
      fallback: './html/login.html'
    }
  },

  tabs: [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'services', label: 'Services', icon: '🧩' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'relationships', label: 'Relationships', icon: '🕸️' },
    { id: 'imports', label: 'Imports', icon: '⬇️' },
    { id: 'docs', label: 'Docs', icon: '📚' },
    { id: 'carts', label: 'Carts', icon: '🛒' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]
};
