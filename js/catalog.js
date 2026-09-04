let products = [];
let activeCategory = "Todas";

export function setProducts(nextProducts){
  products = Array.isArray(nextProducts) ? nextProducts : [];
}

export function getProducts(){
  return products;
}

export function getProductById(id){
  return products.find(product => product.id === id);
}

export function getCategories(){
  return [...new Set(products.map(product => product.category).filter(Boolean))].sort();
}

export function setActiveCategory(category){
  activeCategory = category || "Todas";
}

export function getActiveCategory(){
  return activeCategory;
}

export function filterProducts(query = ""){
  const normalizedQuery = query.trim().toLowerCase();

  return products.filter(product => {
    const inCategory =
      !activeCategory ||
      activeCategory === "Todas" ||
      product.category === activeCategory;

    const searchable = [
      product.name,
      product.code,
      product.desc,
      product.category,
      product.stock
    ].join(" ").toLowerCase();

    return inCategory && searchable.includes(normalizedQuery);
  });
}
