// src/composables/useTip.ts
import { computed, type Ref } from "vue";
import type { Pos } from "./useBoard";
import type { MoveVariant } from "./moveOffsets";
import { validMovesFromBoard } from "./useMoves";

/**
 * useTip — logique Warnsdorff (pure UI helper)
 */
export function useTip(
  board: Ref<number[]>,
  N: number,
  currentPos: Ref<Pos | null>,
  validMoves: Ref<Pos[]>,
  moveVariant: Ref<MoveVariant>
) {
  function idx(r: number, c: number): number {
    return r * N + c;
  }

  function degree(boardArr: number[], to: Pos): number {
    const k = idx(to.r, to.c);

    boardArr[k] = -1;
    const d = validMovesFromBoard(
      boardArr,
      N,
      to,
      moveVariant.value
    ).length;
    boardArr[k] = 0;

    return d;
  }

  const bestTipMove = computed<Pos | null>(() => {
    if (!currentPos.value) return null;

    const tmp = board.value.slice();
    let best: Pos | null = null;
    let bestDeg = Infinity;

    for (const p of validMoves.value) {
      const d = degree(tmp, p);
      if (d < bestDeg) {
        bestDeg = d;
        best = p;
      }
    }
    return best;
  });

  return {
    bestTipMove
  };
}