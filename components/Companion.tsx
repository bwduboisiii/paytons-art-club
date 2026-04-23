'use client';

import { motion } from 'framer-motion';
import type { CompanionKey } from '@/lib/types';

interface Props {
  character?: CompanionKey;
  mood?: 'happy' | 'cheering' | 'thinking' | 'idle';
  size?: number;
}

// Compact friendly face-style avatars.
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
  panda: (fill) => (
    <g>
      <circle cx="32" cy="28" r="10" fill="#2A1B3D" />
      <circle cx="68" cy="28" r="10" fill="#2A1B3D" />
      <circle cx="50" cy="55" r="30" fill={fill} />
      <ellipse cx="38" cy="52" rx="8" ry="10" fill="#2A1B3D" />
      <ellipse cx="62" cy="52" rx="8" ry="10" fill="#2A1B3D" />
      <circle cx="38" cy="52" r="3" fill="white" />
      <circle cx="62" cy="52" r="3" fill="white" />
      <ellipse cx="50" cy="65" rx="5" ry="3" fill="#2A1B3D" />
      <path d="M43 72 Q50 76 57 72" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  bear: (fill) => (
    <g>
      <circle cx="30" cy="30" r="10" fill={fill} />
      <circle cx="70" cy="30" r="10" fill={fill} />
      <circle cx="30" cy="30" r="5" fill="#FFB3A7" />
      <circle cx="70" cy="30" r="5" fill="#FFB3A7" />
      <circle cx="50" cy="55" r="30" fill={fill} />
      <ellipse cx="50" cy="68" rx="18" ry="12" fill="#FFF4E0" />
      <circle cx="42" cy="52" r="3" fill="#2A1B3D" />
      <circle cx="58" cy="52" r="3" fill="#2A1B3D" />
      <ellipse cx="50" cy="66" rx="4" ry="3" fill="#2A1B3D" />
      <path d="M44 72 Q50 76 56 72" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  unicorn: (fill) => (
    <g>
      <polygon points="48,10 52,10 50,30" fill="#FFD166" />
      <line x1="49" y1="15" x2="51" y2="15" stroke="#F5B82E" strokeWidth="1" />
      <line x1="49" y1="20" x2="51" y2="20" stroke="#F5B82E" strokeWidth="1" />
      <polygon points="36,28 32,18 42,26" fill={fill} />
      <polygon points="64,28 68,18 58,26" fill={fill} />
      <circle cx="50" cy="55" r="28" fill={fill} />
      <circle cx="35" cy="62" r="5" fill="#E8A5D1" opacity="0.7" />
      <circle cx="65" cy="62" r="5" fill="#E8A5D1" opacity="0.7" />
      <path d="M32 40 Q24 50 30 65 Q36 58 34 48 Z" fill="#E8A5D1" opacity="0.8" />
      <path d="M26 52 Q20 60 26 72 Q32 66 30 58 Z" fill="#B8D4F5" opacity="0.8" />
      <circle cx="42" cy="54" r="3" fill="#2A1B3D" />
      <circle cx="58" cy="54" r="3" fill="#2A1B3D" />
      <circle cx="43" cy="53" r="1" fill="white" />
      <circle cx="59" cy="53" r="1" fill="white" />
      <path d="M46 68 Q50 72 54 68" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  dragon: (fill) => (
    <g>
      <polygon points="34,18 30,8 40,14" fill="#8B4513" />
      <polygon points="66,18 70,8 60,14" fill="#8B4513" />
      <ellipse cx="50" cy="55" rx="30" ry="30" fill={fill} />
      <ellipse cx="50" cy="70" rx="20" ry="10" fill="#FFE59A" opacity="0.7" />
      <path d="M42 72 Q45 68 48 72" stroke="#8B4513" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M52 72 Q55 68 58 72" stroke="#8B4513" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="42" cy="52" r="4" fill="white" />
      <circle cx="58" cy="52" r="4" fill="white" />
      <circle cx="42" cy="52" r="2" fill="#2A1B3D" />
      <circle cx="58" cy="52" r="2" fill="#2A1B3D" />
      <ellipse cx="50" cy="63" rx="8" ry="5" fill="#FFE59A" opacity="0.6" />
      <circle cx="47" cy="63" r="1" fill="#2A1B3D" />
      <circle cx="53" cy="63" r="1" fill="#2A1B3D" />
      <path d="M44 70 Q50 74 56 70" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  monkey: (fill) => (
    <g>
      <circle cx="25" cy="45" r="10" fill={fill} />
      <circle cx="75" cy="45" r="10" fill={fill} />
      <circle cx="25" cy="45" r="5" fill="#FFD9B3" />
      <circle cx="75" cy="45" r="5" fill="#FFD9B3" />
      <circle cx="50" cy="55" r="28" fill={fill} />
      <ellipse cx="50" cy="65" rx="20" ry="15" fill="#FFD9B3" />
      <ellipse cx="40" cy="53" rx="6" ry="7" fill="#FFD9B3" />
      <ellipse cx="60" cy="53" rx="6" ry="7" fill="#FFD9B3" />
      <circle cx="40" cy="54" r="2.5" fill="#2A1B3D" />
      <circle cx="60" cy="54" r="2.5" fill="#2A1B3D" />
      <circle cx="47" cy="64" r="1" fill="#2A1B3D" />
      <circle cx="53" cy="64" r="1" fill="#2A1B3D" />
      <path d="M44 72 Q50 76 56 72" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  sloth: (fill) => (
    <g>
      <ellipse cx="50" cy="55" rx="30" ry="32" fill={fill} />
      <ellipse cx="50" cy="60" rx="22" ry="18" fill="#F1C27D" />
      <path d="M30 50 Q35 45 40 50 L38 48 Z" fill="#6B4423" />
      <path d="M60 50 Q65 45 70 50 L68 48 Z" fill="#6B4423" />
      <ellipse cx="40" cy="56" rx="8" ry="6" fill="#2A1B3D" opacity="0.3" />
      <ellipse cx="60" cy="56" rx="8" ry="6" fill="#2A1B3D" opacity="0.3" />
      <circle cx="40" cy="56" r="2.5" fill="#2A1B3D" />
      <circle cx="60" cy="56" r="2.5" fill="#2A1B3D" />
      <ellipse cx="50" cy="66" rx="3" ry="2" fill="#2A1B3D" />
      <path d="M45 73 Q50 75 55 73" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  octopus: (fill) => (
    <g>
      <ellipse cx="50" cy="40" rx="30" ry="28" fill={fill} />
      {/* Tentacles */}
      <path d="M25 55 Q20 65 22 78 Q28 72 28 62" fill={fill} />
      <path d="M35 60 Q32 75 38 85 Q42 75 40 64" fill={fill} />
      <path d="M50 62 Q48 78 52 88 Q55 78 54 64" fill={fill} />
      <path d="M65 60 Q62 75 58 85 Q54 75 60 64" fill={fill} />
      <path d="M75 55 Q80 65 78 78 Q72 72 72 62" fill={fill} />
      <circle cx="42" cy="38" r="5" fill="white" />
      <circle cx="58" cy="38" r="5" fill="white" />
      <circle cx="42" cy="38" r="2.5" fill="#2A1B3D" />
      <circle cx="58" cy="38" r="2.5" fill="#2A1B3D" />
      <circle cx="35" cy="45" r="3" fill="#FFB3A7" opacity="0.5" />
      <circle cx="65" cy="45" r="3" fill="#FFB3A7" opacity="0.5" />
      <path d="M45 48 Q50 52 55 48" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  deer: (fill) => (
    <g>
      {/* Antlers */}
      <path d="M35 18 L30 5 L32 15 L25 12 L30 20" stroke="#6B4423" strokeWidth="2" fill="none" />
      <path d="M65 18 L70 5 L68 15 L75 12 L70 20" stroke="#6B4423" strokeWidth="2" fill="none" />
      <polygon points="34,30 30,20 42,26" fill={fill} />
      <polygon points="66,30 70,20 58,26" fill={fill} />
      <ellipse cx="50" cy="58" rx="28" ry="30" fill={fill} />
      <ellipse cx="50" cy="68" rx="14" ry="10" fill="#FFF4E0" />
      {/* Spots */}
      <circle cx="35" cy="50" r="2" fill="#FFFBF4" opacity="0.6" />
      <circle cx="65" cy="50" r="2" fill="#FFFBF4" opacity="0.6" />
      <circle cx="42" cy="54" r="3" fill="#2A1B3D" />
      <circle cx="58" cy="54" r="3" fill="#2A1B3D" />
      <circle cx="50" cy="65" r="2.5" fill="#2A1B3D" />
      <path d="M45 72 Q50 75 55 72" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  frog: (fill) => (
    <g>
      <circle cx="50" cy="55" r="30" fill={fill} />
      {/* Eye bumps */}
      <circle cx="35" cy="35" r="12" fill={fill} />
      <circle cx="65" cy="35" r="12" fill={fill} />
      <circle cx="35" cy="35" r="8" fill="white" />
      <circle cx="65" cy="35" r="8" fill="white" />
      <circle cx="35" cy="35" r="4" fill="#2A1B3D" />
      <circle cx="65" cy="35" r="4" fill="#2A1B3D" />
      <circle cx="36" cy="34" r="1.5" fill="white" />
      <circle cx="66" cy="34" r="1.5" fill="white" />
      {/* Mouth */}
      <path d="M35 65 Q50 78 65 65" stroke="#2A1B3D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="60" r="1" fill="#2A1B3D" />
      <circle cx="58" cy="60" r="1" fill="#2A1B3D" />
    </g>
  ),
  penguin: (fill) => (
    <g>
      <ellipse cx="50" cy="55" rx="28" ry="32" fill={fill} />
      <ellipse cx="50" cy="60" rx="18" ry="22" fill="#FFFBF4" />
      <circle cx="42" cy="48" r="3" fill="#2A1B3D" />
      <circle cx="58" cy="48" r="3" fill="#2A1B3D" />
      <circle cx="43" cy="47" r="1" fill="white" />
      <circle cx="59" cy="47" r="1" fill="white" />
      <polygon points="46,55 50,62 54,55 50,58" fill="#FFD166" />
      <path d="M45 70 Q50 73 55 70" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  hedgehog: (fill) => (
    <g>
      {/* Spikes as little triangles */}
      <polygon points="18,50 22,35 28,48" fill="#6B4423" />
      <polygon points="24,40 30,25 36,40" fill="#6B4423" />
      <polygon points="36,32 44,20 48,32" fill="#6B4423" />
      <polygon points="52,32 56,20 64,32" fill="#6B4423" />
      <polygon points="64,40 70,25 76,40" fill="#6B4423" />
      <polygon points="72,50 78,35 82,48" fill="#6B4423" />
      <ellipse cx="50" cy="62" rx="28" ry="22" fill={fill} />
      <ellipse cx="45" cy="65" rx="18" ry="14" fill="#FFD9B3" />
      <circle cx="40" cy="60" r="2.5" fill="#2A1B3D" />
      <circle cx="32" cy="68" r="1.5" fill="#2A1B3D" />
      <path d="M30 75 Q40 78 50 75" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  turtle: (fill) => (
    <g>
      {/* Shell */}
      <ellipse cx="50" cy="55" rx="32" ry="28" fill={fill} />
      {/* Shell pattern */}
      <path d="M50 35 L60 50 L50 65 L40 50 Z" fill="#5FB85F" opacity="0.6" />
      <path d="M30 50 L40 50 L35 60 Z" fill="#5FB85F" opacity="0.6" />
      <path d="M60 50 L70 50 L65 60 Z" fill="#5FB85F" opacity="0.6" />
      {/* Head peeking */}
      <circle cx="50" cy="30" r="10" fill="#B7E4B7" />
      <circle cx="46" cy="28" r="2" fill="#2A1B3D" />
      <circle cx="54" cy="28" r="2" fill="#2A1B3D" />
      <path d="M46 35 Q50 38 54 35" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
};

const FILLS: Record<CompanionKey, string> = {
  bunny: '#FFF4E0', kitty: '#E8A5D1', fox: '#FF8E80', owl: '#B8D4F5',
  panda: '#FFFBF4', bear: '#D4A574', unicorn: '#FFF4E0', dragon: '#8BCE8B',
  monkey: '#A0826D', sloth: '#D4A574', octopus: '#D67FBA', deer: '#D4A574',
  frog: '#8BCE8B', penguin: '#2A1B3D', hedgehog: '#D4A574', turtle: '#5FB85F',
};

export default function Companion({ character = 'bunny', mood = 'idle', size = 120 }: Props) {
  const renderChar = CHARACTERS[character] || CHARACTERS.bunny;
  const fill = FILLS[character] || FILLS.bunny;

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

export const ALL_COMPANIONS: { key: CompanionKey; name: string }[] = [
  { key: 'bunny', name: 'Hoppy' },
  { key: 'kitty', name: 'Whiskers' },
  { key: 'fox', name: 'Rusty' },
  { key: 'owl', name: 'Hoot' },
  { key: 'panda', name: 'Bamboo' },
  { key: 'bear', name: 'Honey' },
  { key: 'unicorn', name: 'Sparkle' },
  { key: 'dragon', name: 'Ember' },
  { key: 'monkey', name: 'Banana' },
  { key: 'sloth', name: 'Snooze' },
  { key: 'octopus', name: 'Inky' },
  { key: 'deer', name: 'Clover' },
  { key: 'frog', name: 'Lily' },
  { key: 'penguin', name: 'Waddle' },
  { key: 'hedgehog', name: 'Spike' },
  { key: 'turtle', name: 'Shelly' },
];
