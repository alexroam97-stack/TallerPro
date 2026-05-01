import React from 'react';

export default function Logo({ size = "md", className = "" }) {
  const sizes = {
    sm: "h-8",
    md: "h-12",
    lg: "h-20"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/assets/logo.png" 
        alt="TallerPro Logo" 
        className={`${sizes[size]} object-contain filter drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]`}
      />
      <span className={`font-black tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent
                       ${size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'}`}>
        TALLER<span className="text-accent-primary">PRO</span>
      </span>
    </div>
  );
}
