import { useEffect, useState } from "react";
import {
  getPlayerProgress,
  getXpNeededForLevel,
  PLAYER_PROGRESS_EVENT,
  type PlayerProgress,
} from "./playerProgress";
import "./player-level-badge-style.css";

type PlayerLevelBadgeProps = {
  compact?: boolean;
  showTitle?: boolean;
  className?: string;
};

function getProgressPercent(progress: PlayerProgress) {
  const nextLevelXp = getXpNeededForLevel(progress.level);

  return Math.min(100, (progress.xp / nextLevelXp) * 100);
}

function PlayerLevelBadge({
  compact = false,
  showTitle = true,
  className = "",
}: PlayerLevelBadgeProps) {
  const [progress, setProgress] = useState(() => getPlayerProgress());

  const nextLevelXp = getXpNeededForLevel(progress.level);
  const progressPercent = getProgressPercent(progress);

  useEffect(() => {
    function syncProgress() {
      setProgress(getPlayerProgress());
    }

    function handleProgressEvent(event: Event) {
      const customEvent = event as CustomEvent<PlayerProgress>;

      if (customEvent.detail) {
        setProgress(customEvent.detail);
        return;
      }

      syncProgress();
    }

    window.addEventListener(PLAYER_PROGRESS_EVENT, handleProgressEvent);
    window.addEventListener("storage", syncProgress);

    return () => {
      window.removeEventListener(PLAYER_PROGRESS_EVENT, handleProgressEvent);
      window.removeEventListener("storage", syncProgress);
    };
  }, []);

  return (
    <div
      className={[
        "player-level-badge",
        compact ? "player-level-badge-compact" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showTitle && (
        <div className="player-level-badge-heading">
          <span>Conta</span>
          <strong>Lv. {progress.level}</strong>
        </div>
      )}

      {!showTitle && (
        <strong className="player-level-badge-inline-level">
          Lv. {progress.level}
        </strong>
      )}

      <div className="player-level-badge-bar">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      {!compact && (
        <div className="player-level-badge-footer">
          <span>
            {progress.xp}/{nextLevelXp} XP
          </span>

          <strong>{progress.totalXp} XP total</strong>
        </div>
      )}

      {compact && (
        <small>
          {progress.xp}/{nextLevelXp} XP
        </small>
      )}
    </div>
  );
}

export default PlayerLevelBadge;