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
    startGame,
    restartGame,
    handlePointerMove,
  } = useBreakoutGame();

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

        <footer className="breakout-help breakout-glass-panel">
          <strong>Como jogar:</strong>
          <span>
            Mova a raquete, rebata a bolinha e quebre todos os blocos. Corações
            recuperam vida, bombas deixam a bolinha explosiva por 2 impactos e a
            TNT causa grandes explosões.
          </span>
        </footer>
      </section>
    </main>
  );
}

export default BreakoutGamePage;