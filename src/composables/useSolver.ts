// src/composables/useSolver.ts
import type { Ref } from "vue";
import type { Pos } from "./useBoard";
import type { MoveVariant } from "./moveOffsets";
import { validMovesFromBoard } from "./useMoves";

/**
 * useSolver — version robuste et stable
 *
 * Supporte DEUX APIs :
 *
 * 1) API moderne (recommandée)
 *    useSolver(boardRef, N, moveVariantRef)
 *
 * 2) API legacy (tolérée)
 *    useSolver(getBoard, idx, N, getCurrentPos, getMoveVariant)
 *
 * ➜ Le solver reste PUR : aucun état Vue interne
 * ➜ Protection forte contre moveVariant undefined
 * ➜ Instrumentation prête (stats)
 */

type SolverContext = {
  N: number;
  idx: (r: number, c: number) => number;
  getMoveVariant: () => MoveVariant;
};

export function useSolver(...args: any[]) {
  /* =====================================================
     Normalisation des paramètres
  ===================================================== */
  let ctx: SolverContext;

  if (args.length === 3) {
    // --- API moderne ---
    const _boardRef = args[0] as Ref<number[]>;
    const N = args[1] as number;
    const mv = args[2] as Ref<MoveVariant> | MoveVariant | undefined;

    ctx = {
      N,
      idx: (r, c) => r * N + c,
      getMoveVariant: () => {
        const v = (mv as any)?.value ?? mv;
        if (v !== "knight" && v !== "square") {
          throw new Error(
            `useSolver: moveVariant invalide ou undefined (${String(v)})`
          );
        }
        return v;
      }
    };

    void _boardRef; // volontairement inutilisé (solver pur)

  } else if (args.length === 5) {
    // --- API legacy ---
    const idx = args[1] as (r: number, c: number) => number;
    const N = args[2] as number;
    const getMoveVariant = args[4] as () => MoveVariant;

    ctx = {
      N,
      idx,
      getMoveVariant
    };

  } else {
    throw new Error(
      `useSolver: nombre d'arguments invalide (${args.length}). Attendu 3 ou 5.`
    );
  }

  /* =====================================================
     Instrumentation (désactivée par défaut côté UI)
  ===================================================== */
  let nodesVisited = 0;
  let maxDepth = 0;

  function resetStats() {
    nodesVisited = 0;
    maxDepth = 0;
  }

  function getStats() {
    return {
      nodesVisited,
      maxDepth
    };
  }

  /* =====================================================
     Heuristique de Warnsdorff (degree)
  ===================================================== */
  function degree(boardArr: number[], to: Pos): number {
    const k = ctx.idx(to.r, to.c);

    boardArr[k] = -1; // marquage temporaire
    const d = validMovesFromBoard(
      boardArr,
      ctx.N,
      to,
      ctx.getMoveVariant()
    ).length;
    boardArr[k] = 0; // restauration

    return d;
  }

  /* =====================================================
     Solver récursif (Warnsdorff + backtracking)
  ===================================================== */
  function solveFrom(
    boardArr: number[],
    pos: Pos,
    step: number
  ): Pos[] | null {
    nodesVisited++;
    maxDepth = Math.max(maxDepth, step);

    if (step > ctx.N * ctx.N) {
      return [];
    }

    const moves = validMovesFromBoard(
      boardArr,
      ctx.N,
      pos,
      ctx.getMoveVariant()
    )
      .map(p => ({ p, d: degree(boardArr, p) }))
      .sort((a, b) => a.d - b.d)
      .map(x => x.p);

    for (const m of moves) {
      const k = ctx.idx(m.r, m.c);
      boardArr[k] = step;

      const rest = solveFrom(boardArr, m, step + 1);
      if (rest) {
        return [m, ...rest];
      }

      boardArr[k] = 0; // backtrack
    }

    return null;
  }

  /* =====================================================
     API exposée
  ===================================================== */
  return {
    solveFrom,
    resetStats,
    getStats
  };
}