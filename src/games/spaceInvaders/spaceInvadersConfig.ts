// Configurações principais do Space Invaders.
// Aqui ficam os valores fixos do jogo, como tamanho do canvas,
// velocidade, pontuação, poderes, boss e quantidade de inimigos.

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 460;

export const PLAYER_WIDTH = 58;
export const PLAYER_HEIGHT = 28;
export const PLAYER_Y = CANVAS_HEIGHT - 54;
export const PLAYER_SPEED = 7;

export const PLAYER_BULLET_WIDTH = 4;
export const PLAYER_BULLET_HEIGHT = 14;
export const PLAYER_BULLET_SPEED = 8;

export const SUPPORT_BULLET_WIDTH = 4;
export const SUPPORT_BULLET_HEIGHT = 12;
export const SUPPORT_BULLET_SPEED = 7.6;

export const ENEMY_BULLET_WIDTH = 4;
export const ENEMY_BULLET_HEIGHT = 12;
export const ENEMY_BULLET_SPEED = 3.7;
export const ENEMY_BULLET_SPEED_MAX = 5.25;
export const ENEMY_BULLET_SPEED_MAX_WAVE = 10;

export const INVADER_ROWS = 4;
export const INVADER_COLUMNS = 9;
export const INVADER_WIDTH = 34;
export const INVADER_HEIGHT = 24;
export const INVADER_GAP_X = 20;
export const INVADER_GAP_Y = 18;

export const INVADER_START_X = 56;
export const INVADER_START_Y = 34;

export const INVADER_BASE_SPEED = 0.42;
export const INVADER_SPEED_STEP = 0.1;
export const INVADER_SPEED_CYCLE_LENGTH = 5;
export const INVADER_DROP_DISTANCE = 14;
export const INVADER_SHOOT_CHANCE = 0.0075;
export const INVADER_SHOOT_CHANCE_STEP = 0.00175;
export const INVADER_SHOOT_CHANCE_MAX = 0.023;
export const INVADER_SHOOT_CHANCE_MAX_WAVE = 10;

export const PLAYER_LIVES = 3;
export const PLAYER_MAX_LIVES = 6;

export const POINTS_PER_INVADER = 25;
export const WAVE_CLEAR_BONUS = 150;

// Boss.
// O primeiro boss aparece na onda 5.
// Ele precisa ser desafiador, mas ainda justo por ser o primeiro chefão.
export const BOSS_WAVE_INTERVAL = 5;
export const FINAL_WAVE = 25;
export const BOSS_WIDTH = 154;
export const BOSS_HEIGHT = 72;
export const BOSS_START_Y = 42;
export const BOSS_MAX_HEALTH = 680;
export const BOSS_MOVE_SPEED = 1.25;
export const BOSS_POINTS = 800;
export const BOSS_BULLET_SPEED = 3.55;
export const BOSS_ATTACK_INTERVAL_MS = 1120;
export const BOSS_BURST_INTERVAL_MS = 230;
export const BOSS_ATTACK_REST_TIME_MS = 420;
export const BOSS_AIM_ERROR_RANGE = 58;
export const BOSS_RAIN_BULLET_COUNT = 6;

// Segundo boss.
export const SECOND_BOSS_WIDTH = 178;
export const SECOND_BOSS_HEIGHT = 84;
export const SECOND_BOSS_START_Y = 36;
export const SECOND_BOSS_MAX_HEALTH = 1180;
export const SECOND_BOSS_MOVE_SPEED = 1.55;
export const SECOND_BOSS_POINTS = 1400;
export const SECOND_BOSS_BULLET_SPEED = 4.08;
export const SECOND_BOSS_ATTACK_INTERVAL_MS = 900;
export const SECOND_BOSS_ATTACK_REST_TIME_MS = 280;
export const SECOND_BOSS_AIM_ERROR_RANGE = 42;
export const SECOND_BOSS_RAIN_BULLET_COUNT = 8;

