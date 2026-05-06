import type { CSSProperties } from "react";
import { Link } from "react-router";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./breakoutConfig";
import { useBreakoutGame } from "./useBreakoutGame";
import "./breakout-game-style.css";

function BreakoutGamePage() {
  const {
    canvasRef,
    screenState,
    score,
    lives,
    maxLives,
    elapsedTimeLabel,
    bombCharges,
    isArrowAiming,
    isArrowReady,
    arrowCooldownProgress,
    isHomingActive,
    isHomingReady,
    homingCooldownProgress,
    startGame,
    restartGame,
    handlePointerMove,
    handleArrowPowerAction,
    handleHomingPowerAction,
  } = useBreakoutGame();

  const arrowButtonStyle = {
    "--power-charge": arrowCooldownProgress,
  } as CSSProperties;

  const homingButtonStyle = {
    "--power-charge": homingCooldownProgress,
  } as CSSProperties;

  const arrowButtonClassName = [
    "breakout-power-button",
    "breakout-arrow-power-button",
    isArrowReady ? "breakout-power-ready" : "breakout-power-cooldown",
    isArrowAiming ? "breakout-arrow-aiming" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const homingButtonClassName = [
    "breakout-power-button",
    "breakout-homing-power-button",
    isHomingReady ? "breakout-power-ready" : "breakout-power-cooldown",
    isHomingActive ? "breakout-power-active" : "",
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
            ← Voltar para Home
          </Link>

          <div className="breakout-title">
            <span>🧱</span>

            <div>
              <strong>Brick Breaker</strong>
              <p>Quebre blocos, sobreviva e bata seu tempo.</p>
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
              <div className="breakout-modal breakout-glass-panel">
                <span className="breakout-modal-icon">🧱</span>

                <h1>Brick Breaker</h1>

                <p>
                  Controle a raquete, rebata a bolinha, quebre todos os blocos e
                  tente sobreviver pelo máximo de tempo possível.
                </p>

                <div className="breakout-tips">
                  <span>Mouse ou toque para mover</span>
                  <span>Setas ou A/D também funcionam</span>
                  <span>Espaço ou botão 🏹 ativa o poder de mira</span>
                  <span>Shift ou botão 🎯 ativa o poder teleguiado</span>
                  <span>❤️ Pegue corações para recuperar vidas</span>
                  <span>💣 Pegue bombas para deixar a bolinha explosiva</span>
                  <span>TNT explode blocos próximos e gera muitos pontos</span>
                </div>

                <button
                  className="breakout-btn breakout-btn-primary"
                  type="button"
                  onClick={startGame}
                >
                  Iniciar jogo
                </button>
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

                <div className="breakout-modal-actions">
                  <button
                    className="breakout-btn breakout-btn-primary"
                    type="button"
                    onClick={restartGame}
                  >
                    Tentar novamente
                  </button>

                  <Link className="breakout-btn breakout-btn-secondary" to="/">
                    Voltar
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
              Use Flecha para puxar a bolinha para a raquete e mirar. Use Guia
              para fazer a bolinha curvar em direção aos blocos por alguns segundos.
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
                    {isArrowAiming
                      ? "ATIRAR"
                      : isArrowReady
                        ? "FLECHA"
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
                    {isHomingActive
                      ? "ATIVO"
                      : isHomingReady
                        ? "GUIA"
                        : "RECARGA"}
                  </small>
                </button>
              </>
            ) : (
              <>
                <div className="breakout-power-placeholder">
                  <span>🏹</span>
                  <small>Disponível durante o jogo</small>
                </div>

                <div className="breakout-power-placeholder">
                  <span>🎯</span>
                  <small>Disponível durante o jogo</small>
                </div>
              </>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default BreakoutGamePage;