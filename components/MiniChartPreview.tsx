"use client";

import React from "react";
import { ChartType } from "@/types/charts";

interface MiniChartPreviewProps {
  type: ChartType;
  className?: string;
}

export function MiniChartPreview({ type, className = "" }: MiniChartPreviewProps) {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <svg viewBox="0 0 80 40" className="w-full h-full">
            <defs>
              <linearGradient id="barGradA" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F7931A" />
                <stop offset="100%" stopColor="#E8830F" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="barGradB" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F7931A" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#E8830F" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1="5" y1="38" x2="75" y2="38" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <line x1="5" y1="28" x2="75" y2="28" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="5" y1="18" x2="75" y2="18" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="5" y1="8" x2="75" y2="8" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3 3" />
            {/* Bars */}
            <rect x="8" y="25" width="8" height="13" fill="url(#barGradB)" rx="1" />
            <rect x="20" y="18" width="8" height="20" fill="url(#barGradA)" rx="1" />
            <rect x="32" y="10" width="8" height="28" fill="url(#barGradA)" rx="1" />
            <rect x="44" y="20" width="8" height="18" fill="url(#barGradA)" rx="1" />
            <rect x="56" y="14" width="8" height="24" fill="url(#barGradB)" rx="1" />
          </svg>
        );

      case 'line':
        return (
          <svg viewBox="0 0 80 40" className="w-full h-full">
            {/* Grid */}
            <line x1="5" y1="35" x2="75" y2="35" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <line x1="5" y1="25" x2="75" y2="25" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="5" y1="15" x2="75" y2="15" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3 3" />
            {/* Line */}
            <path
              d="M 10 30 Q 20 25, 25 20 T 40 15 T 55 18 T 70 12"
              stroke="#F7931A"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Data points */}
            <circle cx="10" cy="30" r="2" fill="#F7931A" />
            <circle cx="25" cy="20" r="2" fill="#F7931A" />
            <circle cx="40" cy="15" r="2" fill="#F7931A" />
            <circle cx="55" cy="18" r="2" fill="#F7931A" />
            <circle cx="70" cy="12" r="2" fill="#F7931A" />
          </svg>
        );

      case 'area':
        return (
          <svg viewBox="0 0 80 40" className="w-full h-full">
            <defs>
              <linearGradient id="areaOrangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F7931A" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F7931A" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Grid */}
            <line x1="5" y1="35" x2="75" y2="35" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <line x1="5" y1="25" x2="75" y2="25" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3 3" />
            {/* Area fill */}
            <path
              d="M 10 30 Q 20 25, 25 18 T 40 12 T 55 15 T 70 10 L 70 35 L 10 35 Z"
              fill="url(#areaOrangeGrad)"
            />
            {/* Top line */}
            <path
              d="M 10 30 Q 20 25, 25 18 T 40 12 T 55 15 T 70 10"
              stroke="#F7931A"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        );

      case 'pie':
        return (
          <svg viewBox="0 0 80 40" className="w-full h-full">
            <g transform="translate(40, 20)">
              {/* 5 segments using project palette */}
              <path d="M 0 -15 A 15 15 0 0 1 10.6 -10.6 L 0 0 Z" fill="#F7931A" />
              <path d="M 10.6 -10.6 A 15 15 0 0 1 10.6 10.6 L 0 0 Z" fill="#4A9EFF" />
              <path d="M 10.6 10.6 A 15 15 0 0 1 -10.6 10.6 L 0 0 Z" fill="#9B59B6" />
              <path d="M -10.6 10.6 A 15 15 0 0 1 -10.6 -10.6 L 0 0 Z" fill="#2ECC71" />
              <path d="M -10.6 -10.6 A 15 15 0 0 1 0 -15 L 0 0 Z" fill="#E74C3C" />
            </g>
          </svg>
        );

      case 'scatter':
        return (
          <svg viewBox="0 0 80 40" className="w-full h-full">
            {/* Axes */}
            <line x1="10" y1="35" x2="70" y2="35" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            <line x1="10" y1="35" x2="10" y2="8" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            {/* Mixed color points */}
            <circle cx="15" cy="25" r="2.5" fill="#F7931A" fillOpacity="0.8" />
            <circle cx="25" cy="18" r="2.5" fill="#4A9EFF" fillOpacity="0.8" />
            <circle cx="22" cy="28" r="2.5" fill="#F7931A" fillOpacity="0.6" />
            <circle cx="35" cy="15" r="2.5" fill="#9B59B6" fillOpacity="0.8" />
            <circle cx="40" cy="22" r="2.5" fill="#4A9EFF" fillOpacity="0.7" />
            <circle cx="45" cy="30" r="2.5" fill="#F7931A" fillOpacity="0.5" />
            <circle cx="52" cy="12" r="2.5" fill="#2ECC71" fillOpacity="0.8" />
            <circle cx="58" cy="20" r="2.5" fill="#F7931A" fillOpacity="0.7" />
            <circle cx="65" cy="25" r="2.5" fill="#4A9EFF" fillOpacity="0.6" />
            <circle cx="68" cy="16" r="2.5" fill="#9B59B6" fillOpacity="0.7" />
          </svg>
        );

      case 'heatmap':
        return (
          <svg viewBox="0 0 80 40" className="w-full h-full">
            {/* 4×3 grid with varying orange intensities */}
            <rect x="10" y="5"  width="13" height="9" fill="rgba(247,147,26,0.30)" rx="1" />
            <rect x="26" y="5"  width="13" height="9" fill="rgba(247,147,26,0.70)" rx="1" />
            <rect x="42" y="5"  width="13" height="9" fill="rgba(247,147,26,0.50)" rx="1" />
            <rect x="58" y="5"  width="13" height="9" fill="rgba(247,147,26,0.20)" rx="1" />

            <rect x="10" y="17" width="13" height="9" fill="rgba(247,147,26,0.60)" rx="1" />
            <rect x="26" y="17" width="13" height="9" fill="rgba(247,147,26,0.40)" rx="1" />
            <rect x="42" y="17" width="13" height="9" fill="rgba(247,147,26,0.85)" rx="1" />
            <rect x="58" y="17" width="13" height="9" fill="rgba(247,147,26,0.35)" rx="1" />

            <rect x="10" y="29" width="13" height="9" fill="rgba(247,147,26,0.50)" rx="1" />
            <rect x="26" y="29" width="13" height="9" fill="rgba(247,147,26,0.25)" rx="1" />
            <rect x="42" y="29" width="13" height="9" fill="rgba(247,147,26,0.65)" rx="1" />
            <rect x="58" y="29" width="13" height="9" fill="rgba(247,147,26,0.45)" rx="1" />
          </svg>
        );

      case 'treemap':
        return (
          <svg viewBox="0 0 80 40" className="w-full h-full">
            {/* Treemap-style nested rects */}
            <rect x="5"  y="5"  width="35" height="22" fill="rgba(247,147,26,0.40)" rx="1" />
            <rect x="43" y="5"  width="32" height="12" fill="rgba(74,158,255,0.40)" rx="1" />
            <rect x="43" y="20" width="16" height="7"  fill="rgba(155,89,182,0.50)" rx="1" />
            <rect x="62" y="20" width="13" height="7"  fill="rgba(46,204,113,0.50)" rx="1" />
            <rect x="5"  y="30" width="22" height="7"  fill="rgba(74,158,255,0.35)" rx="1" />
            <rect x="30" y="30" width="45" height="7"  fill="rgba(247,147,26,0.25)" rx="1" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 80 40" className="w-full h-full">
            <defs>
              <linearGradient id="defaultOrangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F7931A" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F7931A" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <rect x="15" y="25" width="8" height="13" fill="url(#defaultOrangeGrad)" rx="1" />
            <rect x="30" y="18" width="8" height="20" fill="url(#defaultOrangeGrad)" rx="1" />
            <rect x="45" y="12" width="8" height="26" fill="url(#defaultOrangeGrad)" rx="1" />
          </svg>
        );
    }
  };

  return (
    <div className={`${className} flex items-center justify-center p-2`}>
      {renderChart()}
    </div>
  );
}
