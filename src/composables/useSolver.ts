// src/composables/useSolver.ts
import type { Pos } from "@/composables/BoardState";
import { MOVE_OFFSETS, type MoveVariant } from "@/composables/moveOffsets";

export function solveBoard(
  board: { size: number; cells: number[] },
  start: Pos,
  variant: MoveVariant
): Pos[] | null {

  const N = board.size;
  const idx = (r: number, c: number) => r * N + c;

  function inside(r: number, c: number) {
    return r >= 0 && c >= 0 && r < N && c < N;
  }

  function validMoves(pos: Pos): Pos[] {
    return MOVE_OFFSETS[variant]
      .map(o => ({ r: pos.r + o.r, c: pos.c + o.c }))
      .filter(p =>
        inside(p.r, p.c) &&
        board.cells[idx(p.r, p.c)] === 0
      );
  }

  /** 🔑 WARNDORFF DEGREE */
  function degree(pos: Pos): number {
    const k = idx(pos.r, pos.c);
    board.cells[k] = -1;                 // marquage temporaire
    const d = validMoves(pos).length;
    board.cells[k] = 0;                  // restauration
    return d;
  }

  function dfs(pos: Pos, step: number): Pos[] | null {
    if (step > N * N) return [];

    const moves = validMoves(pos)
      .map(m => ({ m, d: degree(m) }))
      .sort((a, b) => a.d - b.d)          // 🔥 Warnsdorff
      .map(x => x.m);

    for (const m of moves) {
      const k = idx(m.r, m.c);
      board.cells[k] = step;

      const rest = dfs(m, step + 1);
      if (rest) return [m, ...rest];

      board.cells[k] = 0;                 // backtrack
    }

    return null;
  }

  const startStep =
    board.cells.filter(v => v > 0).length + 1;

  return dfs(start, startStep);
}