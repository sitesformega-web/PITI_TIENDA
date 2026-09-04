const STORAGE_KEY = "pedido";

function load(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  }catch{
    return [];
  }
}

let items = load();

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getCart(){
  return [...items];
}

export function addToCart(product){
  if(!product || items.some(item => item.id === product.id)) return;

  items.push({
    id: product.id,
    name: product.name,
    code: product.code
  });
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

export function openWhatsAppOrder(storeConfig){
  if(!items.length){
    alert("No hay productos en el carrito");
    return;
  }

  const message = encodeURIComponent(
    `Hola ${storeConfig.name}, quiero hacer pedido con los siguientes productos:\n` +
    items.map(item => `- ${item.name} (Código: ${item.code})`).join("\n")
  );

  window.open(
    `https://wa.me/${storeConfig.contact.whatsapp}?text=${message}`,
    "_blank",
    "noopener"
  );
}
