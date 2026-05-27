import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import LevelProgressSummary from "../../features/playerProgress/levelProgressSummary";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./breakoutConfig";
import { useBreakoutGame } from "./useBreakoutGame";
import "./breakout-game-style.css";

function BreakoutGamePage() {
  const { isAuthenticated, isGuest } = useAuth();

  const {
    canvasRef,
    screenState,
    score,
    lives,
    maxLives,
    elapsedSeconds,
    elapsedTimeLabel,
    bombCharges,
    isArrowAiming,
    isArrowReady,
    arrowCooldownProgress,
    isHomingActive,
    isHomingReady,
    homingCooldownProgress,
    isShieldActive,
    isShieldReady,
    shieldCooldownProgress,
    isUltimateActive,
    isUltimateReady,
    ultimateCharge,
    ultimateTimeLabel,
    startGame,
    restartGame,
    pauseGame,
    resumeGame,
    backToStartScreen,
    handlePointerMove,
    handleArrowPowerAction,
    handleHomingPowerAction,
    handleShieldPowerAction,
    handleUltimatePowerAction,
  } = useBreakoutGame();

  const [showGuestWarning, setShowGuestWarning] = useState(isGuest);
  const [guestWarningAccepted, setGuestWarningAccepted] = useState(false);

  const arrowButtonStyle = {
    "--power-charge": arrowCooldownProgress,
  } as CSSProperties;

  const homingButtonStyle = {
    "--power-charge": homingCooldownProgress,
  } as CSSProperties;

  const shieldButtonStyle = {
    "--power-charge": shieldCooldownProgress,
  } as CSSProperties;

  const ultimateButtonStyle = {
    "--power-charge": ultimateCharge / 100,
  } as CSSProperties;

  const xpAwardId = `breakout-${score}-${elapsedSeconds}-${screenState}`;
  const canStartGame = isAuthenticated || isGuest;
  const canPauseGame = screenState === "playing" || screenState === "paused";

  useEffect(() => {
    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
    }
  }, [isGuest, guestWarningAccepted]);

  useEffect(() => {
    function handlePauseShortcut(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (screenState === "playing") {
        pauseGame();
        return;
      }

      if (screenState === "paused") {
        resumeGame();
      }
    }

    window.addEventListener("keydown", handlePauseShortcut);

    return () => {
      window.removeEventListener("keydown", handlePauseShortcut);
    };
  }, [pauseGame, resumeGame, screenState]);

  function handleStartGame() {
    if (!canStartGame) {
      return;
    }

    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
      return;
    }

    startGame();
  }

  function handleRestartGame() {
    if (!canStartGame) {
      return;
    }

    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
      return;
    }

    restartGame();
  }

  function handleAcceptGuestWarning() {
    setGuestWarningAccepted(true);
    setShowGuestWarning(false);
  }

  const arrowButtonClassName = [
    "breakout-power-button",
    "breakout-arrow-power-button",
    isArrowReady && !isUltimateActive
      ? "breakout-power-ready"
      : "breakout-power-cooldown",
    isArrowAiming ? "breakout-arrow-aiming" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const homingButtonClassName = [
    "breakout-power-button",
    "breakout-homing-power-button",
    isHomingReady && !isUltimateActive
      ? "breakout-power-ready"
      : "breakout-power-cooldown",
    isHomingActive ? "breakout-power-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const shieldButtonClassName = [
    "breakout-power-button",
    "breakout-shield-power-button",
    isShieldReady && !isUltimateActive
      ? "breakout-power-ready"
      : "breakout-power-cooldown",
    isShieldActive ? "breakout-power-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const ultimateButtonClassName = [
    "breakout-power-button",
    "breakout-ultimate-power-button",
    isUltimateReady ? "breakout-power-ready" : "breakout-power-cooldown",
    isUltimateActive ? "breakout-power-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="breakout-page">
      <div className="breakout-background-orb breakout-orb-one" />
      <div className="breakout-background-orb breakout-orb-two" />
      <div className="breakout-background-grid" />

      <section className="breakout-shell">
        <header className="breakout-topbar breakout-glass-panel">
          <Link to="/" className="breakout-back-link">
            ← Home
          </Link>

          {canPauseGame && (
            <button
              className="breakout-pause-button"
              type="button"
              onClick={screenState === "paused" ? resumeGame : pauseGame}
            >
              {screenState === "paused" ? "Continuar" : "Pausar"}
            </button>
          )}

          <div className="breakout-title">
            <span>🧱</span>

            <div>
              <strong>Brick Breaker</strong>
              <p>Sobreviva, faça combos e domine o caos arcade.</p>
            </div>
          </div>
        </header>

        <section className="breakout-scoreboard">
          <div className="breakout-score-box breakout-glass-panel">
            Pontos <span>{score}</span>
          </div>

          <div className="breakout-score-box breakout-glass-panel">
            Vidas <span>{lives}/{maxLives}</span>
          </div>

          <div className="breakout-score-box breakout-glass-panel">
            Tempo <span>{elapsedTimeLabel}</span>
          </div>

          <div className="breakout-score-box breakout-glass-panel">
            Bomba <span>{bombCharges > 0 ? `💣 x${bombCharges}` : "0"}</span>
          </div>
        </section>

        <section className="breakout-game-area">
          <div className="breakout-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="breakout-canvas"
              onMouseMove={(event) => handlePointerMove(event.clientX)}
              onTouchMove={(event) => {
                handlePointerMove(event.touches[0].clientX);
              }}
            />
          </div>

          {screenState === "start" && (
            <div className="breakout-overlay">
              <div className="breakout-start-card breakout-glass-panel">
                <div className="breakout-start-main">
                  <span className="breakout-start-icon">🧱</span>

                  <div>
                    <p className="breakout-eyebrow">Retro Arcade Challenge</p>

                    <h1>Brick Breaker</h1>

                    <p>
                      Quebre blocos, desvie dos drops ruins, carregue a Ultimate
                      e tente sobreviver o máximo possível.
                    </p>
                  </div>
                </div>

                <div className="breakout-start-grid">
                  <span>🖱️ Mouse/toque move a raquete</span>
                  <span>🏹 Q ativa Flecha</span>
                  <span>🎯 W ativa Guia</span>
                  <span>🛡️ R bloqueia drops ruins</span>
                  <span>⚡ E usa Ultimate cheia</span>
                  <span>☠️ 🔻 👻 Desvie dos perigos</span>
                </div>

                {canStartGame ? (
                  <button
                    className="breakout-btn breakout-btn-primary"
                    type="button"
                    onClick={handleStartGame}
                  >
                    Iniciar jogo
                  </button>
                ) : (
                  <div className="breakout-login-warning">
                    <strong>Entre para jogar</strong>
                    <p>
                      Para jogar e salvar progresso, entre na sua conta ou
                      continue como visitante pela Home.
                    </p>

                    <div className="breakout-modal-actions">
                      <Link className="breakout-btn breakout-btn-primary" to="/login">
                        Entrar
                      </Link>

                      <Link className="breakout-btn breakout-btn-secondary" to="/">
                        Voltar para Home
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {screenState === "game-over" && (
            <div className="breakout-overlay">
              <div className="breakout-modal breakout-glass-panel">
                <span className="breakout-modal-icon">💥</span>

                <h1>Game Over</h1>

                <p>
                  Você fez <strong>{score}</strong> pontos e sobreviveu por{" "}
                  <strong>{elapsedTimeLabel}</strong>.
                </p>

                {isAuthenticated && (
                  <LevelProgressSummary
                    gameId="breakout"
                    score={score}
                    elapsedSeconds={elapsedSeconds}
                    awardId={xpAwardId}
                  />
                )}

                {!isAuthenticated && (
                  <p className="breakout-save-warning">
                    Como visitante, essa pontuaÃ§Ã£o nÃ£o foi salva.
                  </p>
                )}

                <div className="breakout-modal-actions">
                  <button
                    className="breakout-btn breakout-btn-primary"
                    type="button"
                    onClick={handleRestartGame}
                  >
                    Tentar novamente
                  </button>

                  <button
                    className="breakout-btn breakout-btn-secondary"
                    type="button"
                    onClick={backToStartScreen}
                  >
                    Voltar ao início
                  </button>
                </div>
              </div>
            </div>
          )}

          {screenState === "paused" && (
            <div className="breakout-overlay">
              <div className="breakout-modal breakout-glass-panel">
                <span className="breakout-modal-icon">⏸️</span>

                <h1>Pausa</h1>

                <p>A partida ficou congelada. Volte quando estiver pronto.</p>

                <div className="breakout-modal-actions">
                  <button
                    className="breakout-btn breakout-btn-primary"
                    type="button"
                    onClick={resumeGame}
                  >
                    Voltar a jogar
                  </button>

                  <Link className="breakout-btn breakout-btn-secondary" to="/">
                    Voltar para Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="breakout-power-panel breakout-glass-panel">
          <div className="breakout-power-panel-text">
            <strong>Poderes</strong>

            <span>
              Q Flecha, W Guia, R Escudo e E Ultimate. O escudo bloqueia drops
              ruins, mas não salva a bolinha.
            </span>
          </div>

          <div className="breakout-power-buttons">
            {screenState === "playing" ? (
              <>
                <button
                  className={arrowButtonClassName}
                  style={arrowButtonStyle}
                  type="button"
                  onClick={handleArrowPowerAction}
                  aria-label="Usar poder de flecha"
                >
                  <span className="breakout-power-particles" />

                  <span className="breakout-power-icon">
                    {isArrowAiming ? "🎯" : "🏹"}
                  </span>

                  <small>
                    {isUltimateActive
                      ? "LOCK"
                      : isArrowAiming
                        ? "ATIRAR"
                        : isArrowReady
                          ? "Q"
                          : "RECARGA"}
                  </small>
                </button>

                <button
                  className={homingButtonClassName}
                  style={homingButtonStyle}
                  type="button"
                  onClick={handleHomingPowerAction}
                  aria-label="Usar poder teleguiado"
                >
                  <span className="breakout-power-particles" />

                  <span className="breakout-power-icon">
                    {isHomingActive ? "🟣" : "🎯"}
                  </span>

                  <small>
                    {isUltimateActive
                      ? "LOCK"
                      : isHomingActive
                        ? "ATIVO"
                        : isHomingReady
                          ? "W"
                          : "RECARGA"}
                  </small>
                </button>

                <button
                  className={shieldButtonClassName}
                  style={shieldButtonStyle}
                  type="button"
                  onClick={handleShieldPowerAction}
                  aria-label="Usar escudo"
                >
                  <span className="breakout-power-particles" />

                  <span className="breakout-power-icon">
                    {isShieldActive ? "🔵" : "🛡️"}
                  </span>

                  <small>
                    {isUltimateActive
                      ? "LOCK"
                      : isShieldActive
                        ? "ATIVO"
                        : isShieldReady
                          ? "R"
                          : "RECARGA"}
                  </small>
                </button>

                <button
                  className={ultimateButtonClassName}
                  style={ultimateButtonStyle}
                  type="button"
                  onClick={handleUltimatePowerAction}
                  aria-label="Usar ultimate"
                >
                  <span className="breakout-power-particles" />

                  <span className="breakout-power-icon">
                    {isUltimateActive ? "🟢" : "⚡"}
                  </span>

                  <small>
                    {isUltimateActive
                      ? ultimateTimeLabel
                      : isUltimateReady
                        ? "E"
                        : `${ultimateCharge}%`}
                  </small>
                </button>
              </>
            ) : (
              <>
                <div className="breakout-power-placeholder">
                  <span>🏹</span>
                  <small>Q</small>
                </div>

                <div className="breakout-power-placeholder">
                  <span>🎯</span>
                  <small>W</small>
                </div>

                <div className="breakout-power-placeholder">
                  <span>🛡️</span>
                  <small>R</small>
                </div>

                <div className="breakout-power-placeholder">
                  <span>⚡</span>
                  <small>Ultimate</small>
                </div>
              </>
            )}
          </div>
        </section>
      </section>

      {showGuestWarning && (
        <div className="breakout-page-modal-backdrop">
          <div className="breakout-warning-modal breakout-glass-panel">
            <span className="breakout-modal-icon">⚠️</span>

            <h2>Modo visitante</h2>

            <p>
              Você pode jogar normalmente, mas seus pontos e progresso não serão
              salvos enquanto estiver como visitante.
            </p>

            <div className="breakout-modal-actions">
              <button
                className="breakout-btn breakout-btn-primary"
                type="button"
                onClick={handleAcceptGuestWarning}
              >
                Entendi
              </button>

              <Link className="breakout-btn breakout-btn-secondary" to="/login">
                Entrar na conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default BreakoutGamePage;
