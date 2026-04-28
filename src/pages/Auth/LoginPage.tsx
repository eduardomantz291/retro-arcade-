import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import "./auth-style.css";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const wasRegistered = searchParams.get("registered") === "true";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Login fake: validamos os dados salvos no localStorage.
    const hasLoggedIn = login(email, password);

    if (!hasLoggedIn) {
      setErrorMessage(
        "Email ou senha inválidos. Se quiser testar rápido, use player@retroarcade.com e senha 123456."
      );

      return;
    }

    navigate("/");
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

        {wasRegistered && (
          <div className="auth-success-message">
            Conta criada com sucesso. Agora entre usando o email e a senha
            cadastrados.
          </div>
        )}

        {errorMessage && (
          <div className="auth-error-message">
            {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>

            <input
              type="email"
              name="email"
              placeholder="seuemail@email.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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