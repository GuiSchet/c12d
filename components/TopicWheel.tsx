"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { TopicId } from "@/types/charts";
import { Network, Boxes, Users, Shuffle, ScrollText, Bitcoin } from "lucide-react";

interface TopicWheelProps {
  onTopicSelect: (topic: TopicId) => void;
  className?: string;
}

const topics: Array<{
  id: TopicId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}> = [
  {
    id: "network" as TopicId,
    name: "NETWORK",
    icon: Network,
    color: "#F7931A",
    description: "P2P message activity and connections"
  },
  {
    id: "mempool" as TopicId,
    name: "MEMPOOL",
    icon: Boxes,
    color: "#E8830F",
    description: "Unconfirmed transaction pool state"
  },
  {
    id: "peers" as TopicId,
    name: "PEERS",
    icon: Users,
    color: "#D47210",
    description: "Connected peers by type and network"
  },
  {
    id: "orphans" as TopicId,
    name: "ORPHANS",
    icon: Shuffle,
    color: "#BF6100",
    description: "Orphan transaction pool analysis"
  },
  {
    id: "logs" as TopicId,
    name: "LOGS",
    icon: ScrollText,
    color: "#AA5000",
    description: "Real-time Bitcoin Core debug log stream"
  }
];

export function TopicWheel({ onTopicSelect, className = "" }: TopicWheelProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<TopicId | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleTopicClick = (topicId: TopicId, index: number) => {
    setIsSelecting(true);
    setSelectedIndex(index);
    setSelectedTopic(topicId);
    
    // Reset animation after delay
    setTimeout(() => {
      setIsSelecting(false);
      setSelectedIndex(null);
    }, 1500);
    
    // Call parent callback with slight delay for visual feedback
    setTimeout(() => {
      onTopicSelect(topicId);
    }, 600);
  };

  const createSegmentPath = (index: number, total: number, outerRadius: number, innerRadius: number) => {
    const anglePerSegment = 360 / total;
    const startAngle = index * anglePerSegment - 90; // Start from top
    const endAngle = (index + 1) * anglePerSegment - 90;
    
    const startRadian = (startAngle * Math.PI) / 180;
    const endRadian = (endAngle * Math.PI) / 180;
    
    const largeArcFlag = anglePerSegment > 180 ? 1 : 0;
    
    // Outer arc points
    const x1 = Math.cos(startRadian) * outerRadius;
    const y1 = Math.sin(startRadian) * outerRadius;
    const x2 = Math.cos(endRadian) * outerRadius;
    const y2 = Math.sin(endRadian) * outerRadius;
    
    // Inner arc points
    const x3 = Math.cos(endRadian) * innerRadius;
    const y3 = Math.sin(endRadian) * innerRadius;
    const x4 = Math.cos(startRadian) * innerRadius;
    const y4 = Math.sin(startRadian) * innerRadius;
    
    return `M ${x4} ${y4} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  const getSegmentTextPosition = (index: number, total: number, outerRadius: number, innerRadius: number) => {
    const anglePerSegment = 360 / total;
    const centerAngle = (index * anglePerSegment + anglePerSegment / 2) - 90;
    const radian = (centerAngle * Math.PI) / 180;
    // Position text at the exact center between inner and outer radius
    const textRadius = (outerRadius + innerRadius) / 2;
    
    return {
      x: Math.cos(radian) * textRadius,
      y: Math.sin(radian) * textRadius
    };
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <h3 className="text-base font-bold text-center mb-4 text-white">
        Select a topic to explore
      </h3>
      
      <motion.div 
        className="relative"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.svg 
          width="420" 
          height="420" 
          viewBox="-210 -210 420 420" 
          className="drop-shadow-2xl"
          animate={isSelecting ? {
            scale: [1, 1.15, 1.05, 1],
          } : {}}
          transition={{
            duration: 1.2,
            ease: "easeInOut"
          }}
        >
          {/* Topic segments */}
          {topics.map((topic, index) => {
            const isHovered = hoveredTopic === topic.id;
            const isSelected = selectedTopic === topic.id;
            const hasHover = hoveredTopic !== null;
            
            // Dynamic radius based on hover state
            const outerRadius = isHovered ? 185 : (hasHover ? 160 : 170);
            const innerRadius = 40;
            
            const segmentPath = createSegmentPath(index, topics.length, outerRadius, innerRadius);
            const textPos = getSegmentTextPosition(index, topics.length, 170, innerRadius);
            // const chartCount = getChartsForTopic(topic.id).length;
            
            const baseColor = topic.color;
            
            return (
              <g key={topic.id}>
                {/* Glass effect background */}
                <defs>
                  <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={baseColor} stopOpacity="0.3"/>
                    <stop offset="50%" stopColor={baseColor} stopOpacity="0.2"/>
                    <stop offset="100%" stopColor={baseColor} stopOpacity="0.1"/>
                  </linearGradient>
                  <filter id={`blur-${index}`}>
                    <feGaussianBlur stdDeviation="2"/>
                  </filter>
                </defs>
                
                {/* Segment path with liquid glass effect */}
                <motion.path
                  d={segmentPath}
                  fill={`url(#gradient-${index})`}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="3"
                  className="cursor-pointer"
                  style={{
                    backdropFilter: 'blur(10px)',
                    filter: 'blur(0.5px)'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    d: segmentPath,
                    opacity: isSelected ? 0.9 : isHovered ? 0.8 : 0.5,
                    fill: isSelected 
                      ? 'rgba(133, 119, 175, 0.6)' 
                      : isHovered 
                      ? baseColor
                      : `url(#gradient-${index})`
                  }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Invisible larger hit area for better mouse detection */}
                <motion.path
                  d={createSegmentPath(index, topics.length, outerRadius + 10, innerRadius - 5)}
                  fill="transparent"
                  stroke="none"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredTopic(topic.id)}
                  onMouseLeave={() => setHoveredTopic(null)}
                  onClick={() => handleTopicClick(topic.id, index)}
                />
                
                {/* Glass highlight overlay */}
                <motion.path
                  d={segmentPath}
                  fill="rgba(255,255,255,0.15)"
                  stroke="none"
                  className="pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    d: segmentPath,
                    opacity: isHovered ? 0.4 : 0.15
                  }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Topic text and icon */}
                <g 
                  className="cursor-pointer pointer-events-none"
                  transform={`translate(${textPos.x}, ${textPos.y})`}
                >
                  {/* Lucide Icon */}
                  <foreignObject
                    x="-16"
                    y="-32"
                    width="32"
                    height="32"
                  >
                    <div className="flex items-center justify-center w-full h-full" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>
                      <topic.icon className="w-5 h-5 text-white" />
                    </div>
                  </foreignObject>
                  
                  {/* Text */}
                  <text
                    x="0"
                    y="18"
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="400"
                    fill="white"
                    className="select-none"
                    style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}
                  >
                    {topic.name.split('\n').map((line, i) => (
                      <tspan key={i} x="0" dy={i === 0 ? 0 : 12}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              </g>
            );
          })}
          
          {/* Central circle with glass effect */}
          <defs>
            <radialGradient id="centralGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </radialGradient>
          </defs>
          
          <circle
            cx="0"
            cy="0"
            r="40"
            fill="url(#centralGradient)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="3"
            className="drop-shadow-lg"
            style={{ backdropFilter: 'blur(10px)' }}
          />
          
          {/* Central icon with better positioning */}
          <foreignObject
            x="-30"
            y="-30"
            width="60"
            height="60"
          >
            <div className="flex items-center justify-center w-full h-full">
              <Bitcoin className="w-8 h-8 text-white" />
            </div>
          </foreignObject>

          {/* Selection Animation Effects */}
          {isSelecting && selectedIndex !== null && (
            <>
              {/* Dramatic Energy Pulse Rings */}
              {[1, 2, 3, 4].map((ring) => (
                <motion.circle
                  key={`pulse-${ring}`}
                  cx="0"
                  cy="0"
                  r="0"
                  fill="none"
                  stroke="rgba(247, 147, 26, 0.9)"
                  strokeWidth="4"
                  initial={{ r: 40, opacity: 0 }}
                  animate={{ 
                    r: 250 + (ring * 40), 
                    opacity: [0, 1, 0.3, 0],
                    strokeWidth: [4, 3, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: ring * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* Secondary shockwave rings */}
              {[1, 2].map((ring) => (
                <motion.circle
                  key={`shockwave-${ring}`}
                  cx="0"
                  cy="0"
                  r="0"
                  fill="rgba(247, 147, 26, 0.1)"
                  stroke="rgba(255, 255, 255, 0.6)"
                  strokeWidth="2"
                  initial={{ r: 35, opacity: 0 }}
                  animate={{ 
                    r: 310 + (ring * 50), 
                    opacity: [0, 0.6, 0],
                    strokeWidth: [2, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.8,
                    delay: ring * 0.2,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* Particle Burst Effect */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30) * Math.PI / 180;
                const baseRadius = 105;
                const endRadius = 170 + Math.random() * 50;
                
                return (
                  <motion.circle
                    key={`particle-${i}`}
                    cx={Math.cos(angle) * baseRadius}
                    cy={Math.sin(angle) * baseRadius}
                    r="0"
                    fill="rgba(255, 255, 255, 0.9)"
                    initial={{ 
                      r: 0,
                      opacity: 0,
                      x: Math.cos(angle) * baseRadius,
                      y: Math.sin(angle) * baseRadius
                    }}
                    animate={{ 
                      r: [0, 4, 2, 0],
                      opacity: [0, 1, 0.5, 0],
                      x: Math.cos(angle) * endRadius,
                      y: Math.sin(angle) * endRadius
                    }}
                    transition={{ 
                      duration: 1,
                      delay: 0.3 + (i * 0.05),
                      ease: "easeOut"
                    }}
                  />
                );
              })}

              {/* Central Flash Effect */}
              <motion.circle
                cx="0"
                cy="0"
                r="40"
                fill="rgba(247, 147, 26, 0.3)"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ 
                  duration: 0.6,
                  ease: "easeInOut"
                }}
              />

              {/* Enhanced directional sparkles around selected section */}
              <motion.g>
                {(() => {
                  const anglePerSegment = 360 / topics.length;
                  const centerAngle = (selectedIndex * anglePerSegment + anglePerSegment / 2) - 90;
                  const radian = (centerAngle * Math.PI) / 180;
                  
                  return (
                    <>
                      {/* Directional sparkles */}
                      {Array.from({ length: 8 }).map((_, i) => {
                        const sparkleRadius = 95 + (i * 12);
                        const angleOffset = (Math.random() - 0.5) * 0.3; // Small random angle variation
                        const sparkleAngle = radian + angleOffset;
                        const sparkleX = Math.cos(sparkleAngle) * sparkleRadius;
                        const sparkleY = Math.sin(sparkleAngle) * sparkleRadius;
                        
                        return (
                          <motion.circle
                            key={`sparkle-${i}`}
                            cx={sparkleX}
                            cy={sparkleY}
                            r="0"
                            fill="rgba(255, 255, 255, 0.9)"
                            initial={{ r: 0, opacity: 0 }}
                            animate={{ 
                              r: [0, 4, 0],
                              opacity: [0, 1, 0]
                            }}
                            transition={{ 
                              duration: 0.8,
                              delay: 0.3 + (i * 0.08),
                              ease: "easeInOut"
                            }}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </motion.g>
            </>
          )}
        </motion.svg>
      </motion.div>

    </div>
  );
}