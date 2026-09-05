const instagramIcon = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <rect x="3" y="3" width="18" height="18" rx="5"></rect>
  <circle cx="12" cy="12" r="4"></circle>
  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"></circle>
</svg>`;

export function escapeHtml(value){
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function truncateText(text, max){
  const value = String(text || "").trim();
  return value.length <= max ? value : value.slice(0, max).trim() + "...";
}

function showAddedFeedback(button){
  if(!button) return;
  const originalText = button.textContent;
  button.textContent = "✓ Agregado";
  button.classList.add("btn-added");
  window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("btn-added");
  }, 1200);
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
  document.getElementById("storeCopyright").textContent =
    `${store.name} © ${new Date().getFullYear()}`;

  const poweredBy = document.getElementById("poweredBy");
  poweredBy.href = platform.url;
  poweredBy.setAttribute("aria-label", `${platform.poweredByLabel} ${platform.name}`);
  document.getElementById("poweredByLabel").textContent = platform.poweredByLabel;
  document.getElementById("poweredByName").textContent = platform.name;

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
  const containers = [
    document.getElementById("categoryButtons"),
    document.getElementById("categoryButtonsMobile")
  ];

  containers.forEach(container => {
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

export function renderProducts(list, { onOpen, onAdd }){
  const grid = document.getElementById("grid");
  document.getElementById("count").textContent = list.length;
  grid.innerHTML = "";

  if(!list.length){
    grid.innerHTML = '<div class="state-message">No se encontraron productos</div>';
    return;
  }

  list.forEach(product => {
    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if(product.img){
      const image = document.createElement("img");
      image.src = product.img;
      image.alt = product.name;
      thumb.appendChild(image);
    }else{
      thumb.textContent = product.name.split(" ").slice(0, 3).join(" ");
    }

    const content = document.createElement("div");
    content.className = "card-content";
    content.innerHTML = `
      <div class="meta">
        <div class="name">${escapeHtml(product.name)}</div>
        <div class="cat">${escapeHtml(product.category || "Sin categoría")}</div>
      </div>
      <div class="card-description">
        <div class="small">${escapeHtml(truncateText(product.desc, 110))}</div>
      </div>
    `;

    const buttons = document.createElement("div");
    buttons.className = "btns";
    const addButton = document.createElement("button");
    addButton.className = "btn btn-carrito";
    addButton.type = "button";
    addButton.textContent = "Agregar al carrito";
    addButton.addEventListener("click", event => {
      event.stopPropagation();
      onAdd(product.id);
      showAddedFeedback(addButton);
    });
    buttons.appendChild(addButton);
    content.appendChild(buttons);

    card.append(thumb, content);
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

export function renderCart(items, onRemove){
  const containers = [
    document.getElementById("cartItems"),
    document.getElementById("cartItemsMobile")
  ];

  containers.forEach(container => {
    container.innerHTML = "";

    if(!items.length){
      container.innerHTML = '<div class="cart-empty">No hay productos en el carrito.</div>';
      return;
    }

    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "cart-item";

      const copy = document.createElement("div");
      copy.className = "cart-item-copy";
      copy.innerHTML = `${escapeHtml(item.name)}<div class="small">Código: ${escapeHtml(item.code)}</div>`;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Quitar";
      remove.addEventListener("click", () => onRemove(item.id));

      row.append(copy, remove);
      container.appendChild(row);
    });
  });

  document.getElementById("cartCountSmall").textContent = items.length;
  document.getElementById("cartCountFab").textContent = items.length;
}

export function setLoading(isLoading){
  document.getElementById("loader").style.display = isLoading ? "flex" : "none";
}

export function renderLoadError(){
  document.getElementById("grid").innerHTML =
    '<div class="state-message">No se pudieron cargar los productos.</div>';
}

export function openModal(product, onAdd){
  document.getElementById("mTitle").textContent = product.name;
  document.getElementById("mDesc").textContent = product.desc || "Sin descripción.";
  document.getElementById("mCode").textContent = product.code || "-";
  document.getElementById("mCat").textContent = product.category || "Sin categoría";
  document.getElementById("mStock").textContent = product.stock || "N/D";

  const gallery = product.gallery?.length ? product.gallery : (product.img ? [product.img] : []);
  const initialImage = product.img || gallery[0] || "";
  renderModalImage(product, initialImage);
  renderModalGallery(product, gallery, initialImage);

  const modalCartButton = document.getElementById("modalCarrito");
  modalCartButton.onclick = () => {
    onAdd(product.id);
    showAddedFeedback(modalCartButton);
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
