"use client";

import React from "react";

interface FixedViewportProps {
  children: React.ReactNode;
}

export function FixedViewport({ children }: FixedViewportProps) {
  return (
    <div className="w-screen h-screen overflow-hidden">
      {children}
    </div>
  );
}