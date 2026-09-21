const STORAGE_KEY = "pedido";
const PERSISTENCE_KEY = "pedido_persistencia";
const CART_STORAGE_VERSION = 2;
const CART_TTL_DAYS = 5;
const CART_TTL_MS = CART_TTL_DAYS * 24 * 60 * 60 * 1000;

let items = [];
let persistenceEnabled = false;
let persistenceDecided = false;
let lastUpdatedAt = null;
let storageNotice = "";

function normalizeItem(item){
  const quantity = Math.max(1, Number.parseInt(item?.quantity, 10) || 1);
  const price = item?.price === null || item?.price === undefined || item?.price === ""
    ? null
    : Number(item.price);

  return {
    id: String(item?.id || ""),
    name: String(item?.name || ""),
    code: String(item?.code || ""),
    price: Number.isFinite(price) && price >= 0 ? price : null,
    quantity
  };
}

function normalizeItems(value){
  return Array.isArray(value)
    ? value.map(normalizeItem).filter(item => item.id)
    : [];
}

function removeStoredCart(){
  try{
    localStorage.removeItem(STORAGE_KEY);
  }catch{
    // Si el navegador bloquea localStorage, el carrito sigue funcionando en memoria.
  }
}

function writePersistencePreference(enabled){
  try{
    localStorage.setItem(PERSISTENCE_KEY, enabled ? "1" : "0");
  }catch{
    // La preferencia no impide el funcionamiento del carrito en memoria.
  }
}

function isExpired(updatedAt){
  const timestamp = Number(updatedAt);
  if(!Number.isFinite(timestamp) || timestamp <= 0) return true;
  return (Date.now() - timestamp) >= CART_TTL_MS;
}

function parseStoredCart(raw){
  if(!raw) return null;

  try{
    return JSON.parse(raw);
  }catch{
    return null;
  }
}

function loadInitialState(){
  let storedRaw = null;
  let storedPreference = null;

  try{
    storedRaw = localStorage.getItem(STORAGE_KEY);
    storedPreference = localStorage.getItem(PERSISTENCE_KEY);
  }catch{
    storedRaw = null;
    storedPreference = null;
  }

  persistenceDecided = storedPreference === "1" || storedPreference === "0";
  persistenceEnabled = storedPreference === "1";
  const parsed = parseStoredCart(storedRaw);

  // Nuevo formato, con persistencia previamente aceptada.
  if(
    persistenceEnabled &&
    parsed &&
    !Array.isArray(parsed) &&
    parsed.version === CART_STORAGE_VERSION
  ){
    if(isExpired(parsed.updatedAt)){
      items = [];
      lastUpdatedAt = null;
      storageNotice = "expired";
      removeStoredCart();
      return;
    }

    items = normalizeItems(parsed.items);
    lastUpdatedAt = Number(parsed.updatedAt) || null;
    return;
  }

  // Migración conservadora desde el formato anterior.
  // Recuperamos los ítems para esta visita, pero no los volvemos a persistir
  // hasta que el usuario elija expresamente guardar el carrito.
  if(parsed){
    const legacyItems = Array.isArray(parsed)
      ? normalizeItems(parsed)
      : normalizeItems(parsed.items);

    if(legacyItems.length){
      items = legacyItems;
      storageNotice = "legacy";
    }
  }

  // Sin aceptación de persistencia, cualquier copia previa se elimina.
  if(!persistenceEnabled){
    removeStoredCart();
  }
}

loadInitialState();

function persistCart({ touch = true } = {}){
  if(!persistenceEnabled){
    removeStoredCart();
    return;
  }

  if(!items.length){
    removeStoredCart();
    return;
  }

  if(touch || !lastUpdatedAt){
    lastUpdatedAt = Date.now();
  }

  const payload = {
    version: CART_STORAGE_VERSION,
    items,
    updatedAt: lastUpdatedAt
  };

  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }catch{
    // Si falla el almacenamiento, la sesión actual conserva el carrito en memoria.
  }
}

export function getCart(){
  return items.map(item => ({ ...item }));
}

export function getCartPersistenceState(){
  return {
    enabled: persistenceEnabled,
    decided: persistenceDecided,
    ttlDays: CART_TTL_DAYS,
    notice: storageNotice
  };
}

export function clearCartStorageNotice(){
  storageNotice = "";
}

