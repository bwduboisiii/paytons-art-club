'use client';

import { motion } from 'framer-motion';
import type { CompanionKey } from '@/lib/types';

interface Props {
  character?: CompanionKey;
  mood?: 'happy' | 'cheering' | 'thinking' | 'idle';
  size?: number;
}

// Full-body friendly avatars (v16b). viewBox is 100x140.
// Layout convention:
//   Head: roughly cy=34, r=22-24
//   Body: cy=80-85, rx=22-26, ry=20-24
//   Legs: from y=110 to y=135
//   Arms: at side around y=75-90
const CHARACTERS: Record<CompanionKey, (fill: string) => JSX.Element> = {
  bunny: (fill) => (
    <g>
      {/* Long ears */}
      <ellipse cx="40" cy="14" rx="6" ry="14" fill={fill} />
      <ellipse cx="40" cy="14" rx="2.5" ry="9" fill="#FFB3A7" />
      <ellipse cx="60" cy="14" rx="6" ry="14" fill={fill} />
      <ellipse cx="60" cy="14" rx="2.5" ry="9" fill="#FFB3A7" />
      {/* Head */}
      <circle cx="50" cy="36" r="20" fill={fill} />
      {/* Cheeks */}
      <circle cx="36" cy="40" r="3.5" fill="#FFB3A7" opacity="0.6" />
      <circle cx="64" cy="40" r="3.5" fill="#FFB3A7" opacity="0.6" />
      {/* Eyes */}
      <circle cx="44" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="56" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="33.5" r="0.7" fill="white" />
      <circle cx="56.5" cy="33.5" r="0.7" fill="white" />
      {/* Nose + mouth */}
      <path d="M48 41 L50 39 L52 41 Z" fill="#FF6B5B" />
      <path d="M47 43 Q50 46 53 43" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="82" rx="22" ry="22" fill={fill} />
      <ellipse cx="50" cy="86" rx="13" ry="14" fill="#FFFBF4" opacity="0.7" />
      {/* Arms */}
      <ellipse cx="28" cy="78" rx="6" ry="11" fill={fill} transform="rotate(-15 28 78)" />
      <ellipse cx="72" cy="78" rx="6" ry="11" fill={fill} transform="rotate(15 72 78)" />
      {/* Legs / feet */}
      <ellipse cx="40" cy="115" rx="9" ry="7" fill={fill} />
      <ellipse cx="60" cy="115" rx="9" ry="7" fill={fill} />
      <ellipse cx="40" cy="116" rx="5" ry="3" fill="#FFB3A7" />
      <ellipse cx="60" cy="116" rx="5" ry="3" fill="#FFB3A7" />
      {/* Cottontail (peeking from behind) */}
      <circle cx="73" cy="92" r="6" fill="#FFFBF4" stroke={fill} strokeWidth="1.5" />
    </g>
  ),

  kitty: (fill) => (
    <g>
      {/* Pointy triangle ears */}
      <polygon points="32,18 40,4 48,20" fill={fill} />
      <polygon points="52,20 60,4 68,18" fill={fill} />
      <polygon points="36,16 40,8 44,18" fill="#FFB3A7" />
      <polygon points="56,18 60,8 64,16" fill="#FFB3A7" />
      {/* Head */}
      <circle cx="50" cy="36" r="20" fill={fill} />
      {/* Eyes */}
      <ellipse cx="44" cy="34" rx="2.5" ry="3.5" fill="#5FB85F" />
      <ellipse cx="56" cy="34" rx="2.5" ry="3.5" fill="#5FB85F" />
      <ellipse cx="44" cy="34" rx="0.8" ry="3" fill="#2A1B3D" />
      <ellipse cx="56" cy="34" rx="0.8" ry="3" fill="#2A1B3D" />
      {/* Nose + mouth */}
      <path d="M48 41 L52 41 L50 43 Z" fill="#FF6B5B" />
      <path d="M50 43 Q47 45 47 43 M50 43 Q53 45 53 43" stroke="#2A1B3D" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Whiskers */}
      <path d="M30 41 L40 42 M30 44 L40 44" stroke="#2A1B3D" strokeWidth="0.7" />
      <path d="M70 41 L60 42 M70 44 L60 44" stroke="#2A1B3D" strokeWidth="0.7" />
      {/* Body */}
      <ellipse cx="50" cy="82" rx="22" ry="22" fill={fill} />
      <ellipse cx="50" cy="86" rx="12" ry="13" fill="#FFFBF4" opacity="0.6" />
      {/* Arms */}
      <ellipse cx="28" cy="78" rx="6" ry="11" fill={fill} transform="rotate(-15 28 78)" />
      <ellipse cx="72" cy="78" rx="6" ry="11" fill={fill} transform="rotate(15 72 78)" />
      {/* Legs */}
      <ellipse cx="40" cy="115" rx="8" ry="7" fill={fill} />
      <ellipse cx="60" cy="115" rx="8" ry="7" fill={fill} />
      {/* Tail (curling up) */}
      <path d="M70 95 q 18 -5 14 -25 q -3 8 -10 12" fill={fill} stroke={fill} strokeWidth="2" />
    </g>
  ),

  fox: (fill) => (
    <g>
      {/* Pointy ears */}
      <polygon points="30,18 38,2 46,20" fill={fill} />
      <polygon points="54,20 62,2 70,18" fill={fill} />
      <polygon points="34,16 38,8 42,18" fill="#FFFBF4" />
      <polygon points="58,18 62,8 66,16" fill="#FFFBF4" />
      {/* Head */}
      <ellipse cx="50" cy="36" rx="20" ry="19" fill={fill} />
      {/* White face mask */}
      <path d="M40 40 Q50 50 60 40 Q60 48 50 50 Q40 48 40 40 Z" fill="#FFFBF4" />
      {/* Eyes */}
      <circle cx="44" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="56" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="33.5" r="0.7" fill="white" />
      <circle cx="56.5" cy="33.5" r="0.7" fill="white" />
      {/* Black nose */}
      <ellipse cx="50" cy="44" rx="2" ry="1.5" fill="#2A1B3D" />
      <path d="M48 47 Q50 49 52 47" stroke="#2A1B3D" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="82" rx="22" ry="22" fill={fill} />
      <ellipse cx="50" cy="86" rx="12" ry="13" fill="#FFFBF4" opacity="0.7" />
      {/* Arms */}
      <ellipse cx="28" cy="78" rx="6" ry="11" fill={fill} transform="rotate(-15 28 78)" />
      <ellipse cx="72" cy="78" rx="6" ry="11" fill={fill} transform="rotate(15 72 78)" />
      {/* Legs (with white feet) */}
      <ellipse cx="40" cy="115" rx="8" ry="7" fill={fill} />
      <ellipse cx="60" cy="115" rx="8" ry="7" fill={fill} />
      <ellipse cx="40" cy="118" rx="6" ry="3" fill="#FFFBF4" />
      <ellipse cx="60" cy="118" rx="6" ry="3" fill="#FFFBF4" />
      {/* Big bushy tail */}
      <path d="M73 85 q 18 -5 16 5 q 0 10 -5 15 q -8 5 -15 -8" fill={fill} />
      <ellipse cx="86" cy="98" rx="4" ry="6" fill="#FFFBF4" />
    </g>
  ),

  owl: (fill) => (
    <g>
      {/* Tufts (ear-feathers) */}
      <path d="M34 18 L30 4 L40 16 Z" fill={fill} />
      <path d="M66 18 L70 4 L60 16 Z" fill={fill} />
      {/* Head */}
      <circle cx="50" cy="36" r="22" fill={fill} />
      {/* Big circle eyes */}
      <circle cx="42" cy="34" r="6" fill="#FFFBF4" />
      <circle cx="58" cy="34" r="6" fill="#FFFBF4" />
      <circle cx="42" cy="34" r="3" fill="#2A1B3D" />
      <circle cx="58" cy="34" r="3" fill="#2A1B3D" />
      <circle cx="43" cy="33" r="1" fill="white" />
      <circle cx="59" cy="33" r="1" fill="white" />
      {/* Beak */}
      <path d="M48 40 L52 40 L50 45 Z" fill="#FFD166" />
      {/* Body */}
      <ellipse cx="50" cy="86" rx="24" ry="24" fill={fill} />
      {/* Belly feathers */}
      <ellipse cx="50" cy="88" rx="14" ry="16" fill="#FFFBF4" opacity="0.7" />
      <path d="M42 80 q 4 4 8 0 M50 80 q 4 4 8 0 M42 92 q 4 4 8 0 M50 92 q 4 4 8 0" stroke="#2A1B3D" strokeWidth="0.6" fill="none" opacity="0.4" />
      {/* Wings */}
      <path d="M30 80 q -8 8 0 22 q 8 -3 8 -18" fill={fill} />
      <path d="M70 80 q 8 8 0 22 q -8 -3 -8 -18" fill={fill} />
      {/* Feet */}
      <path d="M44 116 l 0 8 M46 116 l 0 8 M48 116 l 0 8" stroke="#FFD166" strokeWidth="1.6" />
      <path d="M52 116 l 0 8 M54 116 l 0 8 M56 116 l 0 8" stroke="#FFD166" strokeWidth="1.6" />
    </g>
  ),

  panda: (fill) => (
    <g>
      {/* Round black ears */}
      <circle cx="32" cy="20" r="7" fill="#2A1B3D" />
      <circle cx="68" cy="20" r="7" fill="#2A1B3D" />
      {/* Head */}
      <circle cx="50" cy="36" r="22" fill={fill} />
      {/* Black eye patches */}
      <ellipse cx="42" cy="34" rx="5" ry="6" fill="#2A1B3D" transform="rotate(-15 42 34)" />
      <ellipse cx="58" cy="34" rx="5" ry="6" fill="#2A1B3D" transform="rotate(15 58 34)" />
      {/* Eyes inside patches */}
      <circle cx="42" cy="34" r="2" fill="#FFFBF4" />
      <circle cx="58" cy="34" r="2" fill="#FFFBF4" />
      <circle cx="42" cy="34" r="1" fill="#2A1B3D" />
      <circle cx="58" cy="34" r="1" fill="#2A1B3D" />
      {/* Nose + mouth */}
      <ellipse cx="50" cy="42" rx="1.8" ry="1.3" fill="#2A1B3D" />
      <path d="M50 43 L50 46 M48 47 q 2 1.5 4 0" stroke="#2A1B3D" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="84" rx="24" ry="24" fill={fill} />
      {/* Black chest band */}
      <path d="M30 75 q 20 6 40 0 l 0 18 q -20 6 -40 0 z" fill="#2A1B3D" />
      {/* Arms (black) */}
      <ellipse cx="26" cy="80" rx="7" ry="12" fill="#2A1B3D" transform="rotate(-15 26 80)" />
      <ellipse cx="74" cy="80" rx="7" ry="12" fill="#2A1B3D" transform="rotate(15 74 80)" />
      {/* Legs (black) */}
      <ellipse cx="40" cy="118" rx="9" ry="8" fill="#2A1B3D" />
      <ellipse cx="60" cy="118" rx="9" ry="8" fill="#2A1B3D" />
    </g>
  ),

  bear: (fill) => (
    <g>
      {/* Round ears */}
      <circle cx="32" cy="20" r="7" fill={fill} />
      <circle cx="68" cy="20" r="7" fill={fill} />
      <circle cx="32" cy="22" r="3.5" fill="#FFB3A7" />
      <circle cx="68" cy="22" r="3.5" fill="#FFB3A7" />
      {/* Head */}
      <circle cx="50" cy="36" r="22" fill={fill} />
      {/* Snout (lighter) */}
      <ellipse cx="50" cy="44" rx="9" ry="7" fill="#FFE0BD" />
      {/* Eyes */}
      <circle cx="43" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="57" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="43.5" cy="33.5" r="0.7" fill="white" />
      <circle cx="57.5" cy="33.5" r="0.7" fill="white" />
      {/* Nose */}
      <ellipse cx="50" cy="42" rx="2" ry="1.5" fill="#2A1B3D" />
      <path d="M48 46 q 2 2 4 0" stroke="#2A1B3D" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="84" rx="24" ry="24" fill={fill} />
      {/* Tummy */}
      <ellipse cx="50" cy="88" rx="14" ry="15" fill="#FFE0BD" opacity="0.7" />
      {/* Arms */}
      <ellipse cx="26" cy="80" rx="7" ry="12" fill={fill} transform="rotate(-15 26 80)" />
      <ellipse cx="74" cy="80" rx="7" ry="12" fill={fill} transform="rotate(15 74 80)" />
      {/* Legs */}
      <ellipse cx="40" cy="118" rx="9" ry="8" fill={fill} />
      <ellipse cx="60" cy="118" rx="9" ry="8" fill={fill} />
      <ellipse cx="40" cy="119" rx="5" ry="3" fill="#FFE0BD" />
      <ellipse cx="60" cy="119" rx="5" ry="3" fill="#FFE0BD" />
    </g>
  ),

  unicorn: (fill) => (
    <g>
      {/* Horn */}
      <path d="M48 5 L52 5 L51 22 L49 22 Z" fill="#FFD166" />
      <path d="M48 10 Q52 11 49 14 M48 14 Q52 15 49 18" stroke="#FFFBF4" strokeWidth="0.8" fill="none" />
      {/* Ears */}
      <ellipse cx="38" cy="20" rx="4" ry="8" fill={fill} />
      <ellipse cx="62" cy="20" rx="4" ry="8" fill={fill} />
      <ellipse cx="38" cy="22" rx="1.5" ry="4" fill="#FFB3A7" />
      <ellipse cx="62" cy="22" rx="1.5" ry="4" fill="#FFB3A7" />
      {/* Head */}
      <circle cx="50" cy="36" r="22" fill={fill} />
      {/* Mane (rainbow tufts above head) */}
      <path d="M30 28 q 5 -10 12 -8" stroke="#D67FBA" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M28 36 q 4 -8 12 -4" stroke="#FFD166" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M28 44 q 5 -6 12 0" stroke="#8FB8E8" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Eyes (closed-content with eyelashes) */}
      <path d="M42 33 q 3 -3 6 0" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M52 33 q 3 -3 6 0" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M40 31 l -2 -2 M44 30 l 0 -2 M48 31 l 2 -2 M52 31 l -2 -2 M56 30 l 0 -2 M60 31 l 2 -2" stroke="#2A1B3D" strokeWidth="0.8" />
      {/* Cheeks */}
      <circle cx="38" cy="40" r="3" fill="#D67FBA" opacity="0.5" />
      <circle cx="62" cy="40" r="3" fill="#D67FBA" opacity="0.5" />
      {/* Smile */}
      <path d="M46 44 Q50 47 54 44" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="84" rx="24" ry="22" fill={fill} />
      {/* Rainbow tail */}
      <path d="M73 85 q 12 0 15 -5" stroke="#D67FBA" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M73 90 q 12 0 15 0" stroke="#FFD166" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M73 95 q 12 0 15 5" stroke="#8FB8E8" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <rect x="36" y="105" width="8" height="22" rx="3" fill={fill} />
      <rect x="56" y="105" width="8" height="22" rx="3" fill={fill} />
      {/* Hooves */}
      <ellipse cx="40" cy="128" rx="5" ry="3" fill="#2A1B3D" />
      <ellipse cx="60" cy="128" rx="5" ry="3" fill="#2A1B3D" />
    </g>
  ),

  dragon: (fill) => (
    <g>
      {/* Horns */}
      <path d="M38 18 L36 6 L42 14 Z" fill="#FFD166" />
      <path d="M62 18 L64 6 L58 14 Z" fill="#FFD166" />
      {/* Head */}
      <circle cx="50" cy="36" r="22" fill={fill} />
      {/* Dragon snout */}
      <ellipse cx="50" cy="44" rx="10" ry="7" fill={fill} />
      {/* Belly/face stripe */}
      <ellipse cx="50" cy="46" rx="6" ry="4" fill="#FFE0BD" opacity="0.6" />
      {/* Eyes */}
      <ellipse cx="43" cy="32" rx="2.5" ry="3.5" fill="#FFD166" />
      <ellipse cx="57" cy="32" rx="2.5" ry="3.5" fill="#FFD166" />
      <ellipse cx="43" cy="32" rx="0.8" ry="2.5" fill="#2A1B3D" />
      <ellipse cx="57" cy="32" rx="0.8" ry="2.5" fill="#2A1B3D" />
      {/* Nostrils */}
      <circle cx="46" cy="44" r="0.8" fill="#2A1B3D" />
      <circle cx="54" cy="44" r="0.8" fill="#2A1B3D" />
      {/* Smile (with little fang) */}
      <path d="M46 49 q 4 3 8 0" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M48 49 L48 51 M52 49 L52 51" stroke="#FFFBF4" strokeWidth="1.2" />
      {/* Body */}
      <ellipse cx="50" cy="84" rx="24" ry="22" fill={fill} />
      <ellipse cx="50" cy="88" rx="14" ry="14" fill="#FFE0BD" opacity="0.5" />
      {/* Wings (small) */}
      <path d="M28 70 q -10 -8 -8 4 q 5 6 12 4 z" fill={fill} />
      <path d="M72 70 q 10 -8 8 4 q -5 6 -12 4 z" fill={fill} />
      {/* Spikes along back */}
      <path d="M50 60 l -3 6 l 3 0 z" fill="#FFD166" />
      <path d="M50 70 l -3 6 l 3 0 z" fill="#FFD166" />
      <path d="M50 80 l -3 6 l 3 0 z" fill="#FFD166" />
      {/* Arms */}
      <ellipse cx="28" cy="80" rx="6" ry="11" fill={fill} transform="rotate(-15 28 80)" />
      <ellipse cx="72" cy="80" rx="6" ry="11" fill={fill} transform="rotate(15 72 80)" />
      {/* Legs */}
      <ellipse cx="40" cy="116" rx="8" ry="7" fill={fill} />
      <ellipse cx="60" cy="116" rx="8" ry="7" fill={fill} />
      {/* Tail */}
      <path d="M73 92 q 14 0 18 12 q -2 4 -8 0" fill={fill} />
    </g>
  ),
  monkey: (fill) => (
    <g>
      {/* Big round ears */}
      <circle cx="28" cy="32" r="8" fill={fill} />
      <circle cx="72" cy="32" r="8" fill={fill} />
      <circle cx="28" cy="32" r="4.5" fill="#FFD9B3" />
      <circle cx="72" cy="32" r="4.5" fill="#FFD9B3" />
      {/* Head */}
      <circle cx="50" cy="36" r="20" fill={fill} />
      {/* Light face oval */}
      <ellipse cx="50" cy="40" rx="13" ry="11" fill="#FFD9B3" />
      {/* Eyes */}
      <circle cx="44" cy="35" r="2.2" fill="#2A1B3D" />
      <circle cx="56" cy="35" r="2.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="34.5" r="0.7" fill="white" />
      <circle cx="56.5" cy="34.5" r="0.7" fill="white" />
      {/* Nostrils + smile */}
      <circle cx="48" cy="42" r="0.8" fill="#2A1B3D" />
      <circle cx="52" cy="42" r="0.8" fill="#2A1B3D" />
      <path d="M45 46 Q50 49 55 46" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="84" rx="22" ry="22" fill={fill} />
      <ellipse cx="50" cy="86" rx="13" ry="14" fill="#FFD9B3" opacity="0.7" />
      {/* Arms (one up, one down — playful) */}
      <ellipse cx="26" cy="74" rx="6" ry="13" fill={fill} transform="rotate(-30 26 74)" />
      <ellipse cx="74" cy="84" rx="6" ry="13" fill={fill} transform="rotate(15 74 84)" />
      {/* Legs */}
      <ellipse cx="40" cy="116" rx="8" ry="7" fill={fill} />
      <ellipse cx="60" cy="116" rx="8" ry="7" fill={fill} />
      {/* Curly tail */}
      <path d="M73 88 q 14 -2 12 -14 q -3 6 -10 6" stroke={fill} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),

  sloth: (fill) => (
    <g>
      {/* Head (big round) */}
      <circle cx="50" cy="36" r="22" fill={fill} />
      {/* Lighter face mask */}
      <ellipse cx="50" cy="40" rx="16" ry="13" fill="#F1C27D" />
      {/* Brown eye stripes */}
      <path d="M28 32 q 10 6 20 4 l -2 4 q -10 0 -19 -3 z" fill="#6B4423" opacity="0.6" />
      <path d="M72 32 q -10 6 -20 4 l 2 4 q 10 0 19 -3 z" fill="#6B4423" opacity="0.6" />
      {/* Sleepy closed eyes */}
      <path d="M42 36 q 3 -2 6 0" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M52 36 q 3 -2 6 0" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Nose + sweet smile */}
      <ellipse cx="50" cy="44" rx="2" ry="1.2" fill="#2A1B3D" />
      <path d="M46 47 Q50 50 54 47" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Body (chubby) */}
      <ellipse cx="50" cy="86" rx="24" ry="22" fill={fill} />
      <ellipse cx="50" cy="88" rx="14" ry="14" fill="#F1C27D" opacity="0.6" />
      {/* Long arms hanging down (like sloths do) */}
      <ellipse cx="24" cy="86" rx="6" ry="14" fill={fill} transform="rotate(-10 24 86)" />
      <ellipse cx="76" cy="86" rx="6" ry="14" fill={fill} transform="rotate(10 76 86)" />
      {/* Claws on hand tips */}
      <path d="M22 100 l -2 4 m 4 0 l 2 4" stroke="#2A1B3D" strokeWidth="1" fill="none" />
      <path d="M78 100 l 2 4 m -4 0 l -2 4" stroke="#2A1B3D" strokeWidth="1" fill="none" />
      {/* Stubby legs */}
      <ellipse cx="40" cy="118" rx="8" ry="7" fill={fill} />
      <ellipse cx="60" cy="118" rx="8" ry="7" fill={fill} />
    </g>
  ),

  octopus: (fill) => (
    <g>
      {/* Big round head */}
      <ellipse cx="50" cy="40" rx="28" ry="26" fill={fill} />
      {/* Eyes (big and friendly) */}
      <circle cx="42" cy="36" r="5" fill="white" />
      <circle cx="58" cy="36" r="5" fill="white" />
      <circle cx="42" cy="36" r="2.5" fill="#2A1B3D" />
      <circle cx="58" cy="36" r="2.5" fill="#2A1B3D" />
      <circle cx="43" cy="35" r="0.9" fill="white" />
      <circle cx="59" cy="35" r="0.9" fill="white" />
      {/* Cheeks */}
      <circle cx="34" cy="44" r="3" fill="#FFB3A7" opacity="0.5" />
      <circle cx="66" cy="44" r="3" fill="#FFB3A7" opacity="0.5" />
      {/* Smile */}
      <path d="M44 48 Q50 52 56 48" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* 8 wavy tentacles spreading down */}
      <path d="M28 60 q -5 25 -10 50 q 6 4 8 -10 q -3 -20 4 -38" fill={fill} />
      <path d="M36 64 q -3 28 -2 56 q 6 0 4 -16 q -4 -22 4 -38" fill={fill} />
      <path d="M45 66 q -2 30 0 60 q 6 -2 4 -18 q -4 -24 1 -40" fill={fill} />
      <path d="M55 66 q 2 30 0 60 q -6 -2 -4 -18 q 4 -24 -1 -40" fill={fill} />
      <path d="M64 64 q 3 28 2 56 q -6 0 -4 -16 q 4 -22 -4 -38" fill={fill} />
      <path d="M72 60 q 5 25 10 50 q -6 4 -8 -10 q 3 -20 -4 -38" fill={fill} />
      <path d="M22 56 q -8 18 -8 38 q 4 4 6 -6 q -2 -18 4 -28" fill={fill} />
      <path d="M78 56 q 8 18 8 38 q -4 4 -6 -6 q 2 -18 -4 -28" fill={fill} />
      {/* Tiny suction-cup dots on a couple tentacles */}
      <circle cx="20" cy="100" r="1.2" fill="#FFB3A7" />
      <circle cx="80" cy="100" r="1.2" fill="#FFB3A7" />
      <circle cx="50" cy="120" r="1.5" fill="#FFB3A7" />
    </g>
  ),

  deer: (fill) => (
    <g>
      {/* Antlers */}
      <path d="M36 14 L33 4 M36 14 L28 8 M36 14 L40 6" stroke="#6B4423" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M64 14 L67 4 M64 14 L72 8 M64 14 L60 6" stroke="#6B4423" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Ears */}
      <ellipse cx="32" cy="24" rx="5" ry="8" fill={fill} transform="rotate(-25 32 24)" />
      <ellipse cx="68" cy="24" rx="5" ry="8" fill={fill} transform="rotate(25 68 24)" />
      <ellipse cx="32" cy="25" rx="2" ry="4" fill="#FFB3A7" transform="rotate(-25 32 25)" />
      <ellipse cx="68" cy="25" rx="2" ry="4" fill="#FFB3A7" transform="rotate(25 68 25)" />
      {/* Head */}
      <ellipse cx="50" cy="38" rx="18" ry="20" fill={fill} />
      {/* Snout (lighter) */}
      <ellipse cx="50" cy="48" rx="9" ry="6" fill="#FFE0BD" />
      {/* Eyes */}
      <circle cx="44" cy="36" r="2.2" fill="#2A1B3D" />
      <circle cx="56" cy="36" r="2.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="35.5" r="0.7" fill="white" />
      <circle cx="56.5" cy="35.5" r="0.7" fill="white" />
      {/* Nose + smile */}
      <ellipse cx="50" cy="46" rx="2" ry="1.2" fill="#2A1B3D" />
      <path d="M47 50 q 3 2 6 0" stroke="#2A1B3D" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="84" rx="22" ry="20" fill={fill} />
      {/* White spots */}
      <circle cx="38" cy="80" r="2" fill="#FFFBF4" opacity="0.7" />
      <circle cx="62" cy="80" r="2" fill="#FFFBF4" opacity="0.7" />
      <circle cx="50" cy="92" r="2" fill="#FFFBF4" opacity="0.7" />
      {/* Slim deer legs */}
      <rect x="38" y="100" width="5" height="28" rx="2" fill={fill} />
      <rect x="57" y="100" width="5" height="28" rx="2" fill={fill} />
      <ellipse cx="40.5" cy="130" rx="4" ry="2" fill="#2A1B3D" />
      <ellipse cx="59.5" cy="130" rx="4" ry="2" fill="#2A1B3D" />
      {/* Tiny tail */}
      <ellipse cx="73" cy="80" rx="3" ry="4" fill="#FFFBF4" />
    </g>
  ),

  frog: (fill) => (
    <g>
      {/* Bug-eye bumps on top of head */}
      <circle cx="34" cy="20" r="10" fill={fill} />
      <circle cx="66" cy="20" r="10" fill={fill} />
      {/* Eye whites and pupils */}
      <circle cx="34" cy="20" r="6" fill="white" />
      <circle cx="66" cy="20" r="6" fill="white" />
      <circle cx="34" cy="20" r="3" fill="#2A1B3D" />
      <circle cx="66" cy="20" r="3" fill="#2A1B3D" />
      <circle cx="35" cy="19" r="1" fill="white" />
      <circle cx="67" cy="19" r="1" fill="white" />
      {/* Head */}
      <ellipse cx="50" cy="38" rx="22" ry="18" fill={fill} />
      {/* Lighter belly visible through head */}
      <ellipse cx="50" cy="44" rx="14" ry="6" fill="#B7E4B7" opacity="0.6" />
      {/* Cheeks */}
      <circle cx="32" cy="42" r="2.5" fill="#FF6B5B" opacity="0.5" />
      <circle cx="68" cy="42" r="2.5" fill="#FF6B5B" opacity="0.5" />
      {/* Wide smile */}
      <path d="M36 46 Q50 56 64 46" stroke="#2A1B3D" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Tiny nostrils */}
      <circle cx="46" cy="40" r="0.7" fill="#2A1B3D" />
      <circle cx="54" cy="40" r="0.7" fill="#2A1B3D" />
      {/* Body */}
      <ellipse cx="50" cy="82" rx="24" ry="20" fill={fill} />
      {/* Lighter belly */}
      <ellipse cx="50" cy="88" rx="16" ry="14" fill="#B7E4B7" />
      {/* Front legs (bent, like frog sitting) */}
      <ellipse cx="28" cy="78" rx="5" ry="10" fill={fill} transform="rotate(-30 28 78)" />
      <ellipse cx="72" cy="78" rx="5" ry="10" fill={fill} transform="rotate(30 72 78)" />
      {/* Webbed front feet */}
      <path d="M22 88 l -2 4 l 4 0 m -2 -2 l 0 4" stroke={fill} strokeWidth="1.5" fill="none" />
      <path d="M78 88 l 2 4 l -4 0 m 2 -2 l 0 4" stroke={fill} strokeWidth="1.5" fill="none" />
      {/* Strong back legs (folded) */}
      <ellipse cx="32" cy="112" rx="11" ry="8" fill={fill} transform="rotate(-15 32 112)" />
      <ellipse cx="68" cy="112" rx="11" ry="8" fill={fill} transform="rotate(15 68 112)" />
      {/* Webbed back feet */}
      <path d="M22 122 l -3 6 l 6 0 z" fill={fill} />
      <path d="M78 122 l 3 6 l -6 0 z" fill={fill} />
    </g>
  ),

  penguin: (fill) => (
    <g>
      {/* Head */}
      <circle cx="50" cy="32" r="20" fill={fill} />
      {/* White face */}
      <ellipse cx="50" cy="38" rx="14" ry="13" fill="#FFFBF4" />
      {/* Eyes */}
      <circle cx="44" cy="32" r="2.5" fill="#2A1B3D" />
      <circle cx="56" cy="32" r="2.5" fill="#2A1B3D" />
      <circle cx="44.5" cy="31.5" r="0.8" fill="white" />
      <circle cx="56.5" cy="31.5" r="0.8" fill="white" />
      {/* Orange beak */}
      <path d="M46 40 L54 40 L50 46 Z" fill="#FFD166" />
      {/* Body (egg-shaped) */}
      <ellipse cx="50" cy="85" rx="24" ry="28" fill={fill} />
      {/* White tummy */}
      <ellipse cx="50" cy="88" rx="15" ry="22" fill="#FFFBF4" />
      {/* Flippers */}
      <ellipse cx="24" cy="80" rx="5" ry="14" fill={fill} transform="rotate(-15 24 80)" />
      <ellipse cx="76" cy="80" rx="5" ry="14" fill={fill} transform="rotate(15 76 80)" />
      {/* Orange feet */}
      <path d="M40 116 l -6 8 l 12 0 z" fill="#FFD166" />
      <path d="M60 116 l -6 8 l 12 0 z" fill="#FFD166" />
    </g>
  ),

  hedgehog: (fill) => (
    <g>
      {/* Spikes (lots of little triangles around upper body) */}
      <polygon points="20,42 18,28 26,38" fill="#6B4423" />
      <polygon points="26,32 28,18 34,30" fill="#6B4423" />
      <polygon points="36,24 40,12 44,24" fill="#6B4423" />
      <polygon points="48,20 50,8 52,20" fill="#6B4423" />
      <polygon points="56,24 60,12 64,24" fill="#6B4423" />
      <polygon points="66,32 72,18 74,30" fill="#6B4423" />
      <polygon points="74,42 82,28 80,38" fill="#6B4423" />
      {/* Side spikes lower */}
      <polygon points="16,55 12,45 22,52" fill="#6B4423" />
      <polygon points="84,55 88,45 78,52" fill="#6B4423" />
      {/* Body (hedgehog face/belly) */}
      <ellipse cx="50" cy="60" rx="28" ry="24" fill={fill} />
      {/* Lighter belly */}
      <ellipse cx="50" cy="68" rx="20" ry="16" fill="#FFE0BD" />
      {/* Pointy snout poking out */}
      <ellipse cx="50" cy="76" rx="6" ry="4" fill="#FFE0BD" />
      {/* Tiny black nose */}
      <ellipse cx="50" cy="78" rx="1.5" ry="1" fill="#2A1B3D" />
      {/* Bright eyes */}
      <circle cx="42" cy="62" r="2.5" fill="#2A1B3D" />
      <circle cx="58" cy="62" r="2.5" fill="#2A1B3D" />
      <circle cx="42.5" cy="61.5" r="0.8" fill="white" />
      <circle cx="58.5" cy="61.5" r="0.8" fill="white" />
      {/* Smile */}
      <path d="M46 80 q 4 3 8 0" stroke="#2A1B3D" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Tiny feet poking out */}
      <ellipse cx="38" cy="100" rx="6" ry="5" fill={fill} />
      <ellipse cx="62" cy="100" rx="6" ry="5" fill={fill} />
      <ellipse cx="38" cy="120" rx="7" ry="4" fill="#FFE0BD" />
      <ellipse cx="62" cy="120" rx="7" ry="4" fill="#FFE0BD" />
    </g>
  ),

  turtle: (fill) => (
    <g>
      {/* Head */}
      <circle cx="50" cy="32" r="14" fill="#B7E4B7" />
      {/* Eyes */}
      <circle cx="44" cy="30" r="2.2" fill="#2A1B3D" />
      <circle cx="56" cy="30" r="2.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="29.5" r="0.7" fill="white" />
      <circle cx="56.5" cy="29.5" r="0.7" fill="white" />
      {/* Cheeks */}
      <circle cx="38" cy="36" r="2.5" fill="#FF6B5B" opacity="0.5" />
      <circle cx="62" cy="36" r="2.5" fill="#FF6B5B" opacity="0.5" />
      {/* Smile */}
      <path d="M45 38 Q50 41 55 38" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Big shell (body) */}
      <ellipse cx="50" cy="80" rx="32" ry="26" fill={fill} />
      {/* Shell pattern (hexagonal-ish chunks) */}
      <path d="M50 60 L62 75 L50 90 L38 75 Z" fill="#3D8B3D" opacity="0.6" />
      <path d="M22 75 L38 75 L30 90 Z" fill="#3D8B3D" opacity="0.5" />
      <path d="M62 75 L78 75 L70 90 Z" fill="#3D8B3D" opacity="0.5" />
      <path d="M30 60 L42 65 L36 73 Z" fill="#3D8B3D" opacity="0.5" />
      <path d="M70 60 L58 65 L64 73 Z" fill="#3D8B3D" opacity="0.5" />
      {/* Stubby front legs */}
      <ellipse cx="22" cy="80" rx="6" ry="6" fill="#B7E4B7" />
      <ellipse cx="78" cy="80" rx="6" ry="6" fill="#B7E4B7" />
      {/* Back legs */}
      <ellipse cx="32" cy="108" rx="7" ry="6" fill="#B7E4B7" />
      <ellipse cx="68" cy="108" rx="7" ry="6" fill="#B7E4B7" />
      {/* Tiny tail */}
      <path d="M82 92 l 6 4 l -6 2 z" fill="#B7E4B7" />
    </g>
  ),

  // ===== NEW IN v13 (full-body in v16b) =====

  dog: (fill) => (
    <g>
      {/* Floppy ears */}
      <ellipse cx="30" cy="32" rx="7" ry="14" fill="#8B5A3C" transform="rotate(-20 30 32)" />
      <ellipse cx="70" cy="32" rx="7" ry="14" fill="#8B5A3C" transform="rotate(20 70 32)" />
      {/* Head */}
      <circle cx="50" cy="36" r="20" fill={fill} />
      {/* Snout (lighter) */}
      <ellipse cx="50" cy="44" rx="10" ry="7" fill="#FFF4E0" />
      {/* Eyes */}
      <circle cx="44" cy="34" r="2.5" fill="#2A1B3D" />
      <circle cx="56" cy="34" r="2.5" fill="#2A1B3D" />
      <circle cx="44.5" cy="33.5" r="0.8" fill="white" />
      <circle cx="56.5" cy="33.5" r="0.8" fill="white" />
      {/* Black nose */}
      <ellipse cx="50" cy="42" rx="2" ry="1.5" fill="#2A1B3D" />
      {/* Pink tongue */}
      <path d="M47 47 q 3 5 6 0 l 0 3 q -3 4 -6 0 z" fill="#FF6B5B" />
      {/* Brown spot on head */}
      <ellipse cx="40" cy="28" rx="5" ry="4" fill="#8B5A3C" opacity="0.7" />
      {/* Body */}
      <ellipse cx="50" cy="84" rx="22" ry="22" fill={fill} />
      <ellipse cx="50" cy="86" rx="13" ry="14" fill="#FFF4E0" opacity="0.6" />
      {/* Arms */}
      <ellipse cx="28" cy="78" rx="6" ry="11" fill={fill} transform="rotate(-15 28 78)" />
      <ellipse cx="72" cy="78" rx="6" ry="11" fill={fill} transform="rotate(15 72 78)" />
      {/* Legs */}
      <ellipse cx="40" cy="116" rx="8" ry="7" fill={fill} />
      <ellipse cx="60" cy="116" rx="8" ry="7" fill={fill} />
      {/* Wagging tail */}
      <path d="M73 88 q 14 -8 16 0 q -2 6 -10 4" fill={fill} />
    </g>
  ),

  husky: (fill) => (
    <g>
      {/* Pointy ears */}
      <polygon points="30,16 35,2 42,18" fill={fill} />
      <polygon points="58,18 65,2 70,16" fill={fill} />
      <polygon points="33,16 36,8 39,18" fill="#FFB3A7" />
      <polygon points="61,18 64,8 67,16" fill="#FFB3A7" />
      {/* Head */}
      <circle cx="50" cy="36" r="20" fill={fill} />
      {/* White face mask */}
      <path d="M34 36 q 8 16 16 16 q 8 0 16 -16 q -8 -8 -16 -8 q -8 0 -16 8 z" fill="#FFFBF4" />
      {/* Striking blue eyes */}
      <circle cx="44" cy="34" r="2.8" fill="#6B98D6" />
      <circle cx="56" cy="34" r="2.8" fill="#6B98D6" />
      <circle cx="44" cy="34" r="1.4" fill="#2A1B3D" />
      <circle cx="56" cy="34" r="1.4" fill="#2A1B3D" />
      <circle cx="44.5" cy="33.5" r="0.6" fill="white" />
      <circle cx="56.5" cy="33.5" r="0.6" fill="white" />
      {/* Nose */}
      <ellipse cx="50" cy="44" rx="2" ry="1.5" fill="#2A1B3D" />
      <path d="M47 48 q 3 2 6 0" stroke="#2A1B3D" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="84" rx="22" ry="22" fill={fill} />
      <ellipse cx="50" cy="86" rx="13" ry="14" fill="#FFFBF4" opacity="0.7" />
      {/* Arms */}
      <ellipse cx="28" cy="78" rx="6" ry="11" fill={fill} transform="rotate(-15 28 78)" />
      <ellipse cx="72" cy="78" rx="6" ry="11" fill={fill} transform="rotate(15 72 78)" />
      {/* Legs */}
      <ellipse cx="40" cy="116" rx="8" ry="7" fill={fill} />
      <ellipse cx="60" cy="116" rx="8" ry="7" fill={fill} />
      {/* Curled fluffy tail */}
      <path d="M75 86 q 12 -2 12 -16 q -2 8 -8 12 q 0 -3 -2 -3" fill={fill} stroke={fill} strokeWidth="2" />
    </g>
  ),

  poodle: (fill) => (
    <g>
      {/* Fluffy crown */}
      <circle cx="40" cy="18" r="8" fill={fill} />
      <circle cx="50" cy="14" r="9" fill={fill} />
      <circle cx="60" cy="18" r="8" fill={fill} />
      {/* Fluffy ears */}
      <circle cx="28" cy="36" r="9" fill={fill} />
      <circle cx="72" cy="36" r="9" fill={fill} />
      {/* Head */}
      <circle cx="50" cy="36" r="20" fill={fill} />
      {/* Eyes */}
      <circle cx="44" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="56" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="33.5" r="0.7" fill="white" />
      <circle cx="56.5" cy="33.5" r="0.7" fill="white" />
      {/* Nose + smile */}
      <ellipse cx="50" cy="42" rx="1.8" ry="1.3" fill="#2A1B3D" />
      <path d="M47 46 q 3 2 6 0" stroke="#2A1B3D" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Red bow on top */}
      <path d="M44 12 L50 14 L44 16 Z" fill="#FF6B5B" />
      <path d="M56 12 L50 14 L56 16 Z" fill="#FF6B5B" />
      <circle cx="50" cy="14" r="1.5" fill="#FF6B5B" />
      {/* Fluffy puffball body */}
      <circle cx="50" cy="84" r="24" fill={fill} />
      {/* Body texture (small puffs) */}
      <circle cx="35" cy="76" r="6" fill={fill} />
      <circle cx="65" cy="76" r="6" fill={fill} />
      <circle cx="32" cy="92" r="5" fill={fill} />
      <circle cx="68" cy="92" r="5" fill={fill} />
      {/* Slim legs */}
      <rect x="38" y="104" width="6" height="20" rx="2" fill={fill} />
      <rect x="56" y="104" width="6" height="20" rx="2" fill={fill} />
      {/* Fluffy feet */}
      <circle cx="41" cy="126" r="5" fill={fill} />
      <circle cx="59" cy="126" r="5" fill={fill} />
      {/* Pom-pom tail */}
      <circle cx="78" cy="78" r="6" fill={fill} />
    </g>
  ),

  hamster: (fill) => (
    <g>
      {/* Tiny ears */}
      <circle cx="34" cy="22" r="6" fill={fill} />
      <circle cx="66" cy="22" r="6" fill={fill} />
      <circle cx="34" cy="22" r="3" fill="#FFB3A7" />
      <circle cx="66" cy="22" r="3" fill="#FFB3A7" />
      {/* Round chubby head */}
      <ellipse cx="50" cy="36" rx="22" ry="18" fill={fill} />
      {/* Cheek pouches puffing out */}
      <ellipse cx="32" cy="40" rx="7" ry="6" fill={fill} />
      <ellipse cx="68" cy="40" rx="7" ry="6" fill={fill} />
      <ellipse cx="32" cy="40" rx="4" ry="3" fill="#FFFBF4" opacity="0.6" />
      <ellipse cx="68" cy="40" rx="4" ry="3" fill="#FFFBF4" opacity="0.6" />
      {/* Eyes */}
      <circle cx="44" cy="32" r="2.2" fill="#2A1B3D" />
      <circle cx="56" cy="32" r="2.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="31.5" r="0.7" fill="white" />
      <circle cx="56.5" cy="31.5" r="0.7" fill="white" />
      {/* Tiny pink nose */}
      <ellipse cx="50" cy="40" rx="1.2" ry="0.9" fill="#FF6B5B" />
      <path d="M48 43 q 2 2 4 0" stroke="#2A1B3D" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Round chubby body */}
      <ellipse cx="50" cy="86" rx="26" ry="22" fill={fill} />
      <ellipse cx="50" cy="90" rx="16" ry="14" fill="#FFFBF4" opacity="0.6" />
      {/* Tiny paws (short arms) */}
      <ellipse cx="30" cy="80" rx="4" ry="6" fill={fill} />
      <ellipse cx="70" cy="80" rx="4" ry="6" fill={fill} />
      <ellipse cx="30" cy="84" rx="3" ry="2" fill="#FFB3A7" />
      <ellipse cx="70" cy="84" rx="3" ry="2" fill="#FFB3A7" />
      {/* Tiny back legs */}
      <ellipse cx="38" cy="115" rx="7" ry="6" fill={fill} />
      <ellipse cx="62" cy="115" rx="7" ry="6" fill={fill} />
    </g>
  ),

  koala: (fill) => (
    <g>
      {/* Big fluffy ears */}
      <circle cx="26" cy="26" r="11" fill={fill} />
      <circle cx="74" cy="26" r="11" fill={fill} />
      <circle cx="26" cy="27" r="7" fill="#FFB3A7" />
      <circle cx="74" cy="27" r="7" fill="#FFB3A7" />
      <circle cx="24" cy="25" r="4" fill="#A0A0A0" opacity="0.5" />
      <circle cx="76" cy="25" r="4" fill="#A0A0A0" opacity="0.5" />
      {/* Head */}
      <circle cx="50" cy="36" r="20" fill={fill} />
      {/* Eyes */}
      <circle cx="44" cy="34" r="2.5" fill="#2A1B3D" />
      <circle cx="56" cy="34" r="2.5" fill="#2A1B3D" />
      <circle cx="44.5" cy="33.5" r="0.8" fill="white" />
      <circle cx="56.5" cy="33.5" r="0.8" fill="white" />
      {/* Big black nose */}
      <ellipse cx="50" cy="42" rx="5" ry="4" fill="#2A1B3D" />
      <ellipse cx="48" cy="40" rx="1.2" ry="0.8" fill="white" opacity="0.5" />
      {/* Mouth */}
      <path d="M44 50 Q50 53 56 50" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="86" rx="24" ry="24" fill={fill} />
      <ellipse cx="50" cy="90" rx="14" ry="14" fill="#FFFBF4" opacity="0.5" />
      {/* Arms (hugging position) */}
      <ellipse cx="26" cy="82" rx="7" ry="13" fill={fill} transform="rotate(-25 26 82)" />
      <ellipse cx="74" cy="82" rx="7" ry="13" fill={fill} transform="rotate(25 74 82)" />
      {/* Stubby legs */}
      <ellipse cx="40" cy="118" rx="9" ry="8" fill={fill} />
      <ellipse cx="60" cy="118" rx="9" ry="8" fill={fill} />
    </g>
  ),

  lion: (fill) => (
    <g>
      {/* Big mane (puffy circles around the head) */}
      <circle cx="22" cy="36" r="9" fill="#D4A574" />
      <circle cx="78" cy="36" r="9" fill="#D4A574" />
      <circle cx="50" cy="14" r="9" fill="#D4A574" />
      <circle cx="28" cy="20" r="9" fill="#D4A574" />
      <circle cx="72" cy="20" r="9" fill="#D4A574" />
      <circle cx="22" cy="50" r="9" fill="#D4A574" />
      <circle cx="78" cy="50" r="9" fill="#D4A574" />
      <circle cx="35" cy="58" r="8" fill="#D4A574" />
      <circle cx="65" cy="58" r="8" fill="#D4A574" />
      {/* Ears */}
      <circle cx="36" cy="22" r="5" fill={fill} />
      <circle cx="64" cy="22" r="5" fill={fill} />
      <circle cx="36" cy="22" r="2.5" fill="#FF6B5B" />
      <circle cx="64" cy="22" r="2.5" fill="#FF6B5B" />
      {/* Head */}
      <circle cx="50" cy="36" r="18" fill={fill} />
      {/* Lighter snout */}
      <ellipse cx="50" cy="44" rx="9" ry="7" fill="#FFFBF4" />
      {/* Eyes */}
      <circle cx="44" cy="33" r="2.2" fill="#2A1B3D" />
      <circle cx="56" cy="33" r="2.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="32.5" r="0.7" fill="white" />
      <circle cx="56.5" cy="32.5" r="0.7" fill="white" />
      {/* Heart-shaped lion nose */}
      <path d="M48 41 L50 42 L52 41 L51 44 L49 44 Z" fill="#2A1B3D" />
      <path d="M46 48 q 4 3 8 0" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="86" rx="22" ry="22" fill={fill} />
      <ellipse cx="50" cy="88" rx="13" ry="14" fill="#FFFBF4" opacity="0.6" />
      {/* Arms */}
      <ellipse cx="28" cy="80" rx="6" ry="11" fill={fill} transform="rotate(-15 28 80)" />
      <ellipse cx="72" cy="80" rx="6" ry="11" fill={fill} transform="rotate(15 72 80)" />
      {/* Legs */}
      <ellipse cx="40" cy="116" rx="8" ry="7" fill={fill} />
      <ellipse cx="60" cy="116" rx="8" ry="7" fill={fill} />
      {/* Tail with tuft */}
      <path d="M72 92 q 12 4 16 14" stroke={fill} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="89" cy="108" r="4" fill="#D4A574" />
    </g>
  ),

  tiger: (fill) => (
    <g>
      {/* Ears */}
      <circle cx="34" cy="20" r="6" fill={fill} />
      <circle cx="66" cy="20" r="6" fill={fill} />
      <circle cx="34" cy="20" r="3" fill="#FFB3A7" />
      <circle cx="66" cy="20" r="3" fill="#FFB3A7" />
      {/* Head */}
      <circle cx="50" cy="36" r="20" fill={fill} />
      {/* Tiger stripes on face */}
      <path d="M30 32 q 3 4 0 8" stroke="#2A1B3D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M70 32 q -3 4 0 8" stroke="#2A1B3D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M44 18 l 1 6" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M50 17 l 0 7" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M56 18 l -1 6" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Snout (lighter) */}
      <ellipse cx="50" cy="44" rx="9" ry="7" fill="#FFFBF4" />
      {/* Green eyes */}
      <ellipse cx="44" cy="33" rx="2.5" ry="3" fill="#5FB85F" />
      <ellipse cx="56" cy="33" rx="2.5" ry="3" fill="#5FB85F" />
      <ellipse cx="44" cy="33" rx="0.8" ry="2" fill="#2A1B3D" />
      <ellipse cx="56" cy="33" rx="0.8" ry="2" fill="#2A1B3D" />
      {/* Nose */}
      <path d="M48 41 L50 42 L52 41 L51 44 L49 44 Z" fill="#2A1B3D" />
      <path d="M46 48 q 4 3 8 0" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="50" cy="86" rx="22" ry="22" fill={fill} />
      <ellipse cx="50" cy="88" rx="13" ry="14" fill="#FFFBF4" opacity="0.6" />
      {/* Body stripes */}
      <path d="M28 78 q 3 4 0 8 M28 92 q 3 4 0 8" stroke="#2A1B3D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M72 78 q -3 4 0 8 M72 92 q -3 4 0 8" stroke="#2A1B3D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M50 70 l -2 6 m 4 0 l -2 -6" stroke="#2A1B3D" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Arms */}
      <ellipse cx="28" cy="80" rx="6" ry="11" fill={fill} transform="rotate(-15 28 80)" />
      <ellipse cx="72" cy="80" rx="6" ry="11" fill={fill} transform="rotate(15 72 80)" />
      {/* Legs */}
      <ellipse cx="40" cy="116" rx="8" ry="7" fill={fill} />
      <ellipse cx="60" cy="116" rx="8" ry="7" fill={fill} />
      {/* Striped tail */}
      <path d="M72 92 q 12 4 16 14" stroke={fill} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M82 100 l -3 3 M86 106 l -3 3" stroke="#2A1B3D" strokeWidth="1.5" />
    </g>
  ),

  zebra: (fill) => (
    <g>
      {/* Ears */}
      <ellipse cx="36" cy="20" rx="4" ry="7" fill={fill} />
      <ellipse cx="64" cy="20" rx="4" ry="7" fill={fill} />
      <ellipse cx="36" cy="21" rx="2" ry="4" fill="#FFB3A7" />
      <ellipse cx="64" cy="21" rx="2" ry="4" fill="#FFB3A7" />
      {/* Head (slightly elongated) */}
      <ellipse cx="50" cy="38" rx="20" ry="22" fill={fill} />
      {/* Black stripes on head */}
      <path d="M30 32 q 4 4 0 8" stroke="#2A1B3D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M70 32 q -4 4 0 8" stroke="#2A1B3D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M44 18 l 0 6 M50 17 l 0 7 M56 18 l 0 6" stroke="#2A1B3D" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Mane (black tufts) */}
      <path d="M44 14 l 2 -6 M50 12 l 0 -6 M56 14 l -2 -6" stroke="#2A1B3D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Snout */}
      <ellipse cx="50" cy="50" rx="11" ry="7" fill="#FFFBF4" />
      {/* Eyes */}
      <circle cx="42" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="58" cy="34" r="2.2" fill="#2A1B3D" />
      <circle cx="42.5" cy="33.5" r="0.7" fill="white" />
      <circle cx="58.5" cy="33.5" r="0.7" fill="white" />
      {/* Nostrils */}
      <ellipse cx="46" cy="50" rx="1.2" ry="0.8" fill="#2A1B3D" />
      <ellipse cx="54" cy="50" rx="1.2" ry="0.8" fill="#2A1B3D" />
      {/* Body */}
      <ellipse cx="50" cy="84" rx="22" ry="20" fill={fill} />
      {/* Body stripes */}
      <path d="M30 78 q 4 4 0 8" stroke="#2A1B3D" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M70 78 q -4 4 0 8" stroke="#2A1B3D" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M30 92 q 4 4 0 8" stroke="#2A1B3D" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M70 92 q -4 4 0 8" stroke="#2A1B3D" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 65 l -2 6 m 4 0 l -2 -6" stroke="#2A1B3D" strokeWidth="2.5" fill="none" />
      {/* Slim zebra legs */}
      <rect x="38" y="100" width="5" height="28" rx="2" fill={fill} />
      <rect x="57" y="100" width="5" height="28" rx="2" fill={fill} />
      <ellipse cx="40.5" cy="130" rx="4" ry="2" fill="#2A1B3D" />
      <ellipse cx="59.5" cy="130" rx="4" ry="2" fill="#2A1B3D" />
      {/* Striped tail */}
      <path d="M70 86 q 8 0 10 8" stroke={fill} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="96" r="3" fill="#2A1B3D" />
    </g>
  ),

  giraffe: (fill) => (
    <g>
      {/* Ossicones (horns) */}
      <ellipse cx="44" cy="14" rx="2" ry="5" fill={fill} />
      <ellipse cx="56" cy="14" rx="2" ry="5" fill={fill} />
      <circle cx="44" cy="10" r="2.5" fill="#A87248" />
      <circle cx="56" cy="10" r="2.5" fill="#A87248" />
      {/* Ears */}
      <ellipse cx="32" cy="22" rx="5" ry="3" fill={fill} transform="rotate(-30 32 22)" />
      <ellipse cx="68" cy="22" rx="5" ry="3" fill={fill} transform="rotate(30 68 22)" />
      {/* Long head */}
      <ellipse cx="50" cy="36" rx="16" ry="20" fill={fill} />
      {/* Spots on head */}
      <ellipse cx="40" cy="32" rx="3" ry="2.5" fill="#A87248" />
      <ellipse cx="60" cy="32" rx="3" ry="2.5" fill="#A87248" />
      <ellipse cx="50" cy="46" rx="2.5" ry="2" fill="#A87248" />
      {/* Eyes */}
      <circle cx="44" cy="32" r="2.2" fill="#2A1B3D" />
      <circle cx="56" cy="32" r="2.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="31.5" r="0.7" fill="white" />
      <circle cx="56.5" cy="31.5" r="0.7" fill="white" />
      {/* Eyelashes */}
      <path d="M42 30 l -2 -2 M44 29 l 0 -2 M46 30 l 2 -2" stroke="#2A1B3D" strokeWidth="0.8" fill="none" />
      <path d="M58 30 l 2 -2 M56 29 l 0 -2 M54 30 l -2 -2" stroke="#2A1B3D" strokeWidth="0.8" fill="none" />
      {/* Smile */}
      <path d="M46 50 q 4 3 8 0" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Long neck */}
      <rect x="43" y="55" width="14" height="22" fill={fill} />
      {/* Spots on neck */}
      <ellipse cx="46" cy="62" rx="2" ry="1.5" fill="#A87248" />
      <ellipse cx="54" cy="68" rx="2" ry="1.5" fill="#A87248" />
      {/* Body */}
      <ellipse cx="50" cy="92" rx="20" ry="16" fill={fill} />
      {/* Body spots */}
      <ellipse cx="38" cy="88" rx="3" ry="2.5" fill="#A87248" />
      <ellipse cx="62" cy="88" rx="3" ry="2.5" fill="#A87248" />
      <ellipse cx="50" cy="98" rx="3" ry="2.5" fill="#A87248" />
      {/* Slim legs */}
      <rect x="36" y="105" width="5" height="22" rx="2" fill={fill} />
      <rect x="59" y="105" width="5" height="22" rx="2" fill={fill} />
      <ellipse cx="38.5" cy="130" rx="4" ry="2" fill="#2A1B3D" />
      <ellipse cx="61.5" cy="130" rx="4" ry="2" fill="#2A1B3D" />
    </g>
  ),

  butterfly: (fill) => (
    <g>
      {/* Body (long thin) */}
      <ellipse cx="50" cy="65" rx="3" ry="35" fill="#2A1B3D" />
      {/* Top wings */}
      <ellipse cx="28" cy="50" rx="22" ry="18" fill={fill} transform="rotate(-15 28 50)" />
      <ellipse cx="72" cy="50" rx="22" ry="18" fill={fill} transform="rotate(15 72 50)" />
      {/* Bottom wings */}
      <ellipse cx="32" cy="82" rx="16" ry="14" fill={fill} transform="rotate(20 32 82)" />
      <ellipse cx="68" cy="82" rx="16" ry="14" fill={fill} transform="rotate(-20 68 82)" />
      {/* Wing patterns - circles */}
      <circle cx="22" cy="50" r="4" fill="#FFD166" />
      <circle cx="78" cy="50" r="4" fill="#FFD166" />
      <circle cx="32" cy="82" r="3" fill="#FFFBF4" />
      <circle cx="68" cy="82" r="3" fill="#FFFBF4" />
      <circle cx="14" cy="48" r="2" fill="#FFFBF4" />
      <circle cx="86" cy="48" r="2" fill="#FFFBF4" />
      {/* Head */}
      <circle cx="50" cy="34" r="10" fill="#2A1B3D" />
      {/* Eyes (white dots on head) */}
      <circle cx="46" cy="32" r="1.5" fill="white" />
      <circle cx="54" cy="32" r="1.5" fill="white" />
      {/* Smile */}
      <path d="M46 38 q 4 3 8 0" stroke="white" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Antennae */}
      <path d="M45 26 q -4 -10 -8 -16" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M55 26 q 4 -10 8 -16" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="37" cy="10" r="2" fill="#2A1B3D" />
      <circle cx="63" cy="10" r="2" fill="#2A1B3D" />
      {/* Tiny "legs" on body */}
      <path d="M50 100 l -3 8 M50 100 l 3 8" stroke="#2A1B3D" strokeWidth="1" />
    </g>
  ),

  bee: (fill) => (
    <g>
      {/* Translucent wings */}
      <ellipse cx="28" cy="50" rx="14" ry="20" fill="#B8D4F5" opacity="0.6" transform="rotate(-15 28 50)" />
      <ellipse cx="72" cy="50" rx="14" ry="20" fill="#B8D4F5" opacity="0.6" transform="rotate(15 72 50)" />
      {/* Head */}
      <circle cx="50" cy="34" r="18" fill={fill} />
      {/* Eyes */}
      <circle cx="44" cy="32" r="2.5" fill="#2A1B3D" />
      <circle cx="56" cy="32" r="2.5" fill="#2A1B3D" />
      <circle cx="44.5" cy="31.5" r="0.8" fill="white" />
      <circle cx="56.5" cy="31.5" r="0.8" fill="white" />
      {/* Cheeks */}
      <circle cx="36" cy="38" r="2.5" fill="#FF6B5B" opacity="0.5" />
      <circle cx="64" cy="38" r="2.5" fill="#FF6B5B" opacity="0.5" />
      {/* Smile */}
      <path d="M46 40 q 4 3 8 0" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Antennae */}
      <path d="M44 20 q -2 -10 -6 -14" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M56 20 q 2 -10 6 -14" stroke="#2A1B3D" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="6" r="2.5" fill="#2A1B3D" />
      <circle cx="62" cy="6" r="2.5" fill="#2A1B3D" />
      {/* Striped body */}
      <ellipse cx="50" cy="86" rx="20" ry="26" fill={fill} />
      {/* Black stripes */}
      <ellipse cx="50" cy="74" rx="18" ry="3" fill="#2A1B3D" />
      <ellipse cx="50" cy="86" rx="18" ry="3" fill="#2A1B3D" />
      <ellipse cx="50" cy="98" rx="16" ry="3" fill="#2A1B3D" />
      {/* Tiny legs */}
      <ellipse cx="38" cy="115" rx="6" ry="6" fill="#2A1B3D" />
      <ellipse cx="62" cy="115" rx="6" ry="6" fill="#2A1B3D" />
      {/* Stinger */}
      <path d="M50 112 l 0 8" stroke="#2A1B3D" strokeWidth="2" fill="none" />
    </g>
  ),

  mermaid: (fill) => (
    <g>
      {/* Hair (long red) */}
      <ellipse cx="50" cy="22" rx="22" ry="14" fill="#FF6B5B" />
      <ellipse cx="32" cy="36" rx="6" ry="20" fill="#FF6B5B" />
      <ellipse cx="68" cy="36" rx="6" ry="20" fill="#FF6B5B" />
      {/* Hair flowing down sides */}
      <ellipse cx="28" cy="60" rx="5" ry="18" fill="#FF6B5B" />
      <ellipse cx="72" cy="60" rx="5" ry="18" fill="#FF6B5B" />
      {/* Face */}
      <circle cx="50" cy="36" r="18" fill={fill} />
      {/* Bangs */}
      <path d="M34 28 q 8 -4 16 0 q 8 -4 16 0 l 0 6 l -32 0 z" fill="#FF6B5B" />
      {/* Eyes (green) */}
      <circle cx="44" cy="36" r="2.5" fill="#5FB85F" />
      <circle cx="56" cy="36" r="2.5" fill="#5FB85F" />
      <circle cx="44" cy="36" r="1.2" fill="#2A1B3D" />
      <circle cx="56" cy="36" r="1.2" fill="#2A1B3D" />
      <circle cx="44.5" cy="35.5" r="0.6" fill="white" />
      <circle cx="56.5" cy="35.5" r="0.6" fill="white" />
      {/* Eyelashes */}
      <path d="M42 33 l -2 -2 M46 32 l 0 -2" stroke="#2A1B3D" strokeWidth="0.8" />
      <path d="M58 33 l 2 -2 M54 32 l 0 -2" stroke="#2A1B3D" strokeWidth="0.8" />
      {/* Cheeks */}
      <circle cx="40" cy="42" r="2.5" fill="#FF6B5B" opacity="0.5" />
      <circle cx="60" cy="42" r="2.5" fill="#FF6B5B" opacity="0.5" />
      {/* Smile */}
      <path d="M46 44 q 4 3 8 0" stroke="#2A1B3D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Shell hair clip */}
      <circle cx="34" cy="24" r="3" fill="#FFD166" />
      <path d="M32 24 L34 20 L36 24 L34 28 Z" fill="#FFB3A7" />
      {/* Torso (with seashell bra) */}
      <ellipse cx="50" cy="68" rx="14" ry="10" fill={fill} />
      {/* Seashell top */}
      <ellipse cx="44" cy="68" rx="5" ry="6" fill="#D67FBA" />
      <ellipse cx="56" cy="68" rx="5" ry="6" fill="#D67FBA" />
      <path d="M44 64 L44 72 M44 64 L42 72 M44 64 L46 72" stroke="#FFB3A7" strokeWidth="0.6" />
      <path d="M56 64 L56 72 M56 64 L54 72 M56 64 L58 72" stroke="#FFB3A7" strokeWidth="0.6" />
      {/* Arms */}
      <ellipse cx="32" cy="70" rx="5" ry="11" fill={fill} transform="rotate(-15 32 70)" />
      <ellipse cx="68" cy="70" rx="5" ry="11" fill={fill} transform="rotate(15 68 70)" />
      {/* Mermaid tail (green) */}
      <path d="M40 78 q 10 6 20 0 q 4 20 -2 38 q -8 4 -16 0 q -6 -18 -2 -38 z" fill="#5FB85F" />
      <path d="M42 100 q 8 4 16 0" stroke="#3D8B3D" strokeWidth="1" fill="none" />
      <path d="M44 110 q 6 4 12 0" stroke="#3D8B3D" strokeWidth="1" fill="none" />
      {/* Tail fin (fan-shaped) */}
      <path d="M30 116 q 10 -8 20 0 q 10 -8 20 0 q -8 14 -20 14 q -12 0 -20 -14 z" fill="#5FB85F" />
      <path d="M30 116 L34 130 M40 118 L42 130 M50 119 L50 132 M60 118 L58 130 M70 116 L66 130" stroke="#3D8B3D" strokeWidth="1" fill="none" />
    </g>
  ),
};

