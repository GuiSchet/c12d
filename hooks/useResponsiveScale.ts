"use client";

import { useState, useEffect } from "react";

export function useResponsiveScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      const targetWidth = 1080;
      const targetHeight = 1920;
      const targetRatio = targetWidth / targetHeight; // ≈ 0.5625

      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const currentRatio = currentWidth / currentHeight;

      // Si estamos cerca de la proporción del totem (vertical), usar escala normal
      if (Math.abs(currentRatio - targetRatio) < 0.2) {
        setScale(1);
        return;
      }

      // Para pantallas más anchas (landscape), escalar basado en la altura
      if (currentRatio > targetRatio) {
        const scaleFromHeight = currentHeight / targetHeight;
        setScale(Math.min(scaleFromHeight, 0.8)); // Máximo 80% para evitar elementos muy grandes
      } else {
        // Para pantallas más estrechas, escalar basado en el ancho
        const scaleFromWidth = currentWidth / targetWidth;
        setScale(Math.min(scaleFromWidth, 1));
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  return scale;
}