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
    startGame,
    restartGame,
    backToStartScreen,
    handlePointerMove,
    handleShootAction,
  } = useSpaceInvadersGame();

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
                  Mova sua nave, atire nos invasores e sobreviva o máximo que
                  conseguir. Por enquanto, essa é a base clássica do jogo.
                </p>

                <div className="space-start-grid">
                  <span>⬅️ ➡️ ou A/D movem a nave</span>
                  <span>Espaço ou W atira</span>
                  <span>Toque/mouse move no celular</span>
                  <span>Botão Atirar no mobile</span>
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
            <span>Setas/A-D para mover, Espaço/W para atirar.</span>
          </div>

          <button
            className="space-shoot-button"
            type="button"
            onClick={handleShootAction}
            disabled={screenState !== "playing"}
          >
            🔥 Atirar
          </button>
        </section>
      </section>
    </main>
  );
}

export default SpaceInvadersGamePage;