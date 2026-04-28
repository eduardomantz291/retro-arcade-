import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { CANVAS_SIZE } from "./snakeConfig";
import { useSnakeGame } from "./useSnakeGame";
import "./snake-game-style.css";

function SnakeGamePage() {
  const { isAuthenticated, isGuest } = useAuth();

  const {
    canvasRef,
    screenState,
    countdownText,
    score,
    finalScore,
    highScore,
    goldenPercent,
    magnetPercent,
    startGame,
    changeDirection,
  } = useSnakeGame({ isAuthenticated });

  const [showGuestWarning, setShowGuestWarning] = useState(isGuest);
  const [guestWarningAccepted, setGuestWarningAccepted] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(
    !isAuthenticated && !isGuest
  );

  useEffect(() => {
    // Visitante pode jogar, mas precisa ver o aviso sobre progresso.
    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
    }

    // Usuário sem login e sem modo visitante não joga direto.
    if (!isAuthenticated && !isGuest) {
      setShowLoginWarning(true);
    }
  }, [isAuthenticated, isGuest, guestWarningAccepted]);

  function handleStartGame() {
    if (!isAuthenticated && !isGuest) {
      setShowLoginWarning(true);
      return;
    }

    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
      return;
    }

    startGame();
  }

  function handleAcceptGuestWarning() {
    setGuestWarningAccepted(true);
    setShowGuestWarning(false);

    // Depois do aviso, o jogo já começa.
    startGame();
  }

  return (
    <main className="snake-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <section className="snake-shell">
        <div className="snake-topbar glass-panel">
          <Link to="/" className="snake-back-link">
            ← Voltar para Home
          </Link>

          <div className="snake-title">
            <span>🐍</span>

            <div>
              <strong>Snake Arcade</strong>
              <p>Frutas especiais, poderes e frenesi.</p>
            </div>
          </div>
        </div>

        <div className="snake-scoreboard">
          <div className="snake-score-box glass-panel">
            PONTOS <span>{score}</span>
          </div>

          <div className="snake-score-box glass-panel">
            RECORDE <span>{highScore}</span>
          </div>
        </div>

        <div className="snake-power-area">
          {goldenPercent > 0 && (
            <div className="snake-power-ui">
              <span>🌟 PROTEÇÃO</span>

              <div className="snake-bar-bg">
                <div
                  className="snake-bar-fill snake-bar-golden"
                  style={{ width: `${goldenPercent}%` }}
                />
              </div>
            </div>
          )}

          {magnetPercent > 0 && (
            <div className="snake-power-ui">
              <span>🧲 ÍMÃ</span>

              <div className="snake-bar-bg">
                <div
                  className="snake-bar-fill snake-bar-purple"
                  style={{ width: `${magnetPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="snake-canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="snake-canvas"
          />
        </div>

        <div className="snake-mobile-controls">
          <div className="snake-pad-left">
            <button type="button" onClick={() => changeDirection("left")}>
              ⬅️
            </button>

            <button type="button" onClick={() => changeDirection("right")}>
              ➡️
            </button>
          </div>

          <div className="snake-pad-right">
            <button type="button" onClick={() => changeDirection("up")}>
              ⬆️
            </button>

            <button type="button" onClick={() => changeDirection("down")}>
              ⬇️
            </button>
          </div>
        </div>
      </section>

      {screenState === "start" && (
        <div className="snake-screen-backdrop">
          <div className="snake-start-modal glass-panel">
            <div className="snake-start-left">
              <span className="snake-screen-icon">🐍</span>

              <span className="snake-start-kicker">Arcade Challenge</span>

              <h1>Snake Arcade</h1>

              <p>
                Controle a cobrinha, colete frutas, ative poderes especiais e
                tente sobreviver o máximo possível sem perder o ritmo.
              </p>

              <div className="snake-start-summary">
                <strong>Objetivo</strong>
                <span>
                  Faça pontos com frutas vermelhas, aproveite os poderes raros e
                  cuidado com as frutas pretas.
                </span>
              </div>
            </div>

            <div className="snake-start-right">
              <div className="snake-tutorial-card">
                <h2>Como jogar</h2>

                <ul>
                  <li>
                    <strong>Movimento:</strong> use as setas, WASD ou os botões
                    no celular.
                  </li>

                  <li>
                    <strong>Fruta vermelha:</strong> dá pontos e aumenta sua
                    cobrinha.
                  </li>

                  <li>
                    <strong>Fruta amarela:</strong> ativa proteção completa por
                    um tempo.
                  </li>

                  <li>
                    <strong>Fruta roxa:</strong> ativa o ímã e atrai frutas
                    próximas.
                  </li>

                  <li>
                    <strong>Fruta verde:</strong> ativa o frenesi, remove frutas
                    pretas temporariamente e espalha frutas extras.
                  </li>

                  <li>
                    <strong>Fruta preta:</strong> causa dano se você estiver sem
                    proteção.
                  </li>
                </ul>
              </div>

              <button
                className="btn btn-primary snake-start-button"
                type="button"
                onClick={handleStartGame}
              >
                Iniciar jogo
              </button>

              <small>
                Dica: pegue a fruta roxa antes de tentar alcançar a verde. O ímã
                pode mudar totalmente a partida.
              </small>
            </div>
          </div>
        </div>
      )}

      {screenState === "countdown" && (
        <div className="snake-screen-backdrop snake-countdown-backdrop">
          <div className="snake-countdown-modal glass-panel">
            <strong>{countdownText}</strong>
          </div>
        </div>
      )}

      {screenState === "game-over" && (
        <div className="snake-screen-backdrop">
          <div className="snake-screen-modal snake-game-over-modal glass-panel">
            <h1 className="snake-game-over-title">Fim de jogo</h1>

            <div className="snake-final-score">
              <span>PONTOS</span>
              <strong>{finalScore}</strong>
            </div>

            {!isAuthenticated && (
              <p className="snake-save-warning">
                Como visitante, essa pontuação não foi salva.
              </p>
            )}

            <div className="snake-screen-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleStartGame}
              >
                Tentar novamente
              </button>

              <Link className="btn btn-secondary" to="/">
                Voltar
              </Link>
            </div>
          </div>
        </div>
      )}

      {showGuestWarning && (
        <div className="snake-modal-backdrop">
          <div className="snake-warning-modal glass-panel">
            <span className="snake-modal-icon">⚠️</span>

            <h2>Modo visitante</h2>

            <p>
              Você pode jogar normalmente, mas seus pontos, recordes e progresso
              não serão salvos enquanto estiver como visitante.
            </p>

            <div className="snake-modal-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleAcceptGuestWarning}
              >
                Entendi, começar jogo
              </button>

              <Link className="btn btn-secondary" to="/login">
                Entrar na conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {showLoginWarning && (
        <div className="snake-modal-backdrop">
          <div className="snake-warning-modal glass-panel">
            <span className="snake-modal-icon">🔐</span>

            <h2>Entre para jogar</h2>

            <p>
              Para jogar e salvar seu progresso, entre na sua conta ou crie um
              cadastro. Também é possível continuar como visitante pela Home.
            </p>

            <div className="snake-modal-actions">
              <Link className="btn btn-primary" to="/login">
                Entrar
              </Link>

              <Link className="btn btn-secondary" to="/register">
                Criar conta
              </Link>

              <Link className="btn btn-ghost" to="/">
                Voltar para Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default SnakeGamePage;