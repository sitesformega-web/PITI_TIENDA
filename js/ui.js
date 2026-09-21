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
  renderBusinessInfo(store.business);
  renderCommercialConditions(store.business);
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

  [
    ["Facebook", social?.facebook],
    ["TikTok", social?.tiktok]
  ].forEach(([label, href]) => {
    if(!href) return;
    const link = document.createElement("a");
    link.className = "social social-text";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", label);
    link.textContent = label.slice(0, 1);
    container.appendChild(link);
  });
}

function setBusinessField(itemId, valueId, value, href){
  const item = document.getElementById(itemId);
  const target = document.getElementById(valueId);
  const clean = String(value || "").trim();

  if(!item || !target) return;

  if(!clean){
    item.hidden = true;
    target.textContent = "";
    if(target.tagName === "A") target.removeAttribute("href");
    return;
  }

  target.textContent = clean;
  if(target.tagName === "A" && href){
    target.href = href;
  }
  item.hidden = false;
}

function normalizePhoneForLink(value){
  return String(value || "").replace(/[^\d+]/g, "");
}

function normalizeWhatsAppForLink(value){
  return String(value || "").replace(/\D/g, "");
}

function renderBusinessInfo(business){
  const section = document.getElementById("businessInfo");
  if(!section) return;

  const name = String(business?.businessName || "").trim();
  const legalName = String(business?.legalName || "").trim();

  if(!name && !legalName){
    section.hidden = true;
    return;
  }

  document.getElementById("businessInfoTitle").textContent = name || legalName;

  const legal = document.getElementById("businessInfoLegal");
  legal.textContent = legalName && legalName !== name ? legalName : "";

  setBusinessField("businessRucItem", "businessRuc", business?.ruc);
  setBusinessField("businessLocationItem", "businessLocation", business?.publicLocation);
  setBusinessField(
    "businessEmailItem",
    "businessEmail",
    business?.email,
    business?.email ? `mailto:${business.email}` : ""
  );
  setBusinessField(
    "businessPhoneItem",
    "businessPhone",
    business?.phone,
    business?.phone ? `tel:${normalizePhoneForLink(business.phone)}` : ""
  );

  const whatsappDigits = normalizeWhatsAppForLink(business?.whatsapp);
  setBusinessField(
    "businessWhatsappItem",
    "businessWhatsapp",
    business?.whatsapp,
    whatsappDigits ? `https://wa.me/${whatsappDigits}` : ""
  );

  section.hidden = false;
}


const DELIVERY_LABELS = {
  delivery: "Delivery",
  pickup: "Retiro en local",
  other: "Otra modalidad"
};

const PAYMENT_LABELS = {
  cash: "Efectivo",
  banktransfer: "Transferencia bancaria",
  pos: "POS",
  other: "Otro"
};

