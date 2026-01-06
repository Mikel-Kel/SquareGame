import { ref, watch, computed, type Ref } from "vue";
import type { Pos } from "./useBoard";
import type { MoveVariant } from "./moveOffsets";

export function useGameState(params: {
  board: Ref<number[]>;
  path: Ref<Pos[]>;
  currentPos: Ref<Pos | null>;
  idx: (r: number, c: number) => number;

  // board actions
  play: (r: number, c: number) => void;
  undo: () => void;
  reset: () => void;

  // moves
  isValidTarget: (r: number, c: number) => boolean;
  validMoves: Ref<Pos[]>;

  // solver
  runSolution: () => Promise<void> | void;

  // config
  moveVariant: Ref<MoveVariant>;
}) {
  const {
    board,
    path,
    currentPos,
    idx,
    play,
    undo,
    reset,
    isValidTarget,
    validMoves,
    runSolution,
    moveVariant,
  } = params;

  /* =======================
     UI state
  ======================= */
  const showTip = ref(false);
  const showValidMoves = ref(true);
  const showSettings = ref(false);
  const showInfo = ref(false);
  const showStartMessage = ref(true);

  /* =======================
     Dead end detection
  ======================= */
  const deadEnd = computed(() => {
    if (!currentPos.value) return false;
    if (path.value.length === board.value.length) return false;
    return validMoves.value.length === 0;
  });

  /* =======================
     Helpers
  ======================= */
  function hideStartMessageAfterDelay() {
    setTimeout(() => {
      showStartMessage.value = false;
    }, 2000);
  }

  hideStartMessageAfterDelay();

  /* =======================
     Actions
  ======================= */
  function onPlay(r: number, c: number) {
    if (board.value[idx(r, c)] !== 0) return;
    if (!isValidTarget(r, c)) return;

    play(r, c);

    showTip.value = false;
    showStartMessage.value = false;
  }

  watch(moveVariant, () => {
    reset();
    showTip.value = false;
    showStartMessage.value = true;
    hideStartMessageAfterDelay();
  });

  return {
    // UI
    showTip,
    showValidMoves,
    showSettings,
    showInfo,
    showStartMessage,

    // game state
    deadEnd,

    // actions
    onPlay,
    runSolution,
    undo,
    reset,
  };
}