// Terceiro boss.
// Onda 15: mais pressao lateral e ataques em espiral leve.
export const THIRD_BOSS_WIDTH = 190;
export const THIRD_BOSS_HEIGHT = 92;
export const THIRD_BOSS_START_Y = 32;
export const THIRD_BOSS_MAX_HEALTH = 1580;
export const THIRD_BOSS_MOVE_SPEED = 1.72;
export const THIRD_BOSS_POINTS = 2100;
export const THIRD_BOSS_BULLET_SPEED = 4.32;
export const THIRD_BOSS_ATTACK_INTERVAL_MS = 830;
export const THIRD_BOSS_ATTACK_REST_TIME_MS = 250;
export const THIRD_BOSS_AIM_ERROR_RANGE = 34;
export const THIRD_BOSS_RAIN_BULLET_COUNT = 9;

// Quarto boss.
// Onda 20: boss pesado, com ataques em parede e chuva mais organizada.
export const FOURTH_BOSS_WIDTH = 206;
export const FOURTH_BOSS_HEIGHT = 98;
export const FOURTH_BOSS_START_Y = 30;
export const FOURTH_BOSS_MAX_HEALTH = 2200;
export const FOURTH_BOSS_MOVE_SPEED = 1.88;
export const FOURTH_BOSS_POINTS = 3000;
export const FOURTH_BOSS_BULLET_SPEED = 4.58;
export const FOURTH_BOSS_ATTACK_INTERVAL_MS = 760;
export const FOURTH_BOSS_ATTACK_REST_TIME_MS = 220;
export const FOURTH_BOSS_AIM_ERROR_RANGE = 28;
export const FOURTH_BOSS_RAIN_BULLET_COUNT = 10;

// Boss final.
// Onda 25: encerra a partida, mais denso e variado sem virar bullet hell puro.
export const FINAL_BOSS_WIDTH = 222;
export const FINAL_BOSS_HEIGHT = 108;
export const FINAL_BOSS_START_Y = 24;
export const FINAL_BOSS_MAX_HEALTH = 3000;
export const FINAL_BOSS_MOVE_SPEED = 2.02;
export const FINAL_BOSS_POINTS = 4500;
export const FINAL_BOSS_BULLET_SPEED = 4.42;
export const FINAL_BOSS_ATTACK_INTERVAL_MS = 880;
export const FINAL_BOSS_ATTACK_REST_TIME_MS = 260;
export const FINAL_BOSS_AIM_ERROR_RANGE = 36;
export const FINAL_BOSS_RAIN_BULLET_COUNT = 8;

// Poder Laser.
// O laser fica ativo por pouco tempo, mas destrói tudo dentro da largura dele.
export const LASER_POWER_COOLDOWN_MS = 10000;
export const LASER_POWER_DURATION_MS = 720;
export const LASER_POWER_MAX_WIDTH = 78;
export const LASER_BOSS_DAMAGE_PER_FRAME = 5;

// Poder da nave de suporte.
// Ela entra no campo, acompanha a batalha por alguns segundos e depois some.
export const SUPPORT_SHIP_COOLDOWN_MS = 10000;
export const SUPPORT_SHIP_DURATION_MS = 8000;
export const SUPPORT_SHIP_WIDTH = 36;
export const SUPPORT_SHIP_HEIGHT = 20;
export const SUPPORT_SHIP_SHOOT_INTERVAL_MS = 600;
export const SUPPORT_SHIP_MOVE_INTERVAL_MS = 650;

// Poder Escudo.
// O escudo fica ativo até receber dois ataques.
// Depois de quebrar, entra em recarga.
export const SHIELD_POWER_COOLDOWN_MS = 5000;
export const SHIELD_POWER_MAX_HITS = 2;

// Modo de teste.
// Deixe true só enquanto estiver testando boss.
// Antes de fazer commit final, volte para false.
export const DEBUG_START_ON_BOSS_WAVE = true;

// Escolha qual boss você quer testar.
// 5 = boss da onda 5.
// 10 = boss da onda 10.
// 15, 20 e 25 testam os bosses finais.
export const DEBUG_BOSS_WAVE = 20;

// Caso queira forçar uma quantidade específica de vidas no debug,
// coloque um número aqui.
// Se deixar null, o jogo usa DEBUG_PLAYER_LIVES_BY_BOSS_WAVE.
export const DEBUG_PLAYER_LIVES_OVERRIDE: number | null = null;

// Vidas automáticas por boss no modo debug.
// Isso não precisa seguir o limite normal de 6 vidas,
// porque é só para teste.
export const DEBUG_PLAYER_LIVES_BY_BOSS_WAVE: Record<number, number> = {
  5: 4,
  10: 10,
  15: 12,
  20: 14,
  25: 16,
};
