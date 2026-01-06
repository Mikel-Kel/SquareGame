// src/composables/useMoves.ts
import { computed, type Ref } from "vue";
import type { BoardState, Pos } from "./BoardState";
import { MOVE_OFFSETS, type MoveVariant } from "./moveOffsets";

export function useMoves(
  board: Ref<BoardState>,
  moveVariant: Ref<MoveVariant>
) {
  const idx = (r: number, c: number) => r * board.value.size + c;

  const validMoves = computed<Pos[]>(() => {
    const b = board.value;
    const v = moveVariant.value;
    if (!b.current) return [];

    return MOVE_OFFSETS[v]
      .map(o => ({ r: b.current!.r + o.r, c: b.current!.c + o.c }))
      .filter(p =>
        p.r >= 0 &&
        p.c >= 0 &&
        p.r < b.size &&
        p.c < b.size &&
        b.cells[idx(p.r, p.c)] === 0
      );
  });

  const deadEnd = computed(() => {
    const b = board.value;
    return !!b.current && validMoves.value.length === 0 && b.cells.some(x => x === 0);
  });

  function isValidTarget(r: number, c: number) {
    const b = board.value;
    if (!b.current) return true;
    return validMoves.value.some(p => p.r === r && p.c === c);
  }

  return { validMoves, isValidTarget, deadEnd };
}