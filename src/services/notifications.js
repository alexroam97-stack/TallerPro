export const generateWhatsAppLink = (phone, clientName, vehicle, stageName, ticketId) => {
  const baseUrl = 'https://wa.me/';
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone) return null;

  const trackerUrl = `${window.location.origin}/tracker/${ticketId}`;
  
  const message = `Hola ${clientName}! 👋 
  
Tu vehículo *${vehicle}* ha avanzado a la etapa de: *${stageName.toUpperCase()}*.

Puedes seguir el progreso en tiempo real aquí:
${trackerUrl}

Gracias por confiar en TallerPro. ✨`;

  return `${baseUrl}${cleanPhone}?text=${encodeURIComponent(message)}`;
};