const FILLS: Record<CompanionKey, string> = {
  bunny: '#FFF4E0', kitty: '#E8A5D1', fox: '#FF8E80', owl: '#B8D4F5',
  panda: '#FFFBF4', bear: '#D4A574', unicorn: '#FFF4E0', dragon: '#8BCE8B',
  monkey: '#A0826D', sloth: '#D4A574', octopus: '#D67FBA', deer: '#D4A574',
  frog: '#8BCE8B', penguin: '#2A1B3D', hedgehog: '#D4A574', turtle: '#5FB85F',
  // v13 additions
  dog: '#F5DEB3', husky: '#E8E8E8', poodle: '#FFFBF4', hamster: '#D4A574',
  koala: '#A0A0A0', lion: '#FFD166', tiger: '#FF9500', zebra: '#FFFBF4',
  giraffe: '#FFD166', butterfly: '#D67FBA', bee: '#FFD166', mermaid: '#FFE0BD',
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
      style={{ width: size, height: size * 1.4, display: 'inline-block' }}
    >
      <svg viewBox="0 0 100 140" width={size} height={size * 1.4}>
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
  // v13 additions
  { key: 'dog', name: 'Buddy' },
  { key: 'husky', name: 'Storm' },
  { key: 'poodle', name: 'Pearl' },
  { key: 'hamster', name: 'Nibbles' },
  { key: 'koala', name: 'Eucalyptus' },
  { key: 'lion', name: 'Roar' },
  { key: 'tiger', name: 'Stripes' },
  { key: 'zebra', name: 'Dash' },
  { key: 'giraffe', name: 'Tally' },
  { key: 'butterfly', name: 'Flutter' },
  { key: 'bee', name: 'Buzz' },
  { key: 'mermaid', name: 'Coral' },
];
