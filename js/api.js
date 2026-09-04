import { ENVIRONMENT } from "./environment.js";

function fixImageUrl(url){
  if(!url) return "";
  if(url.includes("github.com") && url.includes("/blob/")){
    return url.replace("github.com","raw.githubusercontent.com").replace("/blob/","/").replace("?raw=true","");
  }
  return url;
}

function splitGallery(value){
  return String(value || "")
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean);
}

function uniq(values){
  return [...new Set(values.map(value => String(value || "").trim()).filter(Boolean))];
}

function getProductGallery(raw){
  const fromArray = Array.isArray(raw.galeriaArray) ? raw.galeriaArray : [];
  const fromText = splitGallery(raw["Galería"] || "");
  const cover = raw.Imagen ? [raw.Imagen] : [];

  return uniq(
    cover.concat(fromArray, fromText).map(fixImageUrl).filter(Boolean)
  );
}

function mapProduct(raw){
  const gallery = getProductGallery(raw);
  const cover = fixImageUrl(raw.Imagen || "") || gallery[0] || "";

  return {
    id: String(raw.ID || "").trim(),
    code: String(raw.ID || "").trim(),
    name: String(raw.Nombre || "").trim(),
    category: String(raw["Categoría"] || "").trim(),
    desc: String(raw["Descripción"] || "").trim(),
    img: cover,
    gallery,
    stock: String(raw.Stock || "N/D").trim() || "N/D"
  };
}

export async function fetchProducts(){
  const response = await fetch(ENVIRONMENT.catalogUrl, { cache: "no-store" });
  const data = await response.json();

  if(!Array.isArray(data)){
    throw new Error("La respuesta del catálogo no es válida.");
  }

  return data.map(mapProduct);
}
