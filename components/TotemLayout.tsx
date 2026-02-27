"use client";

import React from "react";

interface TotemLayoutProps {
  children: React.ReactNode;
}

export function TotemLayout({ children }: TotemLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden">
      {/* Contenedor con proporción fija de totem 1080x1920 */}
      <div 
        className="relative bg-white shadow-2xl"
        style={{
          width: '1080px',
          height: '1920px',
          maxWidth: '100vw',
          maxHeight: '100vh',
          aspectRatio: '1080/1920',
          transform: 'scale(min(100vw / 1080px, 100vh / 1920px))',
          transformOrigin: 'center'
        }}
      >
        {children}
      </div>
    </div>
  );
}