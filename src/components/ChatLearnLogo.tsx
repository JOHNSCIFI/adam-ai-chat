import React from 'react';

interface ChatLearnLogoProps {
  className?: string;
}

const ChatLearnLogo: React.FC<ChatLearnLogoProps> = ({ className = "h-7 w-7" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 160 160" 
      className={className}
    >
      <defs>
        <linearGradient id="grad1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#00C6FF"/>
          <stop offset="100%" stopColor="#7B61FF"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="28" fill="url(#grad1)"/>
      <path d="M28 118 L24 138 L48 126 Z" fill="url(#grad1)"/>
      <g fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M44 116 L80 28 L116 116" />
        <path d="M60 86 L100 86" />
      </g>
      <circle cx="116" cy="36" r="6" fill="#fff" opacity="0.95"/>
      <circle cx="140" cy="56" r="4" fill="#fff" opacity="0.95"/>
      <line x1="110" y1="44" x2="136" y2="56" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.95"/>
    </svg>
  );
};

export default ChatLearnLogo;