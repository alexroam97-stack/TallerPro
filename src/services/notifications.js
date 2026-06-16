export const generateWhatsAppLink = (phone, clientName, vehicle, stageName, ticketId) => {
  const baseUrl = 'https://wa.me/';
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  
  if (!cleanPhone) return null;

  const trackerUrl = `${window.location.origin}/tracker/${ticketId || ''}`;
  const stage = stageName || '';
  const vehicleName = vehicle || '';
  const client = clientName || '';
  
  const message = `Hola ${client}! 👋 
  
Tu vehículo *${vehicleName}* ha avanzado a la etapa de: *${stage.toUpperCase()}*.

Puedes seguir el progreso en tiempo real aquí:
${trackerUrl}

Gracias por confiar en TallerPro. ✨`;

  return `${baseUrl}${cleanPhone}?text=${encodeURIComponent(message)}`;
};
