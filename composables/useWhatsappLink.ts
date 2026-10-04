const DEFAULT_WHATSAPP_PHONE = "51923821520";
const DEFAULT_WHATSAPP_MESSAGE =
  "Hola, estoy interesado en sus fuegos artificiales. ¿Podrían brindarme información sobre los productos disponibles, precios y promociones?";

export const useWhatsappLink = (message = DEFAULT_WHATSAPP_MESSAGE) => {
  const whatsappLink = `https://wa.me/${DEFAULT_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

  return {
    phoneNumber: DEFAULT_WHATSAPP_PHONE,
    message,
    whatsappLink,
  };
};