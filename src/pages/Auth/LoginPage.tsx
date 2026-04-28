import { Link } from "react-router";
import "./auth-style.css";

function LoginPage() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Futuramente essa função vai chamar a API de login.
    console.log("Login submitted");
  }

  return (
    <main className="auth-page">
      <div className="auth-background-grid" />
      <div className="auth-orb auth-orb-blue" />
      <div className="auth-orb auth-orb-green" />

      <section className="auth-card glass-panel">
        <Link to="/" className="auth-back-link">
          ← Voltar para Home
        </Link>

        <div className="auth-header">
          <span className="auth-icon">🎮</span>

          <span className="auth-kicker">Welcome back</span>

          <h1>Entrar na conta</h1>

          <p>
            Acesse sua conta para salvar pontos, subir de nível e continuar sua
            jornada arcade.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>

            <input
              type="email"
              name="email"
              placeholder="seuemail@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Senha</span>

            <input
              type="password"
              name="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </label>

          <div className="auth-options">
            <label className="auth-checkbox">
              <input type="checkbox" />

              <span>Lembrar de mim</span>
            </label>

            <button type="button" className="auth-link-button">
              Esqueci minha senha
            </button>
          </div>

          <button type="submit" className="auth-submit-button">
            Entrar
          </button>
        </form>

        <div className="auth-footer">
          <span>Ainda não tem conta?</span>

          <Link to="/register">Criar conta</Link>
        </div>
      </section>

      <aside className="auth-side-card glass-panel">
        <span className="auth-side-badge">Player Progress</span>

        <h2>Continue sua evolução</h2>

        <p>
          Em breve, cada partida vai alimentar seu perfil com pontos, nível,
          conquistas e jogos desbloqueados.
        </p>

        <div className="auth-progress-list">
          <div>
            <strong>01</strong>
            <span>Salve sua pontuação</span>
          </div>

          <div>
            <strong>02</strong>
            <span>Suba de nível</span>
          </div>

          <div>
            <strong>03</strong>
            <span>Desbloqueie jogos</span>
          </div>
        </div>
      </aside>
    </main>
  );
}

export default LoginPage;