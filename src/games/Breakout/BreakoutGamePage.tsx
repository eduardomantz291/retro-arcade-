import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import "./breakout-game-style.css";

type BreakoutScreenState = "start" | "playing" | "game-over";

type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  hits: number;
  maxHits: number;
  color: string;
  glow: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

type BreakoutRuntime = {
  paddle: {
    x: number;
    y: number;
    width: number;
    height: number;
    targetX: number;
  };
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    speed: number;
  };
  bricks: Brick[];
  particles: Particle[];
  score: number;
  lives: number;
  level: number;
  shake: number;
};

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 420;

const PADDLE_WIDTH = 112;
const PADDLE_HEIGHT = 14;

const BALL_RADIUS = 7;

const BRICK_ROWS = 5;
const BRICK_COLUMNS = 9;
const BRICK_GAP = 8;
const BRICK_TOP = 72;
const BRICK_SIDE = 24;
const BRICK_HEIGHT = 22;

const INITIAL_LIVES = 3;

const brickColors = [
  { color: "#4facfe", glow: "#4facfe" },
  { color: "#38ef7d", glow: "#38ef7d" },
  { color: "#f1c40f", glow: "#f1c40f" },
  { color: "#9b59b6", glow: "#be2edd" },
  { color: "#ff4757", glow: "#ff6b81" },
];

function createBricks(level: number) {
  const brickWidth =
    (CANVAS_WIDTH - BRICK_SIDE * 2 - BRICK_GAP * (BRICK_COLUMNS - 1)) /
    BRICK_COLUMNS;

  const bricks: Brick[] = [];

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let column = 0; column < BRICK_COLUMNS; column++) {
      const palette = brickColors[row % brickColors.length];

      const hasExtraLife = level >= 2 && row <= 1;
      const maxHits = hasExtraLife ? 2 : 1;

      bricks.push({
        x: BRICK_SIDE + column * (brickWidth + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: brickWidth,
        height: BRICK_HEIGHT,
        active: true,
        hits: maxHits,
        maxHits,
        color: palette.color,
        glow: palette.glow,
      });
    }
  }

  return bricks;
}

function createInitialRuntime(level = 1): BreakoutRuntime {
  return {
    paddle: {
      x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: CANVAS_HEIGHT - 42,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      targetX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    },
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 68,
      vx: 4,
      vy: -4.6,
      radius: BALL_RADIUS,
      speed: 1,
    },
    bricks: createBricks(level),
    particles: [],
    score: 0,
    lives: INITIAL_LIVES,
    level,
    shake: 0,
  };
}

function BreakoutGamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const runtimeRef = useRef<BreakoutRuntime>(createInitialRuntime());
  const screenStateRef = useRef<BreakoutScreenState>("start");

  const [screenState, setScreenState] =
    useState<BreakoutScreenState>("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    drawGame();

    function handleKeyDown(event: KeyboardEvent) {
      if (screenStateRef.current !== "playing") {
        return;
      }

      const runtime = runtimeRef.current;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        runtime.paddle.targetX -= 54;
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        runtime.paddle.targetX += 54;
      }

      runtime.paddle.targetX = clampPaddle(runtime.paddle.targetX);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  function setGameScreen(nextScreen: BreakoutScreenState) {
    screenStateRef.current = nextScreen;
    setScreenState(nextScreen);
  }

  function clampPaddle(nextX: number) {
    const runtime = runtimeRef.current;

    return Math.max(
      0,
      Math.min(CANVAS_WIDTH - runtime.paddle.width, nextX)
    );
  }

  function syncStateFromRuntime() {
    const runtime = runtimeRef.current;

    setScore(runtime.score);
    setLives(runtime.lives);
    setLevel(runtime.level);
  }

  function resetBall() {
    const runtime = runtimeRef.current;

    runtime.ball.x = CANVAS_WIDTH / 2;
    runtime.ball.y = CANVAS_HEIGHT - 68;
    runtime.ball.vx = Math.random() > 0.5 ? 4 : -4;
    runtime.ball.vy = -4.6;
    runtime.ball.speed = 1;
    runtime.paddle.x = CANVAS_WIDTH / 2 - runtime.paddle.width / 2;
    runtime.paddle.targetX = runtime.paddle.x;
  }

  function resetGame() {
    runtimeRef.current = createInitialRuntime(1);
    syncStateFromRuntime();
    drawGame();
  }

  function startGame() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    runtimeRef.current = createInitialRuntime(1);
    syncStateFromRuntime();

    setGameScreen("playing");
    frameRef.current = requestAnimationFrame(gameLoop);
  }

  function restartGame() {
    startGame();
  }

  function handlePointerMove(clientX: number) {
    if (screenStateRef.current !== "playing") {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const x = (clientX - rect.left) * scaleX;

    const runtime = runtimeRef.current;
    runtime.paddle.targetX = clampPaddle(x - runtime.paddle.width / 2);
  }

  function createExplosion(x: number, y: number, color: string) {
    const runtime = runtimeRef.current;

    for (let index = 0; index < 10; index++) {
      runtime.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1,
        color,
      });
    }
  }

  function hitBrick(brick: Brick) {
    const runtime = runtimeRef.current;

    brick.hits -= 1;

    runtime.score += 10;
    runtime.shake = 4;

    createExplosion(
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      brick.glow
    );

    if (brick.hits <= 0) {
      brick.active = false;
      runtime.score += 15;
    }

    runtime.ball.vy *= -1;
    runtime.ball.speed = Math.min(runtime.ball.speed + 0.025, 1.45);

    setScore(runtime.score);

    const hasActiveBricks = runtime.bricks.some((currentBrick) => {
      return currentBrick.active;
    });

    if (!hasActiveBricks) {
      runtime.level += 1;
      runtime.bricks = createBricks(runtime.level);
      runtime.particles = [];
      runtime.shake = 10;

      resetBall();
      syncStateFromRuntime();
    }
  }

  function updateGame() {
    const runtime = runtimeRef.current;
    const { paddle, ball } = runtime;

    paddle.x += (paddle.targetX - paddle.x) * 0.24;
    paddle.x = clampPaddle(paddle.x);

    ball.x += ball.vx * ball.speed;
    ball.y += ball.vy * ball.speed;

    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx *= -1;
    }

    if (ball.x + ball.radius >= CANVAS_WIDTH) {
      ball.x = CANVAS_WIDTH - ball.radius;
      ball.vx *= -1;
    }

    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy *= -1;
    }

    const isBallTouchingPaddle =
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width &&
      ball.vy > 0;

    if (isBallTouchingPaddle) {
      const paddleCenter = paddle.x + paddle.width / 2;
      const hitPosition = (ball.x - paddleCenter) / (paddle.width / 2);

      ball.vx = hitPosition * 5.4;
      ball.vy = -Math.abs(ball.vy);
      ball.y = paddle.y - ball.radius - 1;

      createExplosion(ball.x, ball.y, "#38ef7d");
    }

    for (const brick of runtime.bricks) {
      if (!brick.active) {
        continue;
      }

      const isBallInsideBrick =
        ball.x + ball.radius >= brick.x &&
        ball.x - ball.radius <= brick.x + brick.width &&
        ball.y + ball.radius >= brick.y &&
        ball.y - ball.radius <= brick.y + brick.height;

      if (isBallInsideBrick) {
        hitBrick(brick);
        break;
      }
    }

    if (ball.y - ball.radius > CANVAS_HEIGHT) {
      runtime.lives -= 1;
      runtime.shake = 12;

      setLives(runtime.lives);

      if (runtime.lives <= 0) {
        setGameScreen("game-over");

        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }

        return;
      }

      resetBall();
    }

    for (let index = runtime.particles.length - 1; index >= 0; index--) {
      const particle = runtime.particles[index];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.045;

      if (particle.life <= 0) {
        runtime.particles.splice(index, 1);
      }
    }

    if (runtime.shake > 0) {
      runtime.shake -= 0.5;
    }
  }

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  function drawGame() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const runtime = runtimeRef.current;

    ctx.save();

    if (runtime.shake > 0) {
      const shakeX = (Math.random() - 0.5) * runtime.shake;
      const shakeY = (Math.random() - 0.5) * runtime.shake;

      ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = "#1e272e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pulse = Math.abs(Math.sin(Date.now() / 320)) * 0.14;
    ctx.fillStyle = `rgba(56, 239, 125, ${0.03 + pulse})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;

    for (let x = 0; x < CANVAS_WIDTH; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y < CANVAS_HEIGHT; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    for (const brick of runtime.bricks) {
      if (!brick.active) {
        continue;
      }

      const opacity = brick.hits / brick.maxHits;

      ctx.shadowBlur = 14;
      ctx.shadowColor = brick.glow;
      ctx.fillStyle =
        brick.maxHits > 1
          ? `rgba(241, 196, 15, ${0.55 + opacity * 0.45})`
          : brick.color;

      drawRoundedRect(
        ctx,
        brick.x,
        brick.y,
        brick.width,
        brick.height,
        8
      );

      ctx.shadowBlur = 0;
    }

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#38ef7d";
    ctx.fillStyle = "#38ef7d";

    drawRoundedRect(
      ctx,
      runtime.paddle.x,
      runtime.paddle.y,
      runtime.paddle.width,
      runtime.paddle.height,
      999
    );

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#4facfe";
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(
      runtime.ball.x,
      runtime.ball.y,
      runtime.ball.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;

    for (const particle of runtime.particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function gameLoop() {
    if (screenStateRef.current !== "playing") {
      return;
    }

    updateGame();
    drawGame();

    frameRef.current = requestAnimationFrame(gameLoop);
  }

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
              <p>Quebre blocos, faça pontos e avance de nível.</p>
            </div>
          </div>
        </header>

        <section className="breakout-scoreboard">
          <div className="breakout-score-box breakout-glass-panel">
            Pontos <span>{score}</span>
          </div>

          <div className="breakout-score-box breakout-glass-panel">
            Vidas <span>{lives}</span>
          </div>

          <div className="breakout-score-box breakout-glass-panel">
            Level <span>{level}</span>
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
                  Controle a raquete, rebata a bolinha e destrua todos os blocos
                  para avançar de nível.
                </p>

                <div className="breakout-tips">
                  <span>Mouse ou toque para mover</span>
                  <span>Setas ou A/D também funcionam</span>
                  <span>Blocos dourados precisam de mais de uma batida</span>
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
                  Você fez <strong>{score}</strong> pontos e chegou ao level{" "}
                  <strong>{level}</strong>.
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
            Mova a raquete, rebata a bolinha e quebre todos os blocos. Se a
            bolinha cair, você perde uma vida.
          </span>
        </footer>
      </section>
    </main>
  );
}

export default BreakoutGamePage;