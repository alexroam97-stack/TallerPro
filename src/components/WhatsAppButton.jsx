import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phoneNumber = '+526633040096';
  const message = 'Hola TallerPro, me gustaría recibir más información.';
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 flex items-center gap-3 p-4 rounded-full 
                 bg-[#25D366] text-white shadow-2xl hover:scale-110 transition-transform 
                 duration-300 animate-bounce group"
    >
      <MessageCircle size={28} />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">
        Contactar Soporte
      </span>
    </a>
  );
}
