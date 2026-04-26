import React from 'react';

interface LogoProps {
  className?: string;
  iconSize?: string;
  textSize?: string;
  variant?: 'light' | 'dark';
  showText?: boolean;
  showIcon?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "flex items-center gap-2", 
  iconSize = "text-2xl",
  textSize = "text-xl",
  variant = 'dark',
  showText = true,
  showIcon = true
}) => {
  const iconColor = variant === 'dark' ? 'text-primary-container' : 'text-primary-fixed';
  const textColor = variant === 'dark' ? 'text-primary' : 'text-white';

  return (
    <div className={`${className} transition-opacity hover:opacity-80`}>
      {showIcon && (
        <span 
          className={`material-symbols-outlined fill ${iconSize} ${iconColor}`} 
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          balance
        </span>
      )}
      {showText && (
        <span className={`font-h2 font-bold tracking-tight ${textSize} ${textColor}`}>
          Pacific LegalMaps
        </span>
      )}
    </div>
  );
};
