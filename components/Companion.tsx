'use client';

import { motion } from 'framer-motion';
import type { CompanionKey } from '@/lib/types';

interface Props {
  character?: CompanionKey;
  mood?: 'happy' | 'cheering' | 'thinking' | 'idle';
  size?: number;
}

const CHARACTERS: Record<CompanionKey, (fill: string) => JSX.Element> = {
  bunny: (fill) => (
    <g>
      <ellipse cx="40" cy="22" rx="8" ry="22" fill={fill} />
      <ellipse cx="40" cy="22" rx="3" ry="14" fill="#FFB3A7" />
      <ellipse cx="60" cy="22" rx="8" ry="22" fill={fill} />
      <ellipse cx="60" cy="22" rx="3" ry="14" fill="#FFB3A7" />
      <circle cx="50" cy="58" r="28" fill={fill} />
      <circle cx="35" cy="62" r="5" fill="#FFB3A7" opacity="0.6" />
      <circle cx="65" cy="62" r="5" fill="#FFB3A7" opacity="0.6" />
      <circle cx="42" cy="54" r="3" fill="#2A1B3D" />
      <circle cx="58" cy="54" r="3" fill="#2A1B3D" />
      <circle cx="43" cy="53" r="1" fill="white" />
      <circle cx="59" cy="53" r="1" fill="white" />
      <path d="M47 64 L50 62 L53 64 Z" fill="#FF6B5B" />
      <path d="M46 68 Q50 72 54 68" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  kitty: (fill) => (
    <g>
      <polygon points="30,30 38,10 48,30" fill={fill} />
      <polygon points="52,30 62,10 70,30" fill={fill} />
      <polygon points="34,26 40,16 44,28" fill="#FFB3A7" />
      <polygon points="56,28 60,16 66,26" fill="#FFB3A7" />
      <circle cx="50" cy="55" r="28" fill={fill} />
      <circle cx="35" cy="62" r="5" fill="#FFB3A7" opacity="0.6" />
      <circle cx="65" cy="62" r="5" fill="#FFB3A7" opacity="0.6" />
      <path d="M40 52 Q42 48 44 52" stroke="#2A1B3D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56 52 Q58 48 60 52" stroke="#2A1B3D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M47 62 L50 60 L53 62 L50 65 Z" fill="#FF6B5B" />
      <path d="M46 68 Q50 72 54 68" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="20" y1="62" x2="35" y2="63" stroke="#2A1B3D" strokeWidth="1" />
      <line x1="65" y1="63" x2="80" y2="62" stroke="#2A1B3D" strokeWidth="1" />
    </g>
  ),
  fox: (fill) => (
    <g>
      <polygon points="28,30 36,8 48,32" fill={fill} />
      <polygon points="52,32 64,8 72,30" fill={fill} />
      <circle cx="50" cy="55" r="28" fill={fill} />
      <ellipse cx="50" cy="68" rx="16" ry="14" fill="#FFF4E0" />
      <circle cx="42" cy="52" r="3" fill="#2A1B3D" />
      <circle cx="58" cy="52" r="3" fill="#2A1B3D" />
      <circle cx="50" cy="66" r="3" fill="#2A1B3D" />
      <path d="M46 72 Q50 76 54 72" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  owl: (fill) => (
    <g>
      <ellipse cx="50" cy="55" rx="30" ry="32" fill={fill} />
      <polygon points="25,30 28,18 38,28" fill={fill} />
      <polygon points="62,28 72,18 75,30" fill={fill} />
      <circle cx="40" cy="50" r="10" fill="#FFF4E0" />
      <circle cx="60" cy="50" r="10" fill="#FFF4E0" />
      <circle cx="40" cy="50" r="4" fill="#2A1B3D" />
      <circle cx="60" cy="50" r="4" fill="#2A1B3D" />
      <circle cx="41" cy="49" r="1.5" fill="white" />
      <circle cx="61" cy="49" r="1.5" fill="white" />
      <polygon points="47,60 50,66 53,60" fill="#FFD166" />
      <path d="M40 75 Q50 78 60 75" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
};

const FILLS: Record<CompanionKey, string> = {
  bunny: '#FFF4E0',
  kitty: '#E8A5D1',
  fox: '#FF8E80',
  owl: '#B8D4F5',
};

export default function Companion({
  character = 'bunny',
  mood = 'idle',
  size = 120,
}: Props) {
  const renderChar = CHARACTERS[character];
  const fill = FILLS[character];

  const variants: Record<string, any> = {
    idle: { y: [0, -6, 0], rotate: [0, 1, 0] },
    happy: { y: [0, -10, 0], rotate: [-3, 3, -3] },
    cheering: { y: [0, -14, 0], rotate: [-6, 6, -6] },
    thinking: { y: [0, 0, 0], rotate: [-2, 2, -2] },
  };

  const transitions: Record<string, any> = {
    idle: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    happy: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
    cheering: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
    thinking: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  };

  return (
    <motion.div
      animate={variants[mood]}
      transition={transitions[mood]}
      style={{ width: size, height: size, display: 'inline-block' }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {renderChar(fill)}
      </svg>
    </motion.div>
  );
}
