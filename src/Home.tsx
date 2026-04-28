import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "./contexts/AuthContext";
import "./home-style.css";

type GameStatus = "available" | "coming-soon" | "locked";

type Game = {
  id: number;
  title: string;
  description: string;
  emoji: string;
  status: GameStatus;
  requiredLevel: number;
  tag: string;
};

const games: Game[] = [
  {
    id: 1,
    title: "Snake Arcade",
    description:
      "A cobrinha evoluída com poderes, frutas especiais, combo e frenesi.",
    emoji: "🐍",
    status: "available",
    requiredLevel: 1,
    tag: "Disponível",
  },
  {
    id: 2,
    title: "Number Merge",
    description: "Combine números, faça combos e tente alcançar a maior pontuação.",
    emoji: "🧩",
    status: "locked",
    requiredLevel: 3,
    tag: "Nível 3",
  },
  {
    id: 3,
    title: "Ghost Maze",
    description: "Um labirinto retrô inspirado em clássicos de perseguição.",
    emoji: "👻",
    status: "locked",
    requiredLevel: 5,
    tag: "Nível 5",
  },
  {
    id: 4,
    title: "Space Shooter",
    description: "Controle uma nave, desvie de obstáculos e destrua inimigos.",
    emoji: "🚀",
    status: "coming-soon",
    requiredLevel: 8,
    tag: "Em breve",
  },
];

