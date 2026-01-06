// src/types/BoardState.ts

export type Pos = {
  r: number;
  c: number;
};

export type BoardState = {
  size: number;
  cells: number[];      // grille aplatie N*N
  path: Pos[];          // historique des coups
  current: Pos | null;  // position courante
};