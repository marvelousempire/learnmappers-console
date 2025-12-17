(function() {
  'use strict';

  const CONFIG_URL = '/sites/learnmappers/config.json';
  const CARTS_KEY = 'learnmappers-console-carts-v1';

  let configCache = null;

  async function loadConfig() {
    if (configCache) return configCache;
    const res = await fetch(CONFIG_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load LearnMappers config: HTTP ${res.status}`);
    configCache = await res.json();
    return configCache;
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  function loadCartsState() {
    try {
      const raw = localStorage.getItem(CARTS_KEY);
      if (!raw) return createDefaultCartsState();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.carts)) return createDefaultCartsState();
      if (!parsed.activeCartId) parsed.activeCartId = parsed.carts[0]?.id;
      return parsed;
    } catch {
      return createDefaultCartsState();
    }
  }

  function saveCartsState(state) {
    localStorage.setItem(CARTS_KEY, JSON.stringify(state, null, 2));
  }

  function createDefaultCartsState() {
    const id = uid('cart');
    return {
      activeCartId: id,
      carts: [
        {
          id,
          name: 'Default Cart',
          createdAt: new Date().toISOString(),
          items: []
        }
      ]
    };
  }

  function getActiveCart(state) {
    return state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
  }

  function addItemToActiveCart(item) {
    const state = loadCartsState();
    const cart = getActiveCart(state);
    if (!cart.items) cart.items = [];

    cart.items.push({
      id: uid('item'),
      addedAt: new Date().toISOString(),
      ...item
    });

    saveCartsState(state);
    return state;
  }

  function removeItem(cartId, itemId) {
    const state = loadCartsState();
    const cart = state.carts.find(c => c.id === cartId);
    if (!cart) return state;
    cart.items = (cart.items || []).filter(i => i.id !== itemId);
    saveCartsState(state);
    return state;
  }

  function createCart(name) {
    const state = loadCartsState();
    const newCart = {
      id: uid('cart'),
      name: name || `Cart ${state.carts.length + 1}`,
      createdAt: new Date().toISOString(),
      items: []
    };
    state.carts.unshift(newCart);
    state.activeCartId = newCart.id;
    saveCartsState(state);
    return state;
  }

  function setActiveCart(cartId) {
    const state = loadCartsState();
    if (state.carts.some(c => c.id === cartId)) {
      state.activeCartId = cartId;
      saveCartsState(state);
    }
    return state;
  }

  function deleteCart(cartId) {
    const state = loadCartsState();
    const remaining = state.carts.filter(c => c.id !== cartId);
    state.carts = remaining.length ? remaining : createDefaultCartsState().carts;
    if (!state.carts.some(c => c.id === state.activeCartId)) {
      state.activeCartId = state.carts[0]?.id;
    }
    saveCartsState(state);
    return state;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  window.LearnMappersConsole = {
    loadConfig,
    loadCartsState,
    saveCartsState,
    addItemToActiveCart,
    removeItem,
    createCart,
    setActiveCart,
    deleteCart,
    escapeHtml
  };
})();
