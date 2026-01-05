import { ref } from "vue";

/* =======================
   Types
======================= */
export type Cell = number;
export type Pos = { r: number; c: number };

/* =======================
   Board composable
======================= */
export function useBoard(N: number) {
  const board = ref<Cell[]>(Array(N * N).fill(0));
  const path = ref<Pos[]>([]);
  const currentPos = ref<Pos | null>(null);

  function idx(r: number, c: number): number {
    return r * N + c;
  }

  function play(r: number, c: number): void {
    board.value[idx(r, c)] = path.value.length + 1;
    const pos: Pos = { r, c };
    path.value.push(pos);
    currentPos.value = pos;
  }

  function undo(): void {
    if (path.value.length === 0) return;

    const last = path.value.pop()!;
    board.value[idx(last.r, last.c)] = 0;

    currentPos.value =
      path.value.length > 0
        ? path.value[path.value.length - 1]!
        : null;
  }

  function reset(): void {
    board.value = Array(N * N).fill(0);
    path.value = [];
    currentPos.value = null;
  }

  return {
    board,
    path,
    currentPos,
    idx,
    play,
    undo,
    reset,
  };
}