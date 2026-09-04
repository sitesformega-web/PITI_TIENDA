# Catálogo ASTREA — refactor conservador

Este paquete reorganiza el prototipo original sin ampliar su alcance funcional.

## Estructura

- `index.html` — estructura de la interfaz.
- `css/app.css` — estilos del catálogo.
- `js/config.js` — branding, contacto y redes del comercio + firma ASTREA.
- `js/environment.js` — endpoint técnico del catálogo.
- `js/api.js` — acceso a Apps Script / Google Sheets y adaptación de productos.
- `js/catalog.js` — estado, categorías y filtros del catálogo.
- `js/cart.js` — carrito, `localStorage` y envío por WhatsApp.
- `js/ui.js` — renderizado e interacción visual.
- `js/app.js` — bootstrap y coordinación.

## Personalizar otro comercio

Editar principalmente `js/config.js`:

- `name`
- `catalogTitle`
- `logo`
- `colors`
- `contact.whatsapp`
- `social`
- textos específicos

El endpoint de datos está separado en `js/environment.js`.

## Firma ASTREA

`PLATFORM_CONFIG` mantiene la firma `POWERED BY ASTREA` independiente del comercio.
El campo `url` quedó como `#` porque no se proporcionó todavía una URL oficial de destino.
Reemplazarlo cuando se defina el enlace.

## Cambios visibles aprobados

- Tipografía global: Quicksand.
- Footer: firma clickeable `POWERED BY ASTREA`, identidad del comercio y redes sociales.
- Hover/foco discreto sobre la firma.
- Footer responsive.

## Nota de ejecución

El proyecto usa módulos ES (`type="module"`). Para probarlo localmente, servir la carpeta mediante un servidor HTTP estático en lugar de abrir `index.html` directamente con `file://`.
