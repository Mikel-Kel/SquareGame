// src/composables/useSolveRunner.ts
import type { Ref } from "vue";
import type { Pos } from "./useBoard";

/**
 * useSolveRunner
 * - Orchestration UI du solver (async, delay, états)
 * - Aucun calcul algorithmique
 */
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

    // Copie de travail STRICTE (on ne modifie rien)
    const copy = board.value.slice();

    // Étape suivante à poser
    const startStep = path.value.length + 1;

    const result = solveFrom(copy, currentPos.value, startStep);

    if (!result) {
      noSolution.value = true;
      isSolving.value = false;
      return;
    }

    // Animation progressive
    for (const p of result) {
      await sleep(stepDelayMs.value);

      board.value[idx(p.r, p.c)] = path.value.length + 1;
      path.value.push(p);
      currentPos.value = p;
    }

    isSolving.value = false;
  }

  return {
    runSolution
  };
}