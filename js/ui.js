const instagramIcon = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle>
  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"></circle>
</svg>`;

export function escapeHtml(value){
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatMoney(value, store){
  if(value === null || value === undefined) return "Consultar";
  const locale = store.currency?.locale || "es-PY";
  const label = store.currency?.label || "Gs.";
  return `${label} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)}`;
}

function showAddedFeedback(button){
  if(!button) return;
  const originalText = button.textContent;
  button.textContent = "✓ Agregado";
  button.classList.add("btn-added");
  window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("btn-added");
  }, 900);
}

function renderPromo(promo){
  const target = document.getElementById("promoBanner");
  const desktop = String(promo?.image || "").trim();
  const mobile = String(promo?.mobileImage || "").trim();
  if(!desktop && !mobile){
    target.hidden = true;
    target.innerHTML = "";
    return;
  }

  const picture = document.createElement("picture");
  if(mobile){
    const source = document.createElement("source");
    source.media = "(max-width: 700px)";
    source.srcset = mobile;
    picture.appendChild(source);
  }
  const image = document.createElement("img");
  image.src = desktop || mobile;
  image.alt = promo?.alt || "Promoción";
  picture.appendChild(image);

  const linkValue = String(promo?.link || "").trim();
  if(/^https?:\/\//i.test(linkValue)){
    const link = document.createElement("a");
    link.href = linkValue;
    link.target = "_blank";
    link.rel = "noopener";
    link.appendChild(picture);
    target.appendChild(link);
  }else{
    target.appendChild(picture);
  }
  target.hidden = false;
}

export function applyBranding(store, platform){
  document.title = store.catalogTitle;
  document.documentElement.style.setProperty("--bg", store.colors.background);
  document.documentElement.style.setProperty("--card", store.colors.surface);
  document.documentElement.style.setProperty("--accent", store.colors.accent);
  document.documentElement.style.setProperty("--muted", store.colors.muted);

  const logo = document.getElementById("storeLogo");
  logo.src = store.logo;
  logo.alt = `Logo ${store.name}`;
  document.getElementById("catalogTitle").textContent = store.catalogTitle;
  document.getElementById("searchInput").placeholder = store.texts.searchPlaceholder;
  document.getElementById("modalNote").textContent = store.texts.demoNote;
  document.getElementById("storeCopyright").textContent = `${store.name} © ${new Date().getFullYear()}`;

  const poweredBy = document.getElementById("poweredBy");
  poweredBy.href = platform.url;
  poweredBy.setAttribute("aria-label", `${platform.poweredByLabel} ${platform.name}`);
  document.getElementById("poweredByLabel").textContent = platform.poweredByLabel;
  document.getElementById("poweredByName").textContent = platform.name;

  renderPromo(store.promo);
  renderSocialLinks(store.social);
}

function renderSocialLinks(social){
  const container = document.getElementById("socialLinks");
  container.innerHTML = "";
  if(social?.instagram){
    const link = document.createElement("a");
    link.className = "social";
    link.href = social.instagram;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", "Instagram");
    link.innerHTML = instagramIcon;
    container.appendChild(link);
  }
}

export function renderCategories(categories, activeCategory, onSelect){
  [document.getElementById("categoryButtons"), document.getElementById("categoryButtonsMobile")]
    .forEach(container => {
      container.innerHTML = "";
      ["Todas", ...categories].forEach(label => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.className = "category-btn" + (label === activeCategory ? " active" : "");
        button.addEventListener("click", () => onSelect(label));
        container.appendChild(button);
      });
    });
}

export function renderProducts(list, { onOpen, onAdd, storeConfig }){
  const grid = document.getElementById("grid");
  document.getElementById("count").textContent = list.length;
  grid.innerHTML = "";

  if(!list.length){
    grid.innerHTML = '<div class="state-message">No se encontraron productos</div>';
    return;
  }

  list.forEach(product => {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if(product.img){
      const image = document.createElement("img");
      image.src = product.img;
      image.alt = product.name;
      thumb.appendChild(image);
    }

    const content = document.createElement("div");
    content.className = "card-content";
    content.innerHTML = `
      <div class="name">${escapeHtml(product.name)}</div>
      <div class="card-meta">
        <span class="price">${escapeHtml(formatMoney(product.price, storeConfig))}</span>
        <span class="cat">${escapeHtml(product.category || "Sin categoría")}</span>
      </div>
    `;

    const addButton = document.createElement("button");
    addButton.className = "btn btn-carrito card-add";
    addButton.type = "button";
    addButton.textContent = "Agregar al carrito";
    addButton.addEventListener("click", event => {
      event.stopPropagation();
      onAdd(product.id);
      showAddedFeedback(addButton);
    });

    card.append(thumb, content, addButton);
    card.addEventListener("click", event => {
      if(!event.target.closest("button")) onOpen(product);
    });
    card.addEventListener("keydown", event => {
      if(event.key === "Enter" || event.key === " "){
        event.preventDefault();
        onOpen(product);
      }
    });
    grid.appendChild(card);
  });
}

export function renderCart(items, { onIncrement, onDecrement, onRemove, storeConfig }){
  const containers = [
    document.getElementById("cartItems"),
    document.getElementById("cartItemsMobile")
  ];

  const units = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (item.price === null ? 0 : item.price * item.quantity), 0);
  const hasUnpriced = items.some(item => item.price === null);

  containers.forEach(container => {
    container.innerHTML = "";
    if(!items.length){
      container.innerHTML = '<div class="cart-empty">No hay productos en el carrito.</div>';
      return;
    }

    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "cart-item";

      const top = document.createElement("div");
      top.className = "cart-item-top";
      top.innerHTML = `
        <div class="cart-item-copy">
          <strong>${escapeHtml(item.name)}</strong>
          <div class="small">${escapeHtml(item.code)}</div>
        </div>
        <button class="cart-remove" type="button" aria-label="Eliminar producto">×</button>
      `;
      top.querySelector(".cart-remove").addEventListener("click", () => onRemove(item.id));

      const bottom = document.createElement("div");
      bottom.className = "cart-item-bottom";
      const quantity = document.createElement("div");
      quantity.className = "quantity-control compact";
      quantity.innerHTML = `<button type="button">−</button><span>${item.quantity}</span><button type="button">+</button>`;
      quantity.children[0].addEventListener("click", () => onDecrement(item.id));
      quantity.children[2].addEventListener("click", () => onIncrement(item.id));

      const subtotal = document.createElement("strong");
      subtotal.className = "cart-subtotal";
      subtotal.textContent = item.price === null ? "Consultar" : formatMoney(item.price * item.quantity, storeConfig);
      bottom.append(quantity, subtotal);
      row.append(top, bottom);
      container.appendChild(row);
    });
  });

  [document.getElementById("cartSummary"), document.getElementById("cartSummaryMobile")]
    .forEach(target => {
      target.innerHTML = items.length
        ? `<span>Total estimado</span><strong>${escapeHtml(formatMoney(total, storeConfig))}</strong>${hasUnpriced ? '<small>+ productos a consultar</small>' : ''}`
        : "";
    });

  document.getElementById("cartCountSmall").textContent = units;
  document.getElementById("cartCountFab").textContent = units;
}

export function setLoading(isLoading){
  document.getElementById("loader").style.display = isLoading ? "flex" : "none";
}
export function renderLoadError(){
  document.getElementById("grid").innerHTML = '<div class="state-message">No se pudieron cargar los productos.</div>';
}

export function openModal(product, onAdd, storeConfig){
  document.getElementById("mTitle").textContent = product.name;
  document.getElementById("mDesc").textContent = product.desc || "Sin descripción.";
  document.getElementById("mCode").textContent = product.code || "-";
  document.getElementById("mCat").textContent = product.category || "Sin categoría";
  document.getElementById("mStock").textContent = product.stock || "N/D";
  document.getElementById("mPrice").textContent = formatMoney(product.price, storeConfig);

  const gallery = product.gallery?.length ? product.gallery : (product.img ? [product.img] : []);
  const initialImage = product.img || gallery[0] || "";
  renderModalImage(product, initialImage);
  renderModalGallery(product, gallery, initialImage);

  let quantity = 1;
  const qty = document.getElementById("modalQty");
  qty.textContent = quantity;
  document.getElementById("modalQtyMinus").onclick = () => {
    quantity = Math.max(1, quantity - 1);
    qty.textContent = quantity;
  };
  document.getElementById("modalQtyPlus").onclick = () => {
    quantity += 1;
    qty.textContent = quantity;
  };

  const button = document.getElementById("modalCarrito");
  button.onclick = () => {
    onAdd(product.id, quantity);
    showAddedFeedback(button);
  };

  const modalBack = document.getElementById("modalBack");
  modalBack.style.display = "flex";
  modalBack.setAttribute("aria-hidden", "false");
}

function renderModalImage(product, imageUrl){
  const target = document.getElementById("mThumb");
  target.innerHTML = "";
  if(imageUrl){
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = product.name;
    target.appendChild(image);
  }else{
    target.textContent = product.code || product.name;
  }
}

function renderModalGallery(product, gallery, activeImage){
  const target = document.getElementById("mGallery");
  target.innerHTML = "";
  gallery.forEach(url => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "modal-gallery-item" + (url === activeImage ? " active" : "");
    const image = document.createElement("img");
    image.src = url;
    image.alt = product.name;
    button.appendChild(image);
    button.addEventListener("click", () => {
      renderModalImage(product, url);
      renderModalGallery(product, gallery, url);
    });
    target.appendChild(button);
  });
}

export function closeModal(){
  const modalBack = document.getElementById("modalBack");
  modalBack.style.display = "none";
  modalBack.setAttribute("aria-hidden", "true");
}
export function openDrawer(element){
  element.style.display = "flex";
  element.setAttribute("aria-hidden", "false");
}
export function closeDrawer(element){
  element.style.display = "none";
  element.setAttribute("aria-hidden", "true");
}
