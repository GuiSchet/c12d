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
          <svg viewBox="0 0 80 40" className={`w-full h-full ${className}`}>
            {/* Bar chart with 5 bars of different heights */}
            <rect x="8" y="25" width="8" height="15" fill="rgba(255,255,255,0.6)" rx="1" />
            <rect x="20" y="18" width="8" height="22" fill="rgba(255,255,255,0.7)" rx="1" />
            <rect x="32" y="12" width="8" height="28" fill="rgba(255,255,255,0.8)" rx="1" />
            <rect x="44" y="20" width="8" height="20" fill="rgba(255,255,255,0.7)" rx="1" />
            <rect x="56" y="15" width="8" height="25" fill="rgba(255,255,255,0.6)" rx="1" />
            
            {/* Subtle grid lines */}
            <line x1="5" y1="40" x2="75" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <line x1="5" y1="30" x2="75" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <line x1="5" y1="20" x2="75" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <line x1="5" y1="10" x2="75" y2="10" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          </svg>
        );

      case 'line':
        return (
          <svg viewBox="0 0 80 40" className={`w-full h-full ${className}`}>
            {/* Line chart with smooth curve */}
            <path
              d="M 10 30 Q 20 25, 25 20 T 40 15 T 55 18 T 70 12"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Data points */}
            <circle cx="10" cy="30" r="2" fill="rgba(255,255,255,0.9)" />
            <circle cx="25" cy="20" r="2" fill="rgba(255,255,255,0.9)" />
            <circle cx="40" cy="15" r="2" fill="rgba(255,255,255,0.9)" />
            <circle cx="55" cy="18" r="2" fill="rgba(255,255,255,0.9)" />
            <circle cx="70" cy="12" r="2" fill="rgba(255,255,255,0.9)" />
            
            {/* Subtle grid */}
            <line x1="5" y1="35" x2="75" y2="35" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <line x1="5" y1="25" x2="75" y2="25" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <line x1="5" y1="15" x2="75" y2="15" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          </svg>
        );

      case 'pie':
        return (
          <svg viewBox="0 0 80 40" className={`w-full h-full ${className}`}>
            <g transform="translate(40, 20)">
              {/* Pie chart segments */}
              <path
                d="M 0 -15 A 15 15 0 0 1 10.6 -10.6 L 0 0 Z"
                fill="rgba(255,255,255,0.8)"
              />
              <path
                d="M 10.6 -10.6 A 15 15 0 0 1 10.6 10.6 L 0 0 Z"
                fill="rgba(255,255,255,0.6)"
              />
              <path
                d="M 10.6 10.6 A 15 15 0 0 1 -10.6 10.6 L 0 0 Z"
                fill="rgba(255,255,255,0.4)"
              />
              <path
                d="M -10.6 10.6 A 15 15 0 0 1 0 -15 L 0 0 Z"
                fill="rgba(255,255,255,0.7)"
              />
            </g>
          </svg>
        );

      case 'area':
        return (
          <svg viewBox="0 0 80 40" className={`w-full h-full ${className}`}>
            {/* Area chart with gradient fill */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <path
              d="M 10 30 Q 20 25, 25 18 T 40 12 T 55 15 T 70 10 L 70 35 L 10 35 Z"
              fill="url(#areaGradient)"
            />
            
            {/* Top line */}
            <path
              d="M 10 30 Q 20 25, 25 18 T 40 12 T 55 15 T 70 10"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        );

      case 'scatter':
        return (
          <svg viewBox="0 0 80 40" className={`w-full h-full ${className}`}>
            {/* Scatter plot points */}
            <circle cx="15" cy="25" r="2.5" fill="rgba(255,255,255,0.7)" />
            <circle cx="25" cy="18" r="2.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="22" cy="28" r="2.5" fill="rgba(255,255,255,0.8)" />
            <circle cx="35" cy="15" r="2.5" fill="rgba(255,255,255,0.7)" />
            <circle cx="40" cy="22" r="2.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="45" cy="30" r="2.5" fill="rgba(255,255,255,0.5)" />
            <circle cx="52" cy="12" r="2.5" fill="rgba(255,255,255,0.8)" />
            <circle cx="58" cy="20" r="2.5" fill="rgba(255,255,255,0.7)" />
            <circle cx="65" cy="25" r="2.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="68" cy="16" r="2.5" fill="rgba(255,255,255,0.8)" />
            
            {/* Subtle axes */}
            <line x1="10" y1="35" x2="70" y2="35" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <line x1="10" y1="35" x2="10" y2="8" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 80 40" className={`w-full h-full ${className}`}>
            {/* Default fallback - simple bar chart */}
            <rect x="15" y="25" width="8" height="10" fill="rgba(255,255,255,0.6)" rx="1" />
            <rect x="30" y="20" width="8" height="15" fill="rgba(255,255,255,0.7)" rx="1" />
            <rect x="45" y="15" width="8" height="20" fill="rgba(255,255,255,0.8)" rx="1" />
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