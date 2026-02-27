"use client";

import React from "react";
import { useResponsiveScale } from "@/hooks/useResponsiveScale";

interface ResponsiveContainerProps {
  children: React.ReactNode;
}

export function ResponsiveContainer({ children }: ResponsiveContainerProps) {
  const scale = useResponsiveScale();

  return (
    <div 
      className="w-full h-full origin-top-left transition-transform duration-300"
      style={{
        transform: `scale(${scale})`,
        fontSize: `${scale}rem`
      }}
    >
      <div style={{
        '--scale-factor': scale,
        fontSize: `calc(1rem * var(--scale-factor))`
      } as React.CSSProperties}>
        {children}
      </div>
    </div>
  );
}