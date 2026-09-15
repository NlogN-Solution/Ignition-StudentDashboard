import React from 'react';

const ApplicationIcons = ({ iconType, size = 80, color = 'currentColor', className = '' }) => {
  const icons = {
    application: (
        <g>
          {/* Background shadow for depth */}
          <rect x="8" y="8" width="70" height="70" rx="8" fill={color} opacity="0.1"/>
          
          {/* Main container */}
          <rect x="5" y="5" width="70" height="70" rx="8" 
            fill="none" 
            stroke={color} 
            strokeWidth="2"/>
          
          {/* Header bar with subtle gradient */}
          <rect x="5" y="5" width="70" height="15" rx="8" fill={color}/>
          <rect x="5" y="5" width="70" height="15" rx="8" fill={color} opacity="0.3"/>
          
          {/* Profile section */}
          <circle cx="20" cy="35" r="6" fill={color}/>
          <path d="M14,47 C14,43 17,41 20,41 C23,41 26,43 26,47" 
            stroke={color} 
            strokeWidth="2" 
            fill="none"/>
          
          {/* Enhanced form lines */}
          <rect x="32" y="32" width="35" height="3" rx="1.5" fill={color}/>
          <rect x="32" y="28" width="25" height="2" rx="1" fill={color} opacity="0.5"/>
          
          <rect x="15" y="45" width="50" height="3" rx="1.5" fill={color}/>
          <rect x="15" y="41" width="30" height="2" rx="1" fill={color} opacity="0.5"/>
          
          <rect x="15" y="55" width="40" height="3" rx="1.5" fill={color}/>
          <rect x="15" y="51" width="20" height="2" rx="1" fill={color} opacity="0.5"/>
          
          {/* Status indicator with pulse effect */}
          <circle cx="65" cy="65" r="8" fill="none" stroke={color} strokeWidth="2"/>
          <circle cx="65" cy="65" r="10" fill="none" stroke={color} strokeWidth="1" opacity="0.3"/>
          <path d="M61,65 L64,68 L69,63" 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
        </g>
      ),
      
      offerReceived: (
        <g>
          {/* Background shadow */}
          <rect x="8" y="8" width="70" height="70" rx="8" fill={color} opacity="0.1"/>
          
          {/* Main container */}
          <rect x="5" y="5" width="70" height="70" rx="8" 
            fill="none" 
            stroke={color} 
            strokeWidth="2"/>
          
          {/* Enhanced envelope */}
          <path d="M15,25 L65,25 L65,60 L15,60 Z" 
            fill="none" 
            stroke={color} 
            strokeWidth="2"/>
          
          {/* Envelope flap with shadow */}
          <path d="M15,25 L40,40 L65,25" 
            fill="none" 
            stroke={color} 
            strokeWidth="2"/>
          <path d="M17,27 L40,41 L63,27" 
            fill="none" 
            stroke={color} 
            strokeWidth="1"
            opacity="0.3"/>
          
          {/* Decorative lines */}
          <line x1="25" y1="35" x2="55" y2="35" 
            stroke={color} 
            strokeWidth="1.5" 
            opacity="0.5"/>
          <line x1="25" y1="45" x2="55" y2="45" 
            stroke={color} 
            strokeWidth="1.5" 
            opacity="0.5"/>
          
          {/* Success indicator */}
          <circle cx="48" cy="45" r="12" 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5"/>
          <circle cx="48" cy="45" r="14" 
            fill="none" 
            stroke={color} 
            strokeWidth="1"
            opacity="0.3"/>
          
          {/* Enhanced checkmark */}
          <path d="M42,45 L46,49 L54,41" 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"/>
          
          {/* Shine effect */}
          <path d="M48,31 L48,35 M48,55 L48,59 M62,45 L58,45 M38,45 L34,45" 
            stroke={color} 
            strokeWidth="1.5"
            opacity="0.5"/>
        </g>
      ),
    
    pendingDocument: (
        <g>
          {/* Base Document Shadow */}
          <rect x="25" y="25" width="60" height="65" rx="4" fill={color} opacity="0.1"/>
          
          {/* Stacked Documents */}
          <g transform="translate(2,2)">
            {/* Bottom Document */}
            <rect x="15" y="15" width="60" height="65" rx="4" 
              fill="none" 
              stroke={color} 
              strokeWidth="2"/>
            
            {/* Middle Document */}
            <rect x="20" y="10" width="60" height="65" rx="4" 
              fill="none" 
              stroke={color} 
              strokeWidth="2"/>
            
            {/* Top Document with Details */}
            <rect x="25" y="5" width="60" height="65" rx="4" 
              fill="none" 
              stroke={color} 
              strokeWidth="2"/>
            
            {/* Document Lines */}
            <line x1="35" y1="20" x2="75" y2="20" stroke={color} strokeWidth="2"/>
            <line x1="35" y1="30" x2="65" y2="30" stroke={color} strokeWidth="2"/>
            <line x1="35" y1="40" x2="70" y2="40" stroke={color} strokeWidth="2"/>
            
            {/* Progress Indicator */}
            <circle cx="60" cy="55" r="15" 
              fill="none" 
              stroke={color} 
              strokeWidth="2"/>
            
            {/* Clock Hands */}
            <path d="M60,55 L60,45 L67,50" 
              fill="none" 
              stroke={color} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"/>
            
            {/* Progress Dots */}
            <g transform="translate(35,55)">
              <circle cx="0" cy="0" r="3" fill={color}/>
              <circle cx="10" cy="0" r="3" fill={color} opacity="0.7"/>
              <circle cx="20" cy="0" r="3" fill={color} opacity="0.4"/>
            </g>
          </g>
          
          {/* Status Corner */}
          <path d="M75,5 L85,5 L85,15" 
            fill="none" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round"/>
        </g>
      ),
    
    visaApplication: (
      <g>
        <rect x="5" y="5" width="70" height="70" rx="8" fill="none" stroke={color} strokeWidth="2"/>
        <rect x="15" y="15" width="50" height="50" rx="4" fill="none" stroke={color} strokeWidth="2"/>
        <text x="22" y="35" fontFamily="Arial" fontWeight="bold" fontSize="12" fill={color}>VISA</text>
        <rect x="20" y="40" width="40" height="2" rx="1" fill={color}/>
        <rect x="20" y="45" width="30" height="2" rx="1" fill={color}/>
        <rect x="20" y="50" width="35" height="2" rx="1" fill={color}/>
        <circle cx="55" cy="55" r="8" fill="none" stroke={color} strokeWidth="1.5"/>
        <path d="M50,55 L53,58 L60,51" fill="none" stroke={color} strokeWidth="1.5"/>
      </g>
    ),
    document: (
      <g>
      {/* Base Document Shadow */}
      <rect x="25" y="25" width="60" height="65" rx="4" fill={color} opacity="0.1" />

      {/* Stacked Documents */}
      <g transform="translate(2, 2)">
        {/* Bottom Document */}
        <rect
          x="15"
          y="15"
          width="60"
          height="65"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />

        {/* Middle Document */}
        <rect
          x="20"
          y="10"
          width="60"
          height="65"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />

        {/* Top Document */}
        <rect
          x="25"
          y="5"
          width="60"
          height="65"
          rx="4"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />

        {/* Document Lines */}
        <line x1="35" y1="20" x2="75" y2="20" stroke={color} strokeWidth="2" />
        <line x1="35" y1="30" x2="65" y2="30" stroke={color} strokeWidth="2" />
        <line x1="35" y1="40" x2="70" y2="40" stroke={color} strokeWidth="2" />
      </g>

      {/* Status Corner */}
      <path
        d="M75,5 L85,5 L85,15"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
    )
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {icons[iconType]}
      </svg>
    </div>
  );
};

export default ApplicationIcons;