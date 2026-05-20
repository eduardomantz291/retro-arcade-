import { useEffect, useMemo, useState } from "react";
import {
  awardGameXp,
  getPlayerProgress,
  getXpNeededForLevel,
  type GameId,
  type XpRewardResult,
} from "./playerProgress";
import "./level-progress-style.css";

type LevelProgressSummaryProps = {
  gameId: GameId;
  score: number;
  elapsedSeconds?: number;
  awardId: string;
};

function LevelProgressSummary({
  gameId,
  score,
  elapsedSeconds = 0,
  awardId,
}: LevelProgressSummaryProps) {
  const initialProgress = useMemo(() => {
    const progress = getPlayerProgress();
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
    } satisfies XpRewardResult;
  }, []);

  const [rewardResult, setRewardResult] =
    useState<XpRewardResult>(initialProgress);

  const [animatedXp, setAnimatedXp] = useState(initialProgress.before.xp);
  const [animatedPercent, setAnimatedPercent] = useState(
    Math.min(
      100,
      (initialProgress.before.xp /
        getXpNeededForLevel(initialProgress.before.level)) *
        100
    )
  );

  useEffect(() => {
    const result = awardGameXp({
      gameId,
      score,
      elapsedSeconds,
      awardId,
    });

    setRewardResult(result);

    const animationDuration = 1300;
    const startedAt = performance.now();

    function animateXp(now: number) {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / animationDuration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const startXp = result.before.xp;
      const endXp = result.after.xp;
      const currentXp = Math.floor(startXp + (endXp - startXp) * easedProgress);

      setAnimatedXp(currentXp);
      setAnimatedPercent(Math.min(100, (currentXp / result.nextLevelXp) * 100));

      if (progress < 1) {
        requestAnimationFrame(animateXp);
      }
    }

    requestAnimationFrame(animateXp);
  }, [awardId, elapsedSeconds, gameId, score]);

  return (
    <div className="level-summary-card">
      {rewardResult.leveledUp && (
        <div className="level-up-burst">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <strong>LEVEL UP!</strong>
        </div>
      )}

      <div className="level-summary-header">
        <div>
          <span className="level-summary-label">Progresso da conta</span>
          <strong>Nível {rewardResult.after.level}</strong>
        </div>

        <div className="level-summary-xp">+{rewardResult.gainedXp} XP</div>
      </div>

      <div className="level-summary-bar">
        <div
          className="level-summary-bar-fill"
          style={{ width: `${animatedPercent}%` }}
        />
      </div>

      <div className="level-summary-footer">
        <span>
          {animatedXp}/{rewardResult.nextLevelXp} XP
        </span>

        {rewardResult.leveledUp ? (
          <strong>
            Subiu {rewardResult.levelsGained}{" "}
            {rewardResult.levelsGained === 1 ? "nível" : "níveis"}!
          </strong>
        ) : (
          <strong>{Math.floor(animatedPercent)}%</strong>
        )}
      </div>
    </div>
  );
}

export default LevelProgressSummary;