import React, { useState, useEffect } from 'react';

export default function Logo({ size = "md", className = "" }) {
  const [settings, setSettings] = useState({
    name: 'TallerPro',
    logo: ''
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tallerpro_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const sizes = {
    sm: "h-8",
    md: "h-12",
    lg: "h-20"
  };

  const isCustomLogo = settings.logo && settings.logo.startsWith('data:image');

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={isCustomLogo ? settings.logo : "/assets/logo.png"} 
        alt={settings.name || "TallerPro Logo"} 
        className={`${sizes[size]} object-contain filter drop-shadow-[0_0_10px_rgba(0,242,255,0.5)] rounded-lg`}
      />
      <span className={`font-black tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent
                       ${size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'}`}>
        {settings.name ? settings.name.toUpperCase() : "TALLERPRO"}
      </span>
    </div>
  );
}