export function setCartPersistenceEnabled(enabled){
  persistenceEnabled = Boolean(enabled);
  persistenceDecided = true;
  storageNotice = "";

  writePersistencePreference(persistenceEnabled);

  if(persistenceEnabled){
    persistCart({ touch: true });
  }else{
    lastUpdatedAt = null;
    removeStoredCart();
  }

  return getCartPersistenceState();
}

export function addToCart(product, quantity = 1){
  if(!product) return;

  const amount = Math.max(1, Number.parseInt(quantity, 10) || 1);
  const existing = items.find(item => item.id === product.id);

  if(existing){
    existing.quantity += amount;
  }else{
    items.push(normalizeItem({
      id: product.id,
      name: product.name,
      code: product.code,
      price: product.price,
      quantity: amount
    }));
  }

  persistCart();
}

export function setCartQuantity(id, quantity){
  const item = items.find(entry => entry.id === id);
  if(!item) return;

  item.quantity = Math.max(1, Number.parseInt(quantity, 10) || 1);
  persistCart();
}

export function incrementCartItem(id){
  const item = items.find(entry => entry.id === id);
  if(!item) return;

  item.quantity += 1;
  persistCart();
}

export function decrementCartItem(id){
  const item = items.find(entry => entry.id === id);
  if(!item) return;

  item.quantity = Math.max(1, item.quantity - 1);
  persistCart();
}

export function removeFromCart(id){
  items = items.filter(item => item.id !== id);
  persistCart();
}

export function clearCart(){
  items = [];
  lastUpdatedAt = null;
  removeStoredCart();
}

export function reconcileCart(products){
  const productList = Array.isArray(products) ? products : [];
  const productMap = new Map(
    productList
      .filter(product => product && product.id)
      .map(product => [String(product.id), product])
  );

  let changed = false;
  let removedCount = 0;

  const nextItems = [];

  items.forEach(item => {
    const product = productMap.get(String(item.id));

    if(!product){
      changed = true;
      removedCount += 1;
      return;
    }

    const normalized = normalizeItem({
      id: product.id,
      name: product.name,
      code: product.code,
      price: product.price,
      quantity: item.quantity
    });

    if(
      normalized.name !== item.name ||
      normalized.code !== item.code ||
      normalized.price !== item.price
    ){
      changed = true;
    }

    nextItems.push(normalized);
  });

  if(changed){
    items = nextItems;
    // Reconciliar con catálogo no extiende el TTL: sólo preserva coherencia.
    persistCart({ touch: false });
  }

  if(removedCount > 0){
    storageNotice = "reconciled";
  }

  return {
    changed,
    removedCount
  };
}

export function getCartSummary(){
  const pricedItems = items.filter(item => item.price !== null);

  return {
    units: items.reduce((sum, item) => sum + item.quantity, 0),
    total: pricedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    hasUnpriced: pricedItems.length !== items.length
  };
}

function formatMoney(value, storeConfig){
  const locale = storeConfig.currency?.locale || "es-PY";
  const label = storeConfig.currency?.label || "Gs.";

  return `${label} ${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0
  }).format(value)}`;
}

export function openWhatsAppOrder(storeConfig){
  if(!items.length){
    alert("No hay productos en el carrito");
    return;
  }

  const whatsapp = String(storeConfig?.contact?.whatsapp || "").replace(/\D/g, "");

  if(!whatsapp){
    alert("El comercio todavía no tiene un WhatsApp configurado para recibir pedidos.");
    return;
  }

  const lines = items.map(item => {
    const qty = `${item.quantity} × ${item.name}`;
    const code = item.code ? ` (Código: ${item.code})` : "";

    if(item.price === null){
      return `• ${qty}${code} — Precio a consultar`;
    }

    return `• ${qty}${code}\n  ${formatMoney(item.price, storeConfig)} c/u · Subtotal: ${formatMoney(item.price * item.quantity, storeConfig)}`;
  });

  const summary = getCartSummary();
  let footer = `\n\nTotal estimado: ${formatMoney(summary.total, storeConfig)}`;

  if(summary.hasUnpriced){
    footer += "\n* Hay productos con precio a consultar.";
  }

  const message = encodeURIComponent(
    `Hola ${storeConfig.name}, quiero hacer este pedido:\n\n${lines.join("\n\n")}${footer}`
  );

  window.open(
    `https://wa.me/${whatsapp}?text=${message}`,
    "_blank",
    "noopener"
  );
}
