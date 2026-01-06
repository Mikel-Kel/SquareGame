// src/composables/useBoard.ts
import { ref, computed } from "vue";
import type { BoardState, Pos } from "./BoardState";

export function useBoard(size: number) {
  const state = ref<BoardState>({
    size,
    cells: Array(size * size).fill(0),
    path: [],
    current: null,
  });

  const idx = (r: number, c: number) => r * size + c;

  function play(r: number, c: number) {
    const k = idx(r, c);
    if (state.value.cells[k] !== 0) return;

    const step = state.value.path.length + 1;
    state.value.cells[k] = step;

    const pos: Pos = { r, c };
    state.value.path.push(pos);
    state.value.current = pos;
  }

  function undo() {
    const last = state.value.path.pop();
    if (!last) return;

    state.value.cells[idx(last.r, last.c)] = 0;
    state.value.current =
      state.value.path[state.value.path.length - 1] ?? null;
  }

  function reset() {
    state.value.cells = Array(size * size).fill(0);
    state.value.path = [];
    state.value.current = null;
  }

  /* =======================
     Read-only helpers
  ======================= */
  const cells = computed(() => state.value.cells);
  const path = computed(() => state.value.path);
  const currentPos = computed(() => state.value.current);

  return {
    // source de vérité
    state,

    // helpers sûrs (réactifs)
    cells,
    path,
    currentPos,

    // actions
    idx,
    play,
    undo,
    reset,
  };
}