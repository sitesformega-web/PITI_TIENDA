const STORAGE_KEY = "pedido";

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

function load(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.map(normalizeItem).filter(item => item.id) : [];
  }catch{
    return [];
  }
}

let items = load();

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getCart(){
  return items.map(item => ({ ...item }));
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
  save();
}

export function setCartQuantity(id, quantity){
  const item = items.find(entry => entry.id === id);
  if(!item) return;
  item.quantity = Math.max(1, Number.parseInt(quantity, 10) || 1);
  save();
}

export function incrementCartItem(id){
  const item = items.find(entry => entry.id === id);
  if(!item) return;
  item.quantity += 1;
  save();
}

export function decrementCartItem(id){
  const item = items.find(entry => entry.id === id);
  if(!item) return;
  item.quantity = Math.max(1, item.quantity - 1);
  save();
}

export function removeFromCart(id){
  items = items.filter(item => item.id !== id);
  save();
}

export function clearCart(){
  items = [];
  save();
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
  return `${label} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)}`;
}

export function openWhatsAppOrder(storeConfig){
  if(!items.length){
    alert("No hay productos en el carrito");
    return;
  }

  const lines = items.map(item => {
    const qty = `${item.quantity} × ${item.name}`;
    const code = item.code ? ` (Código: ${item.code})` : "";
    if(item.price === null) return `• ${qty}${code} — Precio a consultar`;
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
    `https://wa.me/${storeConfig.contact.whatsapp}?text=${message}`,
    "_blank",
    "noopener"
  );
}
