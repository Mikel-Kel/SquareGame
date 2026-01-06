<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import AppIcon from "@/components/AppIcon.vue";

import { useBoard } from "@/composables/useBoard";
import { useMoves } from "@/composables/useMoves";
import { solveBoard } from "@/composables/useSolver";
import { useTip } from "@/composables/useTip";
import type { MoveVariant } from "@/composables/moveOffsets";

/* =======================
   Configuration
======================= */
const N = 10;

/* =======================
   Board — SOURCE DE VÉRITÉ
======================= */
const {
  state,       // Ref<BoardState>
  idx,
  play,
  undo,
  reset,
} = useBoard(N);

/* =======================
   UI state (local)
======================= */
const showTip = ref(false);
const showValidMoves = ref(true);
const showSettings = ref(false);
const showInfo = ref(false);
const showStartMessage = ref(true);

/* =======================
   Solver / config
======================= */
const moveVariant = ref<MoveVariant>("square");
const stepDelayMs = ref(50);
const isSolving = ref(false);
const noSolution = ref(false);

/* =======================
   Fade-in / fade-out message
======================= */
onMounted(() => {
  setTimeout(() => {
    showStartMessage.value = false;
  }, 2000);
});

/* =======================
   Moves (réactif)
======================= */
const { validMoves, isValidTarget, deadEnd } = useMoves(
  state,
  moveVariant
);

/* =======================
   Tip (Warnsdorff local — VISUEL UNIQUEMENT)
======================= */
const { bestTipMove } = useTip(
  state,
  moveVariant
);

/* =======================
   Actions utilisateur
======================= */
function onPlay(r: number, c: number) {
  const k = idx(r, c);
  if (state.value.cells[k] !== 0) return;
  if (!isValidTarget(r, c)) return;

  play(r, c);

  showTip.value = false;
  showStartMessage.value = false;
  noSolution.value = false;
}

function onUndo() {
  undo();
  noSolution.value = false;
}

function onReset() {
  reset();
  noSolution.value = false;
  showStartMessage.value = true;
}

/* =======================
   Solver (isolé, board copié)
======================= */
async function runSolution() {
  if (!state.value.current || isSolving.value) return;

  isSolving.value = true;
  noSolution.value = false;

  const boardCopy = {
    size: state.value.size,
    cells: state.value.cells.slice(),
  };

  const result = solveBoard(
    boardCopy,
    state.value.current,
    moveVariant.value
  );

  if (!result) {
    noSolution.value = true;
    isSolving.value = false;
    return;
  }

  for (const p of result) {
    await new Promise(r => setTimeout(r, stepDelayMs.value));
    play(p.r, p.c);
  }

  isSolving.value = false;
}

/* =======================
   Helpers pour le template
======================= */
const cells = computed(() => {
  const out: { r: number; c: number; i: number }[] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      out.push({ r, c, i: idx(r, c) });
  return out;
});

const board = computed(() => state.value.cells);
const path = computed(() => state.value.path);
const currentPos = computed(() => state.value.current);
</script>

/*========================
   Template
========================*/
<template>
<main class="page">

<header class="titlebar">
  <div class="title-center">
    <h1>Square Game</h1>
    <div class="subtitle">by Michel Vuilleumier</div>
  </div>

  <div class="title-icons">
    <button @click="showInfo = true">
      <AppIcon name="info" :size="26" />
    </button>
    <button @click="showSettings = true">
      <AppIcon name="tool" :size="26" />
    </button>
  </div>
</header>

<div class="toolbar">
  <button @click="onUndo" :disabled="!path.length">
    <AppIcon name="back" :size="32" />
  </button>

  <button @click="showTip = true" :disabled="!currentPos">
    <AppIcon name="lightbulb" :size="32" />
  </button>

  <button @click="onReset">
    <AppIcon name="refresh" :size="32" />
  </button>
</div>

<div class="board-wrap">
  <section class="board" :style="{ gridTemplateColumns: `repeat(${N}, 1fr)` }">

    <transition name="fade">
      <div v-if="showStartMessage" class="start-msg">
        Start with any cell !
      </div>
    </transition>

    <transition name="fade">
      <div v-if="deadEnd" class="dead-end-msg">
        Dead end — no valid moves 😕
      </div>
    </transition>

    <transition name="fade">
      <div v-if="noSolution" class="no-solution-msg">
        No solution possible from here 😕
      </div>
    </transition>

    <button
      v-for="cell in cells"
      :key="cell.i"
      class="cell"
      :class="{
        current: currentPos?.r === cell.r && currentPos?.c === cell.c,
        tip:
          showTip &&
          bestTipMove &&
          bestTipMove.r === cell.r &&
          bestTipMove.c === cell.c,
        valid:
          showValidMoves &&
          isValidTarget(cell.r, cell.c) &&
          board[cell.i] === 0
      }"
      @click="onPlay(cell.r, cell.c)"
    >
      <span class="cell-value">
        {{ board[cell.i] || '' }}
      </span>
    </button>
  </section>
