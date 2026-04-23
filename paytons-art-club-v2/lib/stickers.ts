// ============================================================
// Preset sticker library
// Broad categories of emoji stickers for free-draw and remix.
// ============================================================

export interface StickerCategory {
  id: string;
  label: string;
  icon: string;
  stickers: string[];
}

export const STICKER_LIBRARY: StickerCategory[] = [
  {
    id: 'animals',
    label: 'Animals',
    icon: '🐰',
    stickers: [
      '🐰', '🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐯',
      '🐸', '🐢', '🦉', '🦋', '🐝', '🐞', '🐟', '🐬',
      '🦄', '🐲', '🦖', '🦕', '🦒', '🐘', '🦘', '🦩',
    ],
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌸',
    stickers: [
      '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌿', '🍀',
      '🌳', '🌲', '🌴', '🌵', '🍄', '🌾', '🍁', '🍂',
      '☀️', '🌙', '⭐', '✨', '☁️', '🌈', '❄️', '⚡',
    ],
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍰',
    stickers: [
      '🍰', '🧁', '🍪', '🍩', '🍭', '🍬', '🍫', '🍦',
      '🍎', '🍊', '🍌', '🍓', '🍉', '🍇', '🥕', '🌽',
      '🍕', '🍔', '🌮', '🥐', '🥞', '🥧', '🍯', '🥛',
    ],
  },
  {
    id: 'fantasy',
    label: 'Magic',
    icon: '✨',
    stickers: [
      '✨', '⭐', '🌟', '💫', '⚡', '🔮', '👑', '💎',
      '🎩', '🎀', '🎁', '🧸', '🪄', '🧚', '🧜‍♀️', '🧞',
      '💖', '💕', '💗', '💞', '💝', '🌟', '🎨', '🖌️',
    ],
  },
  {
    id: 'space',
    label: 'Space',
    icon: '🚀',
    stickers: [
      '🚀', '🛸', '🌍', '🌎', '🌏', '🌕', '🌖', '🌗',
      '🌘', '🌑', '🌒', '🌓', '🌔', '☄️', '🪐', '🌠',
      '👽', '👾', '🌌', '🛰️', '🔭', '🌟', '✨', '💫',
    ],
  },
  {
    id: 'faces',
    label: 'Faces',
    icon: '😊',
    stickers: [
      '😊', '😄', '😁', '😆', '🥰', '😍', '🤩', '😎',
      '🤗', '🤔', '😋', '😜', '🤪', '🙃', '😇', '🥳',
      '😴', '🤤', '😌', '😏', '🥺', '😭', '😂', '🤣',
    ],
  },
];

export function getAllStickers(): string[] {
  return STICKER_LIBRARY.flatMap((c) => c.stickers);
}
