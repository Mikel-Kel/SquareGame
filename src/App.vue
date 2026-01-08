<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import AppIcon from "@/components/AppIcon.vue";

import { useBoard } from "@/composables/useBoard";
import { useMoves } from "@/composables/useMoves";
import { solveBoard } from "@/composables/useSolver";
import { useTip } from "@/composables/useTip";
import type { MoveVariant } from "@/composables/moveOffsets";

const finishedBySolver = ref(false)
const appVersion = __APP_VERSION__
const buildDate = __BUILD_DATE__

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
  finishedBySolver.value = false
}

function onUndo() {
  undo();
  noSolution.value = false;
  finishedBySolver.value = false
}

function onReset() {
  reset();
  noSolution.value = false;
  finishedBySolver.value = false
  triggerStartMessage();
}

/* =======================
   Solver
======================= */
async function runSolution() {
  if (!state.value.current || isSolving.value) return;

  isSolving.value = true;
  noSolution.value = false;

  finishedBySolver.value = true;

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

const isCompleted = computed(() => {
  return state.value.path.length === N * N
})

const showVictory = computed(() => {
  return isCompleted.value && !finishedBySolver.value
})
</script>

/*========================
   Template
========================*/
<template>
<main class="page">
<header class="titlebar">

  <div class="title-center">

    <!-- LOGO + TITRE SUR UNE LIGNE -->
    <div class="title-main">
      <div class="title-logo">
        <AppIcon name="square" :size="48" />
      </div>
      <h1>Puzzle</h1>
    </div>

    <div class="subtitle">
      v{{ appVersion }} · {{ buildDate }}
    </div>

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

    <!-- DEAD END & NO SOLUTION sMESSAGE -->   
    <div
      v-if="deadEnd || noSolution"
      class="board-hint"
    >
      <AppIcon
        :name="noSolution ? 'help' : 'info'"
        :size="16"
      />
      <span>
        {{ noSolution
          ? 'No solution from here'
          : 'No valid moves left'
        }}
      </span>
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
<!-- VICTORY -->
<div v-if="showVictory" class="victory-msg">
  🎉 Puzzle completed!
</div>

</main>
</template>

/*========================
   Styles
========================*/
<style scoped>
.page {
  background: var(--bg-app);
  color: var(--text-main);max-width: 980px;
  margin: auto;
  padding: 12px;
}
/* HEADER */
.titlebar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between; /* ⬅️ clé */
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
/* Titre "puzzle" — volontairement plus discret que l’icône */
.title-main h1 {
  margin: 0;
  font-size: 1.8rem;      /* ⬅️ plus petit que le h1 standard */
  font-weight: 500;       /* moins dominant */
  letter-spacing: 0.015em; /* touche élégante */
  line-height: 1.05;
}

.subtitle {
  margin-top: 2px;
  font-size: 14px;
  opacity: 0.6;
  color: var(--text-secondary);
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
/* TITLE MAIN (icon + title) */
.title-main {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 2px;
}
/* Icône du titre */
.title-logo {
  display: flex;
  align-items: center;
  justify-content: center;

  /* 🎨 couleur réelle de l’icône */
  color: var(--action-main);

  /* 🎁 effet visuel */
  background: var(--action-soft);
  border-radius: 12px;
  padding: 6px;

  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
/* sécurité */
.title-logo .icon {
  display: flex;
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
  color: var(--action-main);
  cursor: pointer;
}
button:disabled {
  color: var(--action-disabled);
  cursor: default;
}
.section-sep {
  background: linear-gradient(
    to right,
    transparent,
    var(--sep-line),
    transparent
  );
}

/* BOARD */
.board-wrap {
  width: min(90vw, 360);
  aspect-ratio: 1 ;
  margin: auto;
  position: relative;
}
@media (max-width: 480px) {
  .toolbar {
    margin: 8px 0;
    gap: 10px;
  }
  .board {
    gap: 6px;
  }
}
/* iPhone */
@media (max-width: 390px) {
  .board-wrap {
    width: calc(92vw); 
  }
}
/* iPad portrait */
@media (min-width: 480px) and (max-width: 900px) {
  .board-wrap {
    width: 70vmin;
    max-width: 520px;
  }
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg-app: #0F172A;
    --bg-panel: #020617;
    --text-main: #E5E7EB;
    /* etc. */
  }
}
.board {
  position: relative;
  display: grid;
  gap: clamp(2px, 0.8vmin, 8px); 
  max-height: 68vh;
  gap: 8px;
  width: 100%;
  height: 100%; 
  align-items: stretch;
  justify-items: stretch;
  z-index: 1;
}
.board-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);

  display: flex;
  align-items: center;
  gap: 8px;

  padding: 6px 12px;
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);

  font-size: 0.85rem;
  color: #374151; /* gris lisible */

  box-shadow: 0 4px 12px rgba(0,0,0,0.12);

  pointer-events: none;
  z-index: 8;
}
.cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: clamp(6px, 1.2vmin, 12px);
  border: 1px solid var(--cell-border);
  box-sizing: border-box;
  padding: 0;
  overflow: hidden;
  background: var(--cell-bg);
}
.cell-value {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: clamp(12px, 2.2vmin, 18px);
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}
.cell.current {
  background: var(--cell-current-bg);
  box-shadow: inset 0 0 0 3px var(--cell-current-border);
}
.cell.tip {
  background: var(--cell-tip-bg);
  box-shadow: inset 0 0 0 3px var(--cell-tip-border);
}
.cell.valid:not(.tip):not(.current) {
  background: var(--cell-valid-bg);
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.25);
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
.dead-end-msg,
.no-solution-msg {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);

  padding: 6px 12px;
  border-radius: 999px;

  font-size: 0.85em;
  font-weight: 500;
  white-space: nowrap;

  background: var(--badge-bg);
  color: var(--badge-text);

  z-index: 5;
  pointer-events: none;
}
.victory-msg {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);

  padding: 6px 14px;
  border-radius: 999px;

  font-size: 0.85em;
  font-weight: 500;
  white-space: nowrap;

  background: var(--cell-tip-bg);
  color: #065F46; /* vert profond */

  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  z-index: 6;
  pointer-events: none;
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
  background: var(--bg-overlay);
  display: grid;
  place-items: center;
  z-index: 1000;
}
.modal-close {
  position: sticky;
  top: 10px;
  right: 10px;
  margin-left: auto;

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
  color: var(--text-main);
  background: var(--bg-panel);
  padding: 20px;
  border-radius: 14px;

  width: min(92vw, 420px);
  max-height: 85vh;              /* ⬅️ clé */
  overflow-y: auto;              /* ⬅️ clé */

  box-shadow: 0 20px 40px rgba(0,0,0,0.25);

  -webkit-overflow-scrolling: touch; /* ⬅️ iOS smooth scroll */
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