</div>

<button
  class="solve-btn"
  @click="runSolution"
  :disabled="!currentPos || isSolving || noSolution"
>
  <AppIcon name="help" :size="36" />
</button>

<!-- SETTINGS / INFO -->
<div
  v-if="showSettings"
  class="modal"
  @click.self="showSettings = false"
>
  <!-- Close button -->
  <button class="modal-close" @click="showSettings = false">✕</button>
  <div class="modal-content">
    <button class="modal-close" @click="showSettings = false">✕</button>

    <h3>Settings</h3>

    <label>
      Variant
      <select v-model="moveVariant">
        <option value="knight">Knight</option>
        <option value="square">Square</option>
      </select>
    </label>

    <label>
      Speed {{ stepDelayMs }} ms
      <input
        type="range"
        min="50"
        max="2000"
        step="50"
        v-model="stepDelayMs"
      />
    </label>

    <label class="checkbox">
      <input type="checkbox" v-model="showValidMoves" />
      Show valid moves
    </label>
  </div>
</div>

<!-- INFO -->
<div
  v-if="showInfo"
  class="modal"
  @click.self="showInfo = false"
>
  <div class="modal-content">
    <!-- Close button -->
    <button class="modal-close" @click="showInfo = false">✕</button>

    <h3>Rules</h3>

    <p>
      Visit every cell exactly once.
    </p>

    <p>
      Moves depend on the selected variant:
    </p>

    <ul>
      <li><strong>Knight</strong> – chess knight moves</li>
      <li><strong>Square</strong> – jump over two cells horizontally, vertically, or diagonally</li>
    </ul>

    <p style="opacity:0.7; margin-top:12px">
      Tip and solver are based on Warnsdorff heuristics.
    </p>
  </div>
</div>
</main>
</template>

/*========================
   Styles
========================*/
<style scoped>
  .page {
  max-width: 980px;
  margin: auto;
  padding: 12px;
}

/* HEADER */
.titlebar {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  z-index: 20;
}

.title-center {
  text-align: center;
}

.title-center h1 {
  margin: 0;
  line-height: 1.1;
}

.subtitle {
  margin-top: 2px;
  font-size: 14px;
  opacity: 0.6;
}

.title-icons {
  position: absolute;
  right: 0;
  top: 4px;
  display: flex;
  gap: 4px;
}

.title-icons button {
  padding: 2px;
}

/* TOOLBAR */
.toolbar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 12px 0;
}

button {
  background: none;
  border: none;
  color: #1e3a8a;
  cursor: pointer;
}

button:disabled {
  color: #9ca3af;
  cursor: default;
}

/* BOARD */
.board-wrap {
  width: min(92vmin, 820px);
  margin: auto;
  position: relative;
  z-index: 1
}

.board {
  position: relative;
  display: grid;
  gap: 8px;
  aspect-ratio: 1;
  align-items: stretch;
  justify-items: stretch;
  z-index: 1;
}

.cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
  padding: 0;
  overflow: hidden;
}

.cell-value {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.cell.current {
  box-shadow: inset 0 0 0 3px #2563eb;
}

.cell.tip {
  background: #c6f6d5;
  box-shadow: inset 0 0 0 3px #2f855a;
}

.cell.valid {
  background: #e8f3ff;
}

/* START MESSAGE */
.start-msg {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 42px;
  font-weight: 600;
  color: #2563eb;
  background: rgba(255,255,255,0.85); /* optionnel mais recommandé */
  z-index: 10;
  pointer-events: none;
}

.dead-end-msg {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 600;
  color: #991b1b;              /* rouge sombre */
  background: rgba(255,255,255,0.85);
  z-index: 9;
  pointer-events: none;        /* ne bloque pas undo/reset */
}

.no-solution-msg {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 26px;
  font-weight: 600;
  color: #7c2d12;              /* brun/rouge doux */
  background: rgba(255,255,255,0.82);
  z-index: 9;
  pointer-events: none;        /* ⬅️ CRUCIAL */
}

/* FADE */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* SOLVER BUTTON */
.solve-btn {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 56px;
  height: 56px;
}

/* MODALS */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background: white;
  padding: 20px;
  border-radius: 14px;
  min-width: 280px;
  max-width: 90vw;
  box-shadow: 0 20px 40px rgba(0,0,0,0.25);
}

.checkbox {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>