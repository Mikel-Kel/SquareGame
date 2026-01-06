// src/composables/useMoves.ts
import { computed, type Ref } from "vue";
import type { Cell, Pos } from "./useBoard";
import { MOVE_OFFSETS, type MoveVariant } from "./moveOffsets";

/* =====================================================
   Pure helper (solver-safe, no refs, no Vue)
===================================================== */
export function validMovesFromBoard(
  boardArr: Cell[],
  N: number,
  pos: Pos,
  moveVariant: MoveVariant
): Pos[] {
  const idx = (r: number, c: number) => r * N + c;
  const inside = (r: number, c: number) =>
    r >= 0 && r < N && c >= 0 && c < N;

  const offsets = MOVE_OFFSETS[moveVariant];

  const res: Pos[] = [];
  for (const o of offsets) {
    const r = pos.r + o.r;
    const c = pos.c + o.c;
    if (inside(r, c) && boardArr[idx(r, c)] === 0) {
      res.push({ r, c });
    }
  }
  return res;
}

/* =====================================================
   UI composable
===================================================== */
export function useMoves(
  board: Ref<Cell[]>,
  N: number,
  currentPos: Ref<Pos | null>,
  moveVariant: Ref<MoveVariant>
) {
  const idx = (r: number, c: number) => r * N + c;

  const inside = (r: number, c: number) =>
    r >= 0 && r < N && c >= 0 && c < N;

  const offsets = computed(() => MOVE_OFFSETS[moveVariant.value]);

  function validMovesFrom(pos: Pos): Pos[] {
    const res: Pos[] = [];
    for (const o of offsets.value) {
      const r = pos.r + o.r;
      const c = pos.c + o.c;
      if (inside(r, c) && board.value[idx(r, c)] === 0) {
        res.push({ r, c });
      }
    }
    return res;
  }

  const validMoves = computed<Pos[]>(() =>
    currentPos.value ? validMovesFrom(currentPos.value) : []
  );

  /**
   * 🔥 Dead-end réel :
   * - une position existe
   * - aucun coup possible
   * - la grille n'est PAS complète
   */
  const deadEnd = computed(() =>
    !!currentPos.value &&
    validMoves.value.length === 0 &&
    board.value.some(v => v === 0)
  );

  function isValidTarget(r: number, c: number): boolean {
    if (!currentPos.value) return true;
    return validMoves.value.some(p => p.r === r && p.c === c);
  }

  return {
    validMoves,
    isValidTarget,
    deadEnd,
  };
}