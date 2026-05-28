// Helpers puros do Breakout.
// Funcoes daqui nao dependem de React nem do canvas, entao ficam separadas do hook.

import type { Brick } from "../breakoutTypes";

export function formatSurvivalTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export function formatUltimateTime(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const seconds = Math.ceil(safeMilliseconds / 1000);

  return `${seconds}s`;
}

export function getBrickCenter(brick: Brick) {
  return {
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height / 2,
  };
}
