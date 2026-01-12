
export type EntityType = 'PLAYER' | 'SCOUT' | 'BOMBER' | 'TANK' | 'BULLET' | 'PARTICLE' | 'COIN';

export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector;
  vel: Vector;
  radius: number;
  health: number;
  maxHealth: number;
  angle: number;
  color: string;
  isDead: boolean;
  scoreValue?: number;
}

export interface Bullet extends Entity {
  owner: 'PLAYER' | 'ENEMY';
  damage: number;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  opacity: number;
}

export interface Upgrades {
  fireRate: number;
  speed: number;
  damage: number;
  maxHealth: number;
}

export interface GameState {
  score: number;
  coins: number;
  wave: number;
  health: number;
  maxHealth: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isShopOpen: boolean;
  briefing: string;
  isBriefingLoading: boolean;
  upgrades: Upgrades;
}
