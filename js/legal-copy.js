function clean(value){
  return String(value || "").trim();
}

export const PUBLIC_LINKS = {
  sedeco: "https://sedeco.gov.py/"
};

export function buildPublicCopy(business = {}){
  const businessName = clean(business.businessName) || "el comercio";

  return {
    order: {
      title: "Sobre tu pedido",
      paragraphs: [
        `Al enviar, compartís una solicitud de pedido con ${businessName} mediante WhatsApp. Podrás coordinar directamente con el comercio la disponibilidad y las condiciones de entrega o retiro que todavía estén pendientes.`,
        "Agregar productos al carrito no reserva stock. Los precios publicados corresponden a la información vigente del comercio. Cualquier costo adicional variable deberá informarse antes de completar la operación.",
        "Catálogo Express® no procesa pagos. Enviar un pedido tampoco implica aceptar comunicaciones promocionales."
      ]
    },

    catalog: {
      title: "Sobre este catálogo",
      paragraphs: [
        `Este catálogo pertenece a ${businessName}. El comercio es responsable de los productos, precios, disponibilidad, entrega, garantías, cambios, devoluciones y atención comercial.`,
        "Catálogo Express® es una tecnología proporcionada por ASTREA™ para facilitar la exhibición y administración del catálogo y el contacto entre el comprador y el comercio."
      ]
    },

    privacy: {
      title: "Privacidad y almacenamiento",
      paragraphs: [
        "Catálogo Express® puede guardar temporalmente los productos de tu carrito en este dispositivo. Si activás esta opción, el carrito se conserva hasta 5 días desde la última modificación. Si la desactivás, el carrito funciona sólo durante la visita actual.",
        "Podés cambiar esta preferencia en cualquier momento.",
        "Al continuar hacia WhatsApp, la comunicación pasa a un servicio externo sujeto a sus propias políticas y condiciones."
      ],
      contactLabel: "Contacto de privacidad"
    },

    consumer: {
      title: "Defensa del consumidor",
      text: "Para información sobre derechos del consumidor y canales de reclamo, podés consultar a la Secretaría de Defensa del Consumidor y el Usuario — SEDECO.",
      linkLabel: "Ir al sitio de SEDECO",
      url: PUBLIC_LINKS.sedeco
    }
  };
}
