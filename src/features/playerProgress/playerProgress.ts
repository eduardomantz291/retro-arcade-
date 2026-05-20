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
const XP_AWARD_HISTORY_KEY = "arcadeXpAwardHistory";

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

function getAwardHistory() {
  const storedHistory = localStorage.getItem(XP_AWARD_HISTORY_KEY);

  if (!storedHistory) {
    return [];
  }

  try {
    return JSON.parse(storedHistory) as string[];
  } catch {
    return [];
  }
}

function saveAwardHistory(history: string[]) {
  localStorage.setItem(XP_AWARD_HISTORY_KEY, JSON.stringify(history.slice(-40)));
}

export function wasXpAlreadyAwarded(awardId: string) {
  const history = getAwardHistory();

  return history.includes(awardId);
}

export function markXpAsAwarded(awardId: string) {
  const history = getAwardHistory();

  if (history.includes(awardId)) {
    return;
  }

  saveAwardHistory([...history, awardId]);
}

export function calculateBreakoutXp(score: number, elapsedSeconds: number) {
  const scoreXp = Math.floor(score * 0.06);
  const survivalXp = Math.floor(elapsedSeconds * 1.2);
  const bonusXp = score >= 2500 ? 80 : score >= 1500 ? 45 : score >= 700 ? 20 : 0;

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
  if (wasXpAlreadyAwarded(params.awardId)) {
    const currentProgress = getPlayerProgress();
    const nextLevelXp = getXpNeededForLevel(currentProgress.level);

    return {
      before: currentProgress,
      after: currentProgress,
      gainedXp: 0,
      leveledUp: false,
      levelsGained: 0,
      currentLevelXp: currentProgress.xp,
      nextLevelXp,
      progressPercent: Math.min(100, (currentProgress.xp / nextLevelXp) * 100),
    };
  }

  const gainedXp = calculateGameXp(params.gameId, {
    score: params.score,
    elapsedSeconds: params.elapsedSeconds,
  });

  markXpAsAwarded(params.awardId);

  return addPlayerXp(gainedXp);
}