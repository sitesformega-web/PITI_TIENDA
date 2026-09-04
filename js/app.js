import { STORE_CONFIG, PLATFORM_CONFIG } from "./config.js";
import { fetchProducts } from "./api.js";
import {
  setProducts,
  getProductById,
  getCategories,
  setActiveCategory,
  getActiveCategory,
  filterProducts
} from "./catalog.js";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  openWhatsAppOrder
} from "./cart.js";
import {
  applyBranding,
  renderCategories,
  renderProducts,
  renderCart,
  setLoading,
  renderLoadError,
  openModal,
  closeModal,
  openDrawer,
  closeDrawer
} from "./ui.js";

const searchInput = document.getElementById("searchInput");
const catsDrawerBack = document.getElementById("catsDrawerBack");
const cartDrawerBack = document.getElementById("cartDrawerBack");

function refreshCatalog(){
  renderProducts(filterProducts(searchInput.value), {
    onOpen: product => openModal(product, handleAddToCart),
    onAdd: handleAddToCart
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

function refreshCart(){
  renderCart(getCart(), id => {
    removeFromCart(id);
    refreshCart();
  });
}

function handleAddToCart(id){
  const product = getProductById(id);
  if(!product) return;
  addToCart(product);
  closeModal();
  refreshCart();
}

async function bootstrap(){
  applyBranding(STORE_CONFIG, PLATFORM_CONFIG);
  refreshCart();
  setLoading(true);

  try{
    setProducts(await fetchProducts());
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

document.getElementById("sendCartBtn").addEventListener("click", () => openWhatsAppOrder(STORE_CONFIG));
document.getElementById("sendCartBtnMobile").addEventListener("click", () => openWhatsAppOrder(STORE_CONFIG));

function handleClearCart(){
  clearCart();
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