function toBusinessList(value){
  if(Array.isArray(value)){
    return value.map(item => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n,;]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function humanizeBusinessList(value, labels){
  return toBusinessList(value)
    .map(item => labels[String(item).toLowerCase()] || item)
    .join(" · ");
}

function setCommerceText(id, value){
  const target = document.getElementById(id);
  if(!target) return false;

  const clean = String(value || "").trim();
  target.textContent = clean;
  target.hidden = !clean;
  return Boolean(clean);
}

function setCommerceLine(lineId, valueId, value){
  const line = document.getElementById(lineId);
  const target = document.getElementById(valueId);
  const clean = String(value || "").trim();

  if(!line || !target) return false;

  target.textContent = clean;
  line.hidden = !clean;
  return Boolean(clean);
}

function renderCommercialConditions(business){
  business = business || {};

  const openButton = document.getElementById("openCommerceConditions");
  const modal = document.getElementById("commerceConditionsModal");
  const closeButton = document.getElementById("commerceConditionsCloseBtn");
  const doneButton = document.getElementById("commerceConditionsDoneBtn");

  const deliveryMethods = humanizeBusinessList(business.deliveryMethods, DELIVERY_LABELS);
  const paymentMethods = humanizeBusinessList(business.paymentMethods, PAYMENT_LABELS);

  const hasDeliveryMethods = setCommerceLine(
    "commerceDeliveryMethodsLine",
    "commerceDeliveryMethods",
    deliveryMethods
  );

  const hasPickupAddress = setCommerceLine(
    "commercePickupAddressLine",
    "commercePickupAddress",
    business.pickupAddress
  );

  const hasDeliveryInfo = setCommerceText("commerceDeliveryInfo", business.deliveryInfo);
  const hasPickupInfo = setCommerceText("commercePickupInfo", business.pickupInfo);

  const hasPaymentMethods = setCommerceLine(
    "commercePaymentMethodsLine",
    "commercePaymentMethods",
    paymentMethods
  );

  const hasPaymentInfo = setCommerceText("commercePaymentInfo", business.paymentInfo);
  const hasReturns = setCommerceText("commerceReturnsPolicy", business.returnsPolicy);
  const hasWarranty = setCommerceText("commerceWarrantyPolicy", business.warrantyPolicy);
  const hasSpecial = setCommerceText("commerceCustomProductNotice", business.customProductNotice);

  const deliverySection = document.getElementById("commerceDeliverySection");
  const paymentSection = document.getElementById("commercePaymentSection");
  const returnsSection = document.getElementById("commerceReturnsSection");
  const warrantySection = document.getElementById("commerceWarrantySection");
  const specialSection = document.getElementById("commerceSpecialSection");

  const hasDelivery = hasDeliveryMethods || hasPickupAddress || hasDeliveryInfo || hasPickupInfo;
  const hasPayment = hasPaymentMethods || hasPaymentInfo;

  if(deliverySection) deliverySection.hidden = !hasDelivery;
  if(paymentSection) paymentSection.hidden = !hasPayment;
  if(returnsSection) returnsSection.hidden = !hasReturns;
  if(warrantySection) warrantySection.hidden = !hasWarranty;
  if(specialSection) specialSection.hidden = !hasSpecial;

  const hasAny = hasDelivery || hasPayment || hasReturns || hasWarranty || hasSpecial;

  if(openButton) openButton.hidden = !hasAny;
  if(!modal) return;

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove("commerce-modal-open");
  };

  if(openButton){
    openButton.onclick = () => {
      modal.hidden = false;
      document.body.classList.add("commerce-modal-open");
    };
  }

  if(closeButton) closeButton.onclick = closeModal;
  if(doneButton) doneButton.onclick = closeModal;

  modal.onclick = event => {
    if(event.target === modal) closeModal();
  };
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


export function renderStoragePreference(state, handlers = {}){
  const consent = document.getElementById("storageConsent");
  const modal = document.getElementById("storageModal");
  const toggle = document.getElementById("storagePreferenceToggle");
  const status = document.getElementById("storagePreferenceStatus");
  const openButton = document.getElementById("openStoragePreferences");
  const rejectButton = document.getElementById("storageRejectBtn");
  const acceptButton = document.getElementById("storageAcceptBtn");
  const closeButton = document.getElementById("storageModalCloseBtn");

  const enabled = Boolean(state?.enabled);
  const decided = Boolean(state?.decided);
  const ttlDays = Number(state?.ttlDays) || 5;
  const notice = String(state?.notice || "");

  if(consent){
    consent.hidden = decided;
  }

  if(toggle){
    toggle.checked = enabled;
    toggle.onchange = () => {
      if(typeof handlers.onChange === "function"){
        handlers.onChange(Boolean(toggle.checked));
      }
    };
  }

  if(status){
    let message = enabled
      ? `Activo: el carrito se conserva hasta ${ttlDays} días desde la última modificación.`
      : "Desactivado: el carrito funciona sólo durante la visita actual.";

    if(notice === "legacy"){
      message = "Recuperamos tu carrito anterior para esta visita. Podés elegir si querés conservarlo.";
    }else if(notice === "expired"){
      message = `El carrito guardado venció después de ${ttlDays} días y fue eliminado.`;
    }else if(notice === "reconciled"){
      message = "Actualizamos el carrito según el catálogo actual.";
    }

    status.textContent = message;
  }

  if(openButton){
    openButton.onclick = () => {
      if(modal){
        modal.hidden = false;
        document.body.classList.add("storage-modal-open");
      }
    };
  }

  if(rejectButton){
    rejectButton.onclick = () => {
      if(typeof handlers.onChange === "function"){
        handlers.onChange(false);
      }
    };
  }

  if(acceptButton){
    acceptButton.onclick = () => {
      if(typeof handlers.onChange === "function"){
        handlers.onChange(true);
      }
    };
  }

  const closeModal = () => {
    if(modal){
      modal.hidden = true;
      document.body.classList.remove("storage-modal-open");
    }
  };

  if(closeButton){
    closeButton.onclick = closeModal;
  }

  if(modal){
    modal.onclick = event => {
      if(event.target === modal) closeModal();
    };
  }
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
