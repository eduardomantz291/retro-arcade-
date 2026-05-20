type BreakoutSoundName =
  | "bombExplosion"
  | "heartPickup"
  | "damageHit"
  | "debuffHit"
  | "shieldActivate"
  | "arrowActivate"
  | "homingActivate"
  | "gameOver"
  | "brickBreak"
  | "paddleHit"
  | "tntExplosion"
  | "ultimateActivate";

type AudioMap = Record<BreakoutSoundName, HTMLAudioElement>;

const BREAKOUT_AUDIO_PATH = "/audio/breakoutGame";

const soundConfig: Record<
  BreakoutSoundName,
  {
    file: string;
    volume: number;
    cooldown?: number;
  }
> = {
  bombExplosion: {
    file: "bomb-explosion.wav",
    volume: 0.42,
  },
  heartPickup: {
    file: "heart-pickup.wav",
    volume: 0.45,
  },
  damageHit: {
    file: "damage-hit.wav",
    volume: 0.45,
  },
  debuffHit: {
    file: "debuff-hit.wav",
    volume: 0.42,
  },
  shieldActivate: {
    file: "shield-activate.wav",
    volume: 0.42,
  },
  arrowActivate: {
    file: "arrow-activate.wav",
    volume: 0.42,
  },
  homingActivate: {
    file: "homing-activate.wav",
    volume: 0.42,
  },
  gameOver: {
    file: "game-over.wav",
    volume: 0.48,
  },
  brickBreak: {
    file: "brick-break.wav",
    volume: 0.18,
    cooldown: 55,
  },
  paddleHit: {
    file: "paddle-hit.wav",
    volume: 0.22,
    cooldown: 45,
  },
  tntExplosion: {
    file: "tnt-explosion.wav",
    volume: 0.48,
  },
  ultimateActivate: {
    file: "ultimate-activate.wav",
    volume: 0.5,
  },
};

export function createBreakoutAudioController() {
  const sounds = {} as AudioMap;
  const lastPlayedAt: Partial<Record<BreakoutSoundName, number>> = {};

  const menuTheme = new Audio(`${BREAKOUT_AUDIO_PATH}/menu-theme.mp3`);
  const gameplayTheme = new Audio(`${BREAKOUT_AUDIO_PATH}/gameplay-theme.mp3`);

  menuTheme.loop = true;
  menuTheme.volume = 0.28;

  gameplayTheme.loop = true;
  gameplayTheme.volume = 0.24;

  Object.entries(soundConfig).forEach(([soundName, config]) => {
    const audio = new Audio(`${BREAKOUT_AUDIO_PATH}/${config.file}`);
    audio.volume = config.volume;

    sounds[soundName as BreakoutSoundName] = audio;
  });

  function playTheme(audio: HTMLAudioElement) {
    audio.currentTime = 0;
    audio.play().catch(() => undefined);
  }

  function stopTheme(audio: HTMLAudioElement) {
    audio.pause();
    audio.currentTime = 0;
  }

  function startMenuTheme() {
    stopTheme(gameplayTheme);
    playTheme(menuTheme);
  }

  function startGameplayTheme() {
    stopTheme(menuTheme);
    playTheme(gameplayTheme);
  }

  function stopAllThemes() {
    stopTheme(menuTheme);
    stopTheme(gameplayTheme);
  }

  function play(soundName: BreakoutSoundName) {
    const sound = sounds[soundName];
    const config = soundConfig[soundName];

    if (!sound) {
      return;
    }

    const now = performance.now();
    const cooldown = config.cooldown ?? 0;
    const lastPlayed = lastPlayedAt[soundName] ?? -Infinity;

    if (now - lastPlayed < cooldown) {
      return;
    }

    lastPlayedAt[soundName] = now;

    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.volume = sound.volume;
    clone.play().catch(() => undefined);
  }

  function destroy() {
    stopAllThemes();
  }

  return {
    play,
    startMenuTheme,
    startGameplayTheme,
    stopAllThemes,
    destroy,
  };
}

export type BreakoutAudioController = ReturnType<
  typeof createBreakoutAudioController
>;