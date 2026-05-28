// Regras de runtime dos bosses do Space Invaders.
// As constantes daqui controlam cadência, quantidade e posicionamento de ataques
// especiais que mudam durante a partida, principalmente o boss invocador.

import type { Invader } from "../spaceInvadersTypes";

export type BossAttackType =
  | "triple"
  | "focus"
  | "rain"
  | "wide"
  | "cross"
  | "sweep"
  | "burstRain"
  | "spiral"
  | "pinch"
  | "meteor"
  | "lattice"
  | "omegaBurst"
  | "quasarLaser"
  | "quasarComet"
  | "forgeGate"
  | "forgeCannon"
  | "forgeShield"
  | "summonerSwarm"
  | "summonerGuard"
  | "summonerHealers"
  | "summonerNeedles"
  | "omegaLaser"
  | "omegaHalo"
  | "omegaSummon";

export type BossSummonRole = NonNullable<Invader["summonRole"]>;

export const FORGE_SHIELD_MAX_HITS = 15;
export const FORGE_SHIELD_COOLDOWN_MS = 15000;
export const FORGE_SHIELD_BURST_SIZE = 3;
export const FORGE_SHIELD_BURST_INTERVAL_MS = 260;
export const FORGE_SHIELD_BURST_REST_MS = 860;

export const OMEGA_SUMMON_COOLDOWN_MS = 5000;
export const OMEGA_SUMMON_COUNT = 4;
export const OMEGA_MAX_SUMMONS = 12;

export const SUMMONER_ATTACKER_COUNT = 5;
export const SUMMONER_MAX_ATTACKERS = 12;
export const SUMMONER_GUARDIAN_COUNT = 6;
export const SUMMONER_MAX_GUARDIANS = 6;
export const SUMMONER_MAX_HEALERS = 2;
export const SUMMONER_SUMMON_COOLDOWN_MS = 5200;
export const SUMMONER_ATTACKER_COOLDOWN_MS = 10500;
export const SUMMONER_GUARDIAN_COOLDOWN_MS = 17000;
export const SUMMONER_HEALER_COOLDOWN_MS = 19000;
export const SUMMONER_MAX_ACTIVE_ROLE_TYPES = 2;
export const SUMMONER_HEALER_HEALTH_THRESHOLD = 0.52;

// Formação do Regente do Enxame: guardiões nas laterais e curadores afastados.
export const SUMMONER_GUARDIAN_SIDE_OFFSET_X = 144;
export const SUMMONER_GUARDIAN_ROW_SPACING = 36;
export const SUMMONER_GUARDIAN_START_Y_OFFSET = 34;
export const SUMMONER_HEALER_SIDE_OFFSET_X = 190;
export const SUMMONER_HEALER_Y_OFFSET = 128;
export const SUMMONER_ATTACKER_FALL_SPEED = 0.16;
export const SUMMONER_ATTACKER_DRIFT_SPEED = 0.28;
