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
  state,
  idx,
  play,
  undo,
  reset,
} = useBoard(N);

/* =======================
   UI state
======================= */
const showTip = ref(false);
const showValidMoves = ref(true);
const showSettings = ref(false);
const showInfo = ref(false);

/* =======================
   Solver / config
======================= */
const moveVariant = ref<MoveVariant>("square");
const stepDelayMs = ref(50);
const isSolving = ref(false);
const noSolution = ref(false);

/* =======================
   Start message (ONE-SHOT)
======================= */
const startMessageId = ref(0);

function triggerStartMessage() {
  startMessageId.value++;
}

onMounted(() => {
  triggerStartMessage();
});

/* =======================
   Moves
======================= */
const { isValidTarget, deadEnd } = useMoves(
  state,
  moveVariant
);

/* =======================
   Tip (Warnsdorff local)
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
  noSolution.value = false;
}

function onUndo() {
  undo();
  noSolution.value = false;
}

function onReset() {
  reset();
  noSolution.value = false;
  triggerStartMessage();
}

/* =======================
   Solver
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
   Template helpers
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

  <button
    @click="runSolution"
    :disabled="!currentPos || isSolving || noSolution"
    title="Solve the board"
  >
    <AppIcon name="help" :size="32" />
  </button>

  <button @click="onReset">
    <AppIcon name="refresh" :size="32" />
  </button>
</div>

<div class="board-wrap">
  <section class="board" :style="{ gridTemplateColumns: `repeat(${N}, 1fr)` }">

    <!-- START MESSAGE -->
    <div
      v-if="startMessageId"
      :key="startMessageId"
      class="start-msg fade-msg"
    >
      Start with any cell !
    </div>

    <div v-if="deadEnd" class="dead-end-msg">
      Dead end — no valid moves 😕
    </div>

    <div v-if="noSolution" class="no-solution-msg">
      No solution possible from here 😕
    </div>

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

<!-- SETTINGS -->
<div v-if="showSettings" class="modal" @click.self="showSettings = false">
  <div class="modal-content">
    <button
      class="modal-close"
      @click="showSettings = false"
      aria-label="Close settings"
    >
      <AppIcon name="close" :size="18" />
    </button>

    <h3>Game Settings</h3>
    <div class="section-sep"></div>

    <h4>🔀 Movement style</h4>
    <p>
      Choose how the piece moves on the board.
    </p>

    <label>
      <select v-model="moveVariant">
        <option value="knight">Knight – chess move</option>
        <option value="square">Square – jump over cells</option>
      </select>
    </label>

    <p style="font-size:0.85em; opacity:0.7;">
      Changing this resets the board.
    </p>
    <div class="section-sep"></div>

    <h4 style="margin-top:16px;">⏱️ Solver speed</h4>
    <p>
      Controls how fast the solution is animated.
    </p>

    <input
      type="range"
      min="50"
      max="2000"
      step="50"
      v-model="stepDelayMs"
    />
    <p style="font-size:0.85em; opacity:0.7;">
      Slow → easier to follow · Fast → instant result
    </p>
    <div class="section-sep"></div>

    <h4 style="margin-top:16px;">✨ Visual help</h4>
      <div class="settings-center">
        <label class="checkbox">
          <input type="checkbox" v-model="showValidMoves" />
          Show valid moves
        </label>
      </div>

      <hr style="margin:16px 0; opacity:0.3;">

    <p style="font-size:0.85em; opacity:0.7;">
      You can reset the board at any time using the refresh button.
    </p>
  </div>
</div>

<!-- INFO -->
<div v-if="showInfo" class="modal" @click.self="showInfo = false">
  <div class="modal-content">
    <button
      class="modal-close"
      @click="showInfo = false"
      aria-label="Close info"
    >
      <AppIcon name="close" :size="18" />
    </button>

    <h3>Square Game</h3>
    <p style="opacity:0.7; margin-top:-6px;">
      Simple rules. Tricky paths.
    </p>
    <div class="section-sep"></div>

    <h4>🎯 Goal</h4>
    <p>
      Visit <strong>every cell exactly once</strong>.
    </p>
    <p>
      You can start on <strong>any cell</strong>, but each move must follow
      the selected movement rule.
    </p>
    <div class="section-sep"></div>

    <h4>🧠 Movement rules</h4>

    <p><strong>Knight</strong><br>
      Same moves as a chess knight.<br>
      Jump in an “L” shape.
    </p>

    <p><strong>Square</strong><br>
      Jump over two cells.<br>
      Horizontally, vertically, or diagonally.
    </p>
    <div class="section-sep"></div>

    <h4>💡 Need help?</h4>
    <div class="info-help">
      <div class="info-help-row">
        <span class="info-help-icon">
          <AppIcon name="lightbulb" :size="20" />
        </span>
        <span>
          <strong>Tip</strong> highlights a good next move.
        </span>
      </div>

      <div class="info-help-row">
        <span class="info-help-icon">
          <AppIcon name="help" :size="20" />
        </span>
        <span>
          <strong>Solve</strong> lets the game try to finish the board for you.
        </span>
      </div>
    </div>

    <p style="opacity:0.75;">
      Some positions have <strong>no possible solution</strong> —
      that’s part of the challenge 😉
    </p>

    <hr style="margin:16px 0; opacity:0.3;">

    <p style="font-size:0.9em; opacity:0.75;">
      Created by <strong>Antonio Macchia & Michel Vuilleumier</strong><br>
      First release in 1986 on IBM PC with a Pascal/DOS compiler !
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

.section-sep {
  height: 1px;
  margin: 16px 0;
  background: linear-gradient(
    to right,
    transparent,
    rgba(0,0,0,0.15),
    transparent
  );
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
  background: rgba(255,255,255,0.85);
  z-index: 10;
  pointer-events: none;
}

.fade-msg {
  animation: fadeInOut 2s ease forwards;
}

@keyframes fadeInOut {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { opacity: 0; }
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

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 32px;
  height: 32px;

  border-radius: 50%;
  background: rgba(37, 99, 235, 0.12); /* bleu léger */

  color: #2563eb;          /* NOIR lisible */
  opacity: 1;

  z-index: 10;

  transition: background 0.2s ease;
}

.modal-close:hover {
  background: rgba(37, 99, 235, 0.22);
  transform: scale(1.05);
}
.modal-close:active {
  background: rgba(0,0,0,0.12);
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

.settings-center {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.checkbox {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.95em;
}

.info-help {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px auto;
  width: fit-content;
}

.info-help-row {
  display: flex;
  align-items: center;     /* ✅ centre verticalement icône + texte */
  gap: 12px;

  color: #1e3a8a;
  font-size: 0.95em;
  line-height: 1.4;
}

.info-help-icon {
  width: 22px;             /* “colonne” icône stable */
  height: 22px;
  flex: 0 0 22px;

  display: flex;
  align-items: center;     /* ✅ centre le SVG dans sa boîte */
  justify-content: center;
}

</style>