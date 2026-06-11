import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const rawPhoneNumber = '526633040096';
  const phoneNumber = rawPhoneNumber.replace(/\D/g, '');
  const message = 'Hola TallerPro, me gustaría recibir más información.';
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl 
                 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] 
                 shadow-[0_0_20px_rgba(37,211,102,0.15)] backdrop-blur-md
                 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 hover:text-white
                 hover:scale-105 hover:shadow-[0_0_25px_rgba(37,211,102,0.3)]
                 transition-all duration-300 group font-black text-xs uppercase tracking-wider cursor-pointer"
    >
      <MessageCircle size={18} className="animate-pulse" />
      <span>Contactar Soporte</span>
    </a>
  );
}
