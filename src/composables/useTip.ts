// src/composables/useTip.ts
import { computed, type Ref } from "vue";
import type { BoardState, Pos } from "./BoardState";
import { MOVE_OFFSETS, type MoveVariant } from "./moveOffsets";

export function useTip(
  board: Ref<BoardState>,
  moveVariant: Ref<MoveVariant>
) {
  const idx = (r: number, c: number) => r * board.value.size + c;

  function validMovesFrom(pos: Pos): Pos[] {
    const b = board.value;
    const v = moveVariant.value;

    return MOVE_OFFSETS[v]
      .map(o => ({ r: pos.r + o.r, c: pos.c + o.c }))
      .filter(p =>
        p.r >= 0 &&
        p.c >= 0 &&
        p.r < b.size &&
        p.c < b.size &&
        b.cells[idx(p.r, p.c)] === 0
      );
  }

  function degree(to: Pos): number {
    // on simule "to occupé" sur une copie
    const b = board.value;
    const copy = b.cells.slice();
    copy[idx(to.r, to.c)] = -1;

    // compter les moves depuis to, en lisant copy
    const v = moveVariant.value;
    return MOVE_OFFSETS[v]
      .map(o => ({ r: to.r + o.r, c: to.c + o.c }))
      .filter(p =>
        p.r >= 0 &&
        p.c >= 0 &&
        p.r < b.size &&
        p.c < b.size &&
        copy[idx(p.r, p.c)] === 0
      ).length;
  }

  const bestTipMove = computed<Pos | null>(() => {
    const b = board.value;
    if (!b.current) return null;

    const moves = validMovesFrom(b.current);
    if (moves.length === 0) return null;

    let best = moves[0];
    let bestDeg = degree(best);

    for (const m of moves.slice(1)) {
      const d = degree(m);
      if (d < bestDeg) {
        bestDeg = d;
        best = m;
      }
    }
    return best;
  });

  return { bestTipMove };
}