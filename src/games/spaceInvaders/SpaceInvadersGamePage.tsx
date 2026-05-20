import type { CSSProperties } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./spaceInvadersConfig";
import { useSpaceInvadersGame } from "./useSpaceInvadersGame";
import "./space-invaders-style.css";

function SpaceInvadersGamePage() {
  const { isAuthenticated, isGuest } = useAuth();

  const {
    canvasRef,
    screenState,
    score,
    lives,
    wave,
    isLaserReady,
    isLaserActive,
    laserCooldownProgress,
    isSupportReady,
    isSupportActive,
    supportCooldownProgress,
    startGame,
    restartGame,
    backToStartScreen,
    handlePointerMove,
    handleShootAction,
    handleLaserPowerAction,
    handleSupportPowerAction,
  } = useSpaceInvadersGame();

  const laserPowerStyle = {
    "--space-power-charge": laserCooldownProgress,
  } as CSSProperties;

  const supportPowerStyle = {
    "--space-power-charge": supportCooldownProgress,
  } as CSSProperties;

  const laserPowerClassName = [
    "space-power-button",
    "space-laser-power-button",
    isLaserReady ? "space-power-ready" : "space-power-cooldown",
    isLaserActive ? "space-power-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const supportPowerClassName = [
    "space-power-button",
    "space-support-power-button",
    isSupportReady ? "space-power-ready" : "space-power-cooldown",
    isSupportActive ? "space-power-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleStartGame() {
    if (!isAuthenticated && !isGuest) {
      return;
    }

    startGame();
  }

  const canStartGame = isAuthenticated || isGuest;

  return (
    <main className="space-page">
      <div className="space-background-grid" />
      <div className="space-background-orb space-orb-one" />
      <div className="space-background-orb space-orb-two" />

      <section className="space-shell">
        <header className="space-topbar space-glass-panel">
          <Link to="/" className="space-back-link">
            ← Home
          </Link>

          <div className="space-title">
            <span>👾</span>

            <div>
              <strong>Space Invaders</strong>
              <p>Defenda a Terra contra uma invasão geométrica.</p>
            </div>
          </div>
        </header>

        <section className="space-scoreboard">
          <div className="space-score-box space-glass-panel">
            Pontos <span>{score}</span>
          </div>

          <div className="space-score-box space-glass-panel">
            Vidas <span>{lives}</span>
          </div>

          <div className="space-score-box space-glass-panel">
            Onda <span>{wave}</span>
          </div>
        </section>

        <section className="space-game-area">
          <div className="space-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="space-canvas"
              onMouseMove={(event) => handlePointerMove(event.clientX)}
              onTouchMove={(event) => {
                handlePointerMove(event.touches[0].clientX);
              }}
            />
          </div>

          {screenState === "start" && (
            <div className="space-overlay">
              <div className="space-start-card space-glass-panel">
                <span className="space-start-icon">👾</span>

                <p className="space-eyebrow">Retro Arcade Mission</p>

                <h1>Space Invaders</h1>

                <p>
                  Mova sua nave, atire nos invasores e use poderes especiais
                  para sobreviver às ondas inimigas.
                </p>

                <div className="space-start-grid">
                  <span>⬅️ ➡️ ou A/D movem a nave</span>
                  <span>Espaço ou W atira</span>
                  <span>Q ativa o Laser</span>
                  <span>E chama a nave de suporte</span>
                </div>

                {canStartGame ? (
                  <button
                    className="space-btn space-btn-primary"
                    type="button"
                    onClick={handleStartGame}
                  >
                    Iniciar jogo
                  </button>
                ) : (
                  <div className="space-login-warning">
                    <strong>Entre para jogar</strong>
                    <p>
                      Para jogar e salvar progresso, entre na sua conta ou
                      continue como visitante pela Home.
                    </p>

                    <div className="space-login-actions">
                      <Link className="space-btn space-btn-primary" to="/login">
                        Entrar
                      </Link>

                      <Link className="space-btn space-btn-secondary" to="/">
                        Voltar para Home
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {screenState === "game-over" && (
            <div className="space-overlay">
              <div className="space-modal space-glass-panel">
                <span className="space-modal-icon">💥</span>

                <h1>Game Over</h1>

                <p>
                  Você fez <strong>{score}</strong> pontos e chegou na onda{" "}
                  <strong>{wave}</strong>.
                </p>

                <div className="space-modal-actions">
                  <button
                    className="space-btn space-btn-primary"
                    type="button"
                    onClick={restartGame}
                  >
                    Tentar novamente
                  </button>

                  <button
                    className="space-btn space-btn-secondary"
                    type="button"
                    onClick={backToStartScreen}
                  >
                    Voltar ao início
                  </button>

                  <Link className="space-btn space-btn-ghost" to="/">
                    Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-control-panel space-glass-panel">
          <div>
            <strong>Controles</strong>
            <span>
              Mouse/A-D para mover, Espaço/W para atirar, Q Laser e E Suporte.
            </span>
          </div>

          <div className="space-action-buttons">
            <button
              className="space-shoot-button"
              type="button"
              onClick={handleShootAction}
              disabled={screenState !== "playing"}
            >
              🔥 Atirar
            </button>

            <button
              className={laserPowerClassName}
              style={laserPowerStyle}
              type="button"
              onClick={handleLaserPowerAction}
              disabled={screenState !== "playing"}
            >
              <span>⚡</span>
              <small>{isLaserActive ? "ATIVO" : isLaserReady ? "Q" : "REC"}</small>
            </button>

            <button
              className={supportPowerClassName}
              style={supportPowerStyle}
              type="button"
              onClick={handleSupportPowerAction}
              disabled={screenState !== "playing"}
            >
              <span>🚀</span>
              <small>
                {isSupportActive ? "ATIVO" : isSupportReady ? "E" : "REC"}
              </small>
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default SpaceInvadersGamePage;