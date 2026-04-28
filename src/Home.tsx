import { useState } from "react";
import { Link } from "react-router";
import "./home-style.css";

type User = {
  name: string;
  level: number;
  points: number;
} | null;

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
    description: "A cobrinha evoluída com poderes, frutas especiais, combo e frenesi.",
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
  const [user, setUser] = useState<User>(null);
  const [showAuthWarning, setShowAuthWarning] = useState(true);

  const isLoggedIn = user !== null;
  const userLevel = user?.level ?? 0;
  const userPoints = user?.points ?? 0;
  const userName = user?.name ?? "";

  function handleGuestLogin() {
    // Login temporário apenas para testar a interface.
    // Depois isso será substituído pela autenticação real do backend.
    setUser({
      name: "Jogador Visitante",
      level: 1,
      points: 0,
    });

    setShowAuthWarning(false);
  }

  function handleOpenAuthWarning() {
    // Se o usuário ainda não estiver logado, mostramos o aviso.
    if (!isLoggedIn) {
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
          <a href="#profile">Perfil</a>
        </nav>

        <div className="header-actions">
          {isLoggedIn ? (
            <div className="user-pill">
              <span>{userName}</span>
              <strong>Lv. {userLevel}</strong>
            </div>
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

            {isLoggedIn ? (
              <a href="#profile" className="btn btn-secondary">
                Minha conta
              </a>
            ) : (
              <Link className="btn btn-secondary" to="/login">
                Minha conta
              </Link>
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
            onClick={handleOpenAuthWarning}
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
          const isLockedByLevel = !isLoggedIn || userLevel < game.requiredLevel;
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

                <span className={`game-tag ${canPlay ? "tag-open" : "tag-locked"}`}>
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
                  disabled={!canPlay || isComingSoon}
                  onClick={handleOpenAuthWarning}
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
            {isLoggedIn
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
            <strong>{isLoggedIn ? 1 : 0}</strong>
            <span>Jogos liberados</span>
          </div>
        </div>
      </section>

      {!isLoggedIn && showAuthWarning && (
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

            <h2>Você ainda não está logado</h2>

            <p>
              Para salvar pontos, subir de nível e desbloquear novos jogos,
              você vai precisar entrar ou criar uma conta.
            </p>

            <div className="modal-actions">
              <Link className="btn btn-primary" to="/login">
                Entrar
              </Link>

              <Link className="btn btn-secondary" to="/register">
                Criar conta
              </Link>

              <button
                className="btn btn-ghost"
                type="button"
                onClick={handleGuestLogin}
              >
                Entrar como visitante
              </button>
            </div>

            <small>
              Por enquanto isso é só visual. A autenticação real entra quando
              fizermos o backend.
            </small>
          </div>
        </div>
      )}
    </main>
  );
}

export default Home;