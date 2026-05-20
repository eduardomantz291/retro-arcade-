export type GameId = "snake" | "breakout";

export type PlayerProgress = {
  level: number;
  xp: number;
  totalXp: number;
};

export type XpRewardResult = {
  before: PlayerProgress;
  after: PlayerProgress;
  gainedXp: number;
  leveledUp: boolean;
  levelsGained: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
};

const PLAYER_PROGRESS_KEY = "arcadePlayerProgress";
const XP_AWARD_RESULTS_KEY = "arcadeXpAwardResults";

const BASE_LEVEL_XP = 120;
const LEVEL_GROWTH = 1.55;

export function getXpNeededForLevel(level: number) {
  return Math.floor(BASE_LEVEL_XP * Math.pow(level, LEVEL_GROWTH));
}

export function getDefaultProgress(): PlayerProgress {
  return {
    level: 1,
    xp: 0,
    totalXp: 0,
  };
}

export function getPlayerProgress(): PlayerProgress {
  const storedProgress = localStorage.getItem(PLAYER_PROGRESS_KEY);

  if (!storedProgress) {
    return getDefaultProgress();
  }

  try {
    const parsedProgress = JSON.parse(storedProgress) as PlayerProgress;

    return {
      level: parsedProgress.level || 1,
      xp: parsedProgress.xp || 0,
      totalXp: parsedProgress.totalXp || 0,
    };
  } catch {
    return getDefaultProgress();
  }
}

export function savePlayerProgress(progress: PlayerProgress) {
  localStorage.setItem(PLAYER_PROGRESS_KEY, JSON.stringify(progress));
}

function getAwardResults() {
  const storedResults = localStorage.getItem(XP_AWARD_RESULTS_KEY);

  if (!storedResults) {
    return {};
  }

  try {
    return JSON.parse(storedResults) as Record<string, XpRewardResult>;
  } catch {
    return {};
  }
}

function saveAwardResults(results: Record<string, XpRewardResult>) {
  const entries = Object.entries(results).slice(-40);
  const trimmedResults = Object.fromEntries(entries);

  localStorage.setItem(XP_AWARD_RESULTS_KEY, JSON.stringify(trimmedResults));
}

function getStoredAwardResult(awardId: string) {
  const results = getAwardResults();

  return results[awardId] || null;
}

function saveAwardResult(awardId: string, result: XpRewardResult) {
  const results = getAwardResults();

  results[awardId] = result;

  saveAwardResults(results);
}

export function calculateBreakoutXp(score: number, elapsedSeconds: number) {
  const scoreXp = Math.floor(score * 0.06);
  const survivalXp = Math.floor(elapsedSeconds * 1.2);
  const bonusXp =
    score >= 2500 ? 80 : score >= 1500 ? 45 : score >= 700 ? 20 : 0;

  return Math.max(15, scoreXp + survivalXp + bonusXp);
}

export function calculateSnakeXp(score: number) {
  const scoreXp = Math.floor(score * 0.18);
  const bonusXp = score >= 1200 ? 90 : score >= 700 ? 50 : score >= 350 ? 25 : 0;

  return Math.max(12, scoreXp + bonusXp);
}

export function calculateGameXp(
  gameId: GameId,
  data: {
    score: number;
    elapsedSeconds?: number;
  }
) {
  if (gameId === "breakout") {
    return calculateBreakoutXp(data.score, data.elapsedSeconds || 0);
  }

  return calculateSnakeXp(data.score);
}

export function addPlayerXp(gainedXp: number): XpRewardResult {
  const before = getPlayerProgress();

  let nextProgress: PlayerProgress = {
    level: before.level,
    xp: before.xp + gainedXp,
    totalXp: before.totalXp + gainedXp,
  };

  let levelsGained = 0;

  while (nextProgress.xp >= getXpNeededForLevel(nextProgress.level)) {
    nextProgress.xp -= getXpNeededForLevel(nextProgress.level);
    nextProgress.level += 1;
    levelsGained += 1;
  }

  savePlayerProgress(nextProgress);

  const nextLevelXp = getXpNeededForLevel(nextProgress.level);

  return {
    before,
    after: nextProgress,
    gainedXp,
    leveledUp: levelsGained > 0,
    levelsGained,
    currentLevelXp: nextProgress.xp,
    nextLevelXp,
    progressPercent: Math.min(100, (nextProgress.xp / nextLevelXp) * 100),
  };
}

export function awardGameXp(params: {
  gameId: GameId;
  score: number;
  elapsedSeconds?: number;
  awardId: string;
}) {
  const storedResult = getStoredAwardResult(params.awardId);

  if (storedResult) {
    return storedResult;
  }

  const gainedXp = calculateGameXp(params.gameId, {
    score: params.score,
    elapsedSeconds: params.elapsedSeconds,
  });

  const result = addPlayerXp(gainedXp);

  saveAwardResult(params.awardId, result);

  return result;
}