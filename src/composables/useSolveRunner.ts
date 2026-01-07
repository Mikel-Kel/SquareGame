// src/composables/useSolveRunner.ts
import type { Ref } from "vue";
import type { Pos } from "@/composables/BoardState";

export function useSolveRunner(
  board: Ref<number[]>,
  path: Ref<Pos[]>,
  currentPos: Ref<Pos | null>,
  idx: (r: number, c: number) => number,
  solveFrom: (boardArr: number[], pos: Pos, step: number) => Pos[] | null,
  stepDelayMs: Ref<number>,
  isSolving: Ref<boolean>,
  noSolution: Ref<boolean>
) {
  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runSolution(): Promise<void> {
    if (!currentPos.value || isSolving.value) return;

    isSolving.value = true;
    noSolution.value = false;

    try {
      // Copie de travail
      const copy = board.value.slice();

      // ✅ Cohérence: la case courante doit être "occupée"
      const cur = currentPos.value;
      copy[idx(cur.r, cur.c)] = path.value.length; // (souvent déjà vrai)

      const startStep = path.value.length + 1;

      const result = solveFrom(copy, cur, startStep);

      if (!result || result.length === 0) {
        // result.length === 0 => déjà fini (rare) ou solver a renvoyé vide
        noSolution.value = true;
        return;
      }

      for (const p of result) {
        await sleep(stepDelayMs.value);

        board.value[idx(p.r, p.c)] = path.value.length + 1;
        path.value.push(p);
        currentPos.value = p;
      }
    } finally {
      isSolving.value = false;
    }
  }

  return { runSolution };
}