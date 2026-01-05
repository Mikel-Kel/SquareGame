// src/composables/moveOffsets.ts

export type Pos = { r: number; c: number };
export type MoveVariant = "knight" | "square";

/* =======================
   Move offsets (pure TS)
======================= */
export const MOVE_OFFSETS: Record<MoveVariant, Pos[]> = {
  knight: [
    { r: -2, c: -1 }, { r: -2, c:  1 },
    { r: -1, c: -2 }, { r: -1, c:  2 },
    { r:  1, c: -2 }, { r:  1, c:  2 },
    { r:  2, c: -1 }, { r:  2, c:  1 }
  ],
  square: [
    { r: -3, c:  0 }, { r:  3, c:  0 },
    { r:  0, c: -3 }, { r:  0, c:  3 },
    { r: -2, c: -2 }, { r: -2, c:  2 },
    { r:  2, c: -2 }, { r:  2, c:  2 }
  ]
};