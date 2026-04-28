import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import "./auth-style.css";

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não são iguais.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    // Cadastro fake: salvamos o usuário no localStorage.
    register({
      username,
      email,
      password,
    });

    navigate(`/login?registered=true&email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="auth-page">
      <div className="auth-background-grid" />
      <div className="auth-orb auth-orb-purple" />
      <div className="auth-orb auth-orb-green" />

      <section className="auth-card glass-panel">
        <Link to="/" className="auth-back-link">
          ← Voltar para Home
        </Link>

        <div className="auth-header">
          <span className="auth-icon">🕹️</span>

          <span className="auth-kicker">New player</span>

          <h1>Criar conta</h1>

          <p>
            Crie seu perfil para começar a acumular pontos, acompanhar seu nível
            e liberar novos jogos.
          </p>
        </div>

        {errorMessage && (
          <div className="auth-error-message">
            {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Nome de jogador</span>

            <input
              type="text"
              name="username"
              placeholder="Ex: ArcadeMaster"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

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
              placeholder="Crie uma senha forte"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Confirmar senha</span>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Repita sua senha"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>

          <label className="auth-checkbox auth-terms">
            <input type="checkbox" required />

            <span>
              Aceito criar uma conta para salvar meu progresso na plataforma.
            </span>
          </label>

          <button type="submit" className="auth-submit-button">
            Criar conta
          </button>
        </form>

        <div className="auth-footer">
          <span>Já tem conta?</span>

          <Link to="/login">Entrar</Link>
        </div>
      </section>

      <aside className="auth-side-card glass-panel">
        <span className="auth-side-badge">Arcade Account</span>

        <h2>Seu perfil arcade</h2>

        <p>
          A conta será o centro da experiência: ranking, jogos recentes,
          conquistas, XP e desbloqueios.
        </p>

        <div className="auth-level-preview">
          <div className="auth-level-ring">
            <span>Lv. 1</span>
          </div>

          <div>
            <strong>Comece como Rookie</strong>

            <p>
              Ganhe pontos jogando e evolua para liberar novos desafios.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}

export default RegisterPage;