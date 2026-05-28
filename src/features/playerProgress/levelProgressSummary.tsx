// Resumo animado de XP ao fim da partida.
// Mostra XP ganho, progresso da barra e efeito de level up.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  awardGameXp,
  getPlayerProgress,
  getXpNeededForLevel,
  type GameId,
  type PlayerProgress,
  type XpRewardResult,
} from "./playerProgress";
import "./level-progress-style.css";

type LevelProgressSummaryProps = {
  gameId: GameId;
  score: number;
  elapsedSeconds?: number;
  awardId: string;
};

type AnimatedProgress = {
  level: number;
  xp: number;
  nextLevelXp: number;
  percent: number;
  totalXp: number;
  gainedXp: number;
};

function createRewardResultFromProgress(progress: PlayerProgress): XpRewardResult {
  const nextLevelXp = getXpNeededForLevel(progress.level);

  return {
    before: progress,
    after: progress,
    gainedXp: 0,
    leveledUp: false,
    levelsGained: 0,
    currentLevelXp: progress.xp,
    nextLevelXp,
    progressPercent: Math.min(100, (progress.xp / nextLevelXp) * 100),
  };
}

function getProgressFromTotalXp(totalXp: number): PlayerProgress {
  let level = 1;
  let remainingXp = Math.max(0, totalXp);

  while (remainingXp >= getXpNeededForLevel(level)) {
    remainingXp -= getXpNeededForLevel(level);
    level += 1;
  }

  return {
    level,
    xp: remainingXp,
    totalXp,
  };
}

function createAnimatedProgress(
  totalXp: number,
  gainedXp: number
): AnimatedProgress {
  const progress = getProgressFromTotalXp(totalXp);
  const nextLevelXp = getXpNeededForLevel(progress.level);
  const percent = Math.min(100, (progress.xp / nextLevelXp) * 100);

  return {
    level: progress.level,
    xp: progress.xp,
    nextLevelXp,
    percent,
    totalXp,
    gainedXp,
  };
}

function LevelProgressSummary({
  gameId,
  score,
  elapsedSeconds = 0,
  awardId,
}: LevelProgressSummaryProps) {
  const animationFrameRef = useRef<number | null>(null);
  const levelUpTimeoutRef = useRef<number | null>(null);

  const initialRewardResult = useMemo(() => {
    return createRewardResultFromProgress(getPlayerProgress());
  }, []);

  const [rewardResult, setRewardResult] =
    useState<XpRewardResult>(initialRewardResult);

  const [animatedProgress, setAnimatedProgress] = useState(() => {
    return createAnimatedProgress(initialRewardResult.before.totalXp, 0);
  });

  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [levelUpAnimationKey, setLevelUpAnimationKey] = useState(0);

  useEffect(() => {
    const result = awardGameXp({
      gameId,
      score,
      elapsedSeconds,
      awardId,
    });

    setRewardResult(result);
    setAnimationFinished(false);
    setShowLevelUpAnimation(false);

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (levelUpTimeoutRef.current !== null) {
      window.clearTimeout(levelUpTimeoutRef.current);
      levelUpTimeoutRef.current = null;
    }

    const startTotalXp = result.before.totalXp;
    const endTotalXp = result.after.totalXp;
    const gainedXp = result.gainedXp;

    const animationDuration = result.leveledUp ? 2100 : 1300;
    const startedAt = performance.now();

    function triggerLevelUpAnimation() {
      setShowLevelUpAnimation(true);
      setLevelUpAnimationKey((currentKey) => currentKey + 1);

      if (levelUpTimeoutRef.current !== null) {
        window.clearTimeout(levelUpTimeoutRef.current);
      }

      levelUpTimeoutRef.current = window.setTimeout(() => {
        setShowLevelUpAnimation(false);
        levelUpTimeoutRef.current = null;
      }, 2600);
    }

    function animateProgress(now: number) {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / animationDuration);

      // Ease out deixa a barra começar rápido e terminar suave.
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentTotalXp = Math.floor(
        startTotalXp + (endTotalXp - startTotalXp) * easedProgress
      );

      const currentGainedXp = Math.floor(gainedXp * easedProgress);
      const currentAnimatedProgress = createAnimatedProgress(
        currentTotalXp,
        currentGainedXp
      );

      setAnimatedProgress(currentAnimatedProgress);

      // Agora o boom acontece exatamente quando o nível animado passa do nível antigo.
      const hasReachedNewLevel =
        result.leveledUp && currentAnimatedProgress.level > result.before.level;

      if (hasReachedNewLevel && !showLevelUpAnimation) {
        triggerLevelUpAnimation();
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateProgress);
        return;
      }

      setAnimatedProgress(createAnimatedProgress(endTotalXp, gainedXp));
      setAnimationFinished(true);

      // Segurança extra: se por algum motivo o frame exato passou batido,
      // ainda mostramos a animação ao terminar a contagem.
      if (result.leveledUp) {
        triggerLevelUpAnimation();
      }

      animationFrameRef.current = null;
    }

    animationFrameRef.current = requestAnimationFrame(animateProgress);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (levelUpTimeoutRef.current !== null) {
        window.clearTimeout(levelUpTimeoutRef.current);
        levelUpTimeoutRef.current = null;
      }
    };
  }, [awardId, elapsedSeconds, gameId, score]);

  const levelLabel = rewardResult.leveledUp
    ? `Nível ${rewardResult.before.level} → ${rewardResult.after.level}`
    : `Nível ${animatedProgress.level}`;

  return (
    <div
      className={[
        "level-summary-card",
        showLevelUpAnimation ? "level-summary-card-level-up" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showLevelUpAnimation && (
        <div
          key={levelUpAnimationKey}
          className="level-up-overlay"
          aria-hidden="true"
        >
          <div className="level-up-flash" />

          <div className="level-up-message">
            <span>⚡</span>
            <strong>LEVEL UP!</strong>
            <small>Nível {rewardResult.after.level}</small>
          </div>

          <span className="level-particle level-particle-1" />
          <span className="level-particle level-particle-2" />
          <span className="level-particle level-particle-3" />
          <span className="level-particle level-particle-4" />
          <span className="level-particle level-particle-5" />
          <span className="level-particle level-particle-6" />
          <span className="level-particle level-particle-7" />
          <span className="level-particle level-particle-8" />
          <span className="level-particle level-particle-9" />
          <span className="level-particle level-particle-10" />
          <span className="level-particle level-particle-11" />
          <span className="level-particle level-particle-12" />
        </div>
      )}

      <div className="level-summary-header">
        <div>
          <span className="level-summary-label">Progresso da conta</span>
          <strong>{levelLabel}</strong>
        </div>

        <div className="level-summary-xp">+{animatedProgress.gainedXp} XP</div>
      </div>

      <div className="level-summary-bar">
        <div
          className="level-summary-bar-fill"
          style={{ width: `${animatedProgress.percent}%` }}
        />
      </div>

      <div className="level-summary-footer">
        <span>
          {animatedProgress.xp}/{animatedProgress.nextLevelXp} XP
        </span>

        {rewardResult.leveledUp ? (
          <strong
            className={
              animationFinished
                ? "level-summary-level-up-text is-visible"
                : "level-summary-level-up-text"
            }
          >
            Subiu {rewardResult.levelsGained}{" "}
            {rewardResult.levelsGained === 1 ? "nível" : "níveis"}!
          </strong>
        ) : (
          <strong>{Math.floor(animatedProgress.percent)}%</strong>
        )}
      </div>
    </div>
  );
}

export default LevelProgressSummary;