function Home() {
  const { user, isAuthenticated, isGuest, logout, continueAsGuest } = useAuth();

  const [showAuthWarning, setShowAuthWarning] = useState(
    !isAuthenticated && !isGuest
  );

  const userLevel = user?.level ?? 0;
  const userPoints = user?.points ?? 0;
  const userName = user?.username ?? "";

  useEffect(() => {
    // Se o usuário estiver logado ou em modo visitante, fechamos o aviso inicial.
    if (isAuthenticated || isGuest) {
      setShowAuthWarning(false);
    }
  }, [isAuthenticated, isGuest]);

  function handleGuestMode() {
    // Modo visitante: pode explorar a Home, mas não acessa Perfil ou Minha Conta.
    continueAsGuest();
    setShowAuthWarning(false);
  }

  function handleProtectedAction() {
    // Sempre que uma área exigir login real, mostramos o aviso.
    if (!isAuthenticated) {
      setShowAuthWarning(true);
    }
  }

  return (
    <main className="app">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <header className="site-header glass-panel">
        <div className="brand">
          <span className="brand-icon">🎮</span>

          <div>
            <strong>Retro Arcade Games</strong>
            <p>Arcade moderno, alma retrô.</p>
          </div>
        </div>

        <nav className="main-nav">
          <a href="#games">Jogos</a>
          <a href="#ranking">Ranking</a>

          {isAuthenticated ? (
            <Link to="/profile">Perfil</Link>
          ) : (
            <button type="button" onClick={handleProtectedAction}>
              Perfil
            </button>
          )}
        </nav>

        <div className="header-actions">
          {isAuthenticated && user ? (
            <>
              <Link className="user-pill" to="/profile">
                <span className="user-avatar">{user.avatarInitial}</span>
                <span>{userName}</span>
                <strong>Lv. {userLevel}</strong>
              </Link>

              <button className="btn btn-ghost" type="button" onClick={logout}>
                Sair
              </button>
            </>
          ) : isGuest ? (
            <>
              <button
                className="guest-pill"
                type="button"
                onClick={handleProtectedAction}
              >
                <span className="user-avatar">V</span>
                <span>Visitante</span>
              </button>

              <Link className="btn btn-primary" to="/login">
                Entrar
              </Link>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">
                Entrar
              </Link>

              <Link className="btn btn-primary" to="/register">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>✨ Novo projeto</span>
            <strong>Plataforma Arcade</strong>
          </div>

          <h1>
            Uma coleção de jogos retrô com visual moderno, progressão e desafios.
          </h1>

          <p>
            Jogue, acumule pontos, suba de nível e desbloqueie novos games dentro
            da sua própria central arcade.
          </p>

          <div className="hero-actions">
            <a href="#games" className="btn btn-primary">
              Ver jogos
            </a>

            {isAuthenticated ? (
              <Link className="btn btn-secondary" to="/profile">
                Minha conta
              </Link>
            ) : (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleProtectedAction}
              >
                Minha conta
              </button>
            )}
          </div>
        </div>

        <aside className="hero-card glass-panel">
          <div className="hero-card-glow" />

          <span className="arcade-label">Jogo em destaque</span>

          <div className="featured-game-icon">🐍</div>

          <h2>Snake Arcade</h2>

          <p>
            Poderes especiais, frutas raras, frenesi verde, música e aquele caos
            gostoso de arcade.
          </p>

          <div className="stats-row">
            <div>
              <strong>250+</strong>
              <span>Pontos bônus</span>
            </div>

            <div>
              <strong>5</strong>
              <span>Power-ups</span>
            </div>

            <div>
              <strong>∞</strong>
              <span>Replay</span>
            </div>
          </div>

          <button
            className="btn btn-primary full-width"
            type="button"
            onClick={handleProtectedAction}
          >
            Jogar agora
          </button>
        </aside>
      </section>

      <section className="section-header" id="games">
        <div>
          <span className="section-kicker">Biblioteca</span>
          <h2>Escolha seu próximo jogo</h2>
        </div>

        <p>
          Alguns jogos estarão bloqueados por nível. Quando o backend entrar,
          isso vai vir da conta real do usuário.
        </p>
      </section>

      <section className="games-grid">
        {games.map((game) => {
          const isLockedByLevel =
            !isAuthenticated || userLevel < game.requiredLevel;

          const isComingSoon = game.status === "coming-soon";
          const canPlay = game.status === "available" && !isLockedByLevel;

          return (
            <article
              className={`game-card glass-panel ${
                canPlay ? "game-card-active" : "game-card-locked"
              }`}
              key={game.id}
            >
              <div className="game-card-top">
                <span className="game-icon">{game.emoji}</span>

                <span
                  className={`game-tag ${canPlay ? "tag-open" : "tag-locked"}`}
                >
                  {canPlay ? "Liberado" : game.tag}
                </span>
              </div>

              <h3>{game.title}</h3>

              <p>{game.description}</p>

              <div className="game-card-footer">
                <span>Nível mínimo: {game.requiredLevel}</span>

                <button
                  className="btn btn-small"
                  type="button"
                  disabled={isComingSoon}
                  onClick={canPlay ? undefined : handleProtectedAction}
                >
                  {canPlay ? "Jogar" : isComingSoon ? "Em breve" : "Bloqueado"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="profile-preview glass-panel" id="profile">
        <div>
          <span className="section-kicker">Perfil</span>

          <h2>
            {isAuthenticated
              ? `Bem-vindo, ${userName}`
              : "Entre para salvar sua evolução"}
          </h2>

          <p>
            Seu perfil vai guardar pontos, nível, jogos recentes, conquistas e
            desbloqueios.
          </p>
        </div>

        <div className="profile-stats">
          <div>
            <strong>{userPoints}</strong>
            <span>Pontos</span>
          </div>

          <div>
            <strong>{userLevel}</strong>
            <span>Nível</span>
          </div>

          <div>
            <strong>{isAuthenticated ? user?.gamesUnlocked : 0}</strong>
            <span>Jogos liberados</span>
          </div>
        </div>
      </section>

      {!isAuthenticated && showAuthWarning && (
        <div className="auth-modal-backdrop">
          <div className="auth-modal glass-panel">
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowAuthWarning(false)}
              aria-label="Fechar aviso"
            >
              ×
            </button>

            <span className="modal-icon">🔐</span>

            <h2>Você precisa entrar na sua conta</h2>

            <p>
              Para acessar Perfil, Minha Conta, salvar pontos, subir de nível e
              desbloquear jogos, você precisa entrar ou criar um cadastro.
            </p>

            <div className="modal-actions">
              <Link className="btn btn-primary" to="/login">
                Entrar
              </Link>

              <Link className="btn btn-secondary" to="/register">
                Criar conta
              </Link>

              {!isGuest && (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={handleGuestMode}
                >
                  Continuar como visitante
                </button>
              )}
            </div>

            <small>
              Como visitante, você pode explorar a Home, mas precisa entrar ou
              criar conta para acessar Perfil e Minha Conta.
            </small>
          </div>
        </div>
      )}
    </main>
  );
}

export default Home;