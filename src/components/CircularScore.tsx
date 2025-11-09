"use client";

interface CircularScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularScore({ score, size = 60, strokeWidth = 4 }: CircularScoreProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  // Determine color based on score (more subtle colors)
  const getScoreColor = () => {
    if (score >= 75) return { ring: "#22c55e", glow: "rgba(34, 197, 94, 0.15)", text: "#22c55e" }; // Green - less bright
    if (score >= 50) return { ring: "#eab308", glow: "rgba(234, 179, 8, 0.15)", text: "#eab308" }; // Amber - less bright
    return { ring: "#f87171", glow: "rgba(248, 113, 113, 0.15)", text: "#f87171" }; // Red - less bright
  };
  
  const colors = getScoreColor();
  
  return (
    <div 
      className="relative inline-flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      {/* Glow effect - reduced brightness */}
      <div 
        className="absolute inset-0 rounded-full blur-sm opacity-30"
        style={{ 
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          transform: 'scale(1.1)'
        }}
      />
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 relative z-10"
      >
        {/* Background circle - more subtle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth + 1}
        />
        {/* Progress circle with gradient - less bright */}
        <defs>
          <linearGradient id={`gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.ring} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors.ring} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${score})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 2px ${colors.glow})` }}
        />
      </svg>
      {/* Score text with better visibility */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="flex flex-col items-center">
          <span 
            className="font-bold leading-none"
            style={{ 
              fontSize: size * 0.28,
              color: colors.text,
              textShadow: `0 0 3px ${colors.glow}, 0 1px 2px rgba(0,0,0,0.3)`,
              opacity: 0.9
            }}
          >
            {score.toFixed(1)}
          </span>
          <span 
            className="text-[8px] font-medium opacity-60"
            style={{ color: colors.text }}
          >
            MATCH
          </span>
        </div>
      </div>
    </div>
  );
}

