import { STORE_CONFIG, PLATFORM_CONFIG } from "./config.js?v=notice-takedown-v1";
import { fetchProducts, fetchBusinessConfig } from "./api.js?v=cart-storage-v1-1";
import {
  setProducts,
  getProductById,
  getCategories,
  setActiveCategory,
  getActiveCategory,
  filterProducts
} from "./catalog.js?v=cart-storage-v1-1";
import {
  getCart,
  addToCart,
  incrementCartItem,
  decrementCartItem,
  removeFromCart,
  clearCart,
  openWhatsAppOrder,
  getCartPersistenceState,
  setCartPersistenceEnabled,
  clearCartStorageNotice,
  reconcileCart
} from "./cart.js?v=cart-storage-v1-1";
import {
  applyBranding,
  renderCategories,
  renderProducts,
  renderCart,
  renderStoragePreference,
  setLoading,
  renderLoadError,
  openModal,
  closeModal,
  openDrawer,
  closeDrawer
} from "./ui.js?v=notice-takedown-v1-2";

const searchInput = document.getElementById("searchInput");
const catsDrawerBack = document.getElementById("catsDrawerBack");
const cartDrawerBack = document.getElementById("cartDrawerBack");

let ACTIVE_STORE_CONFIG = STORE_CONFIG;

function buildStoreConfig(business = {}){
  const businessName = String(business.businessName || "").trim();

  return {
    ...STORE_CONFIG,
    name: businessName || STORE_CONFIG.name,
    catalogTitle: businessName || STORE_CONFIG.catalogTitle,
    contact: {
      ...STORE_CONFIG.contact,
      whatsapp: String(business.whatsapp || "").trim()
    },
    social: {
      instagram: String(business.socialInstagram || "").trim(),
      facebook: String(business.socialFacebook || "").trim(),
      tiktok: String(business.socialTikTok || "").trim()
    },
    business
  };
}

function refreshCatalog(){
  renderProducts(filterProducts(searchInput.value), {
    storeConfig: ACTIVE_STORE_CONFIG,
    onOpen: product => openModal(product, handleAddToCart, ACTIVE_STORE_CONFIG),
    onAdd: id => handleAddToCart(id, 1)
  });
}

function refreshCategories(){
  renderCategories(getCategories(), getActiveCategory(), category => {
    setActiveCategory(category);
    refreshCategories();
    refreshCatalog();
    closeDrawer(catsDrawerBack);
    closeDrawer(cartDrawerBack);
  });
}

function handleStoragePreferenceChange(enabled){
  setCartPersistenceEnabled(enabled);
  clearCartStorageNotice();
  refreshCart();
}

function refreshCart(){
  renderCart(getCart(), {
    storeConfig: ACTIVE_STORE_CONFIG,
    onIncrement: id => {
      incrementCartItem(id);
      refreshCart();
    },
    onDecrement: id => {
      decrementCartItem(id);
      refreshCart();
    },
    onRemove: id => {
      removeFromCart(id);
      refreshCart();
    }
  });

  renderStoragePreference(getCartPersistenceState(), {
    onChange: handleStoragePreferenceChange
  });
}

function handleAddToCart(id, quantity = 1){
  const product = getProductById(id);
  if(!product) return;
  addToCart(product, quantity);
  clearCartStorageNotice();
  closeModal();
  refreshCart();
}

async function bootstrap(){
  setLoading(true);

  try{
    try{
      const business = await fetchBusinessConfig();
      ACTIVE_STORE_CONFIG = buildStoreConfig(business);
    }catch(error){
      console.error("No se pudo cargar la información pública del comercio.", error);
      ACTIVE_STORE_CONFIG = buildStoreConfig({});
    }

    applyBranding(ACTIVE_STORE_CONFIG, PLATFORM_CONFIG);

    const products = await fetchProducts();
    setProducts(products);
    reconcileCart(products);

    refreshCart();
    refreshCategories();
    refreshCatalog();
  }catch(error){
    console.error(error);
    renderLoadError();
  }finally{
    setLoading(false);
  }
}

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("modalBack").addEventListener("click", event => {
  if(event.target === event.currentTarget) closeModal();
});

document.getElementById("openCatsFab").addEventListener("click", () => openDrawer(catsDrawerBack));
document.getElementById("openCartFab").addEventListener("click", () => openDrawer(cartDrawerBack));
document.getElementById("closeCatsDrawer").addEventListener("click", () => closeDrawer(catsDrawerBack));
document.getElementById("closeCartDrawer").addEventListener("click", () => closeDrawer(cartDrawerBack));

catsDrawerBack.addEventListener("click", event => {
  if(event.target === catsDrawerBack) closeDrawer(catsDrawerBack);
});
cartDrawerBack.addEventListener("click", event => {
  if(event.target === cartDrawerBack) closeDrawer(cartDrawerBack);
});

document.getElementById("sendCartBtn").addEventListener("click", () => openWhatsAppOrder(ACTIVE_STORE_CONFIG));
document.getElementById("sendCartBtnMobile").addEventListener("click", () => openWhatsAppOrder(ACTIVE_STORE_CONFIG));

function handleClearCart(){
  clearCart();
  clearCartStorageNotice();
  refreshCart();
}
document.getElementById("clearCartBtn").addEventListener("click", handleClearCart);
document.getElementById("clearCartBtnMobile").addEventListener("click", handleClearCart);

searchInput.addEventListener("input", refreshCatalog);

document.addEventListener("keydown", event => {
  if(event.key === "Escape"){
    closeModal();
    closeDrawer(catsDrawerBack);
    closeDrawer(cartDrawerBack);
  }
});

bootstrap();
