
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Entity, Bullet, Particle, Vector, EntityType, Upgrades } from './types';
import { GAME_CONSTANTS } from './constants';
import { gemini } from './services/geminiService';
import HUD from './components/HUD';
import Menu from './components/Menu';
import GameOver from './components/GameOver';
import UpgradeShop from './components/UpgradeShop';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    coins: 0,
    wave: 1,
    health: GAME_CONSTANTS.BASE_PLAYER_MAX_HEALTH,
    maxHealth: GAME_CONSTANTS.BASE_PLAYER_MAX_HEALTH,
    isPlaying: false,
    isGameOver: false,
    isShopOpen: false,
    briefing: 'Awaiting Orders...',
    isBriefingLoading: false,
    upgrades: {
      fireRate: 0,
      speed: 0,
      damage: 0,
      maxHealth: 0
    }
  });

  const engineRef = useRef<{
    entities: Entity[];
    bullets: Bullet[];
    particles: Particle[];
    player: Entity;
    keys: Set<string>;
    lastShot: number;
    bgOffset: number;
    stars: {x: number, y: number, s: number, a: number}[];
  }>({
    entities: [],
    bullets: [],
    particles: [],
    player: {
      id: 'player',
      type: 'PLAYER',
      pos: { x: window.innerWidth / 2, y: window.innerHeight - 150 },
      vel: { x: 0, y: 0 },
      radius: GAME_CONSTANTS.BASE_PLAYER_RADIUS,
      health: GAME_CONSTANTS.BASE_PLAYER_MAX_HEALTH,
      maxHealth: GAME_CONSTANTS.BASE_PLAYER_MAX_HEALTH,
      angle: -Math.PI / 2,
      color: GAME_CONSTANTS.COLORS.PLAYER,
      isDead: false
    },
    keys: new Set(),
    lastShot: 0,
    bgOffset: 0,
    stars: Array.from({ length: 100 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      s: Math.random() * 2 + 1,
      a: Math.random()
    }))
  });

  const requestBriefing = async (wave: number, score: number) => {
    setGameState(prev => ({ ...prev, isBriefingLoading: true }));
    const msg = await gemini.getMissionBriefing(wave, score);
    setGameState(prev => ({ ...prev, briefing: msg, isBriefingLoading: false }));
  };

  const spawnExplosion = (pos: Vector, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      engineRef.current.particles.push({
        id: Math.random().toString(),
        type: 'PARTICLE',
        pos: { ...pos },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        radius: Math.random() * 4 + 1,
        health: 1,
        maxHealth: 1,
        angle: 0,
        color: color,
        isDead: false,
        life: 1,
        maxLife: 1,
        opacity: 1
      } as Particle);
    }
    // Spawn coins
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      engineRef.current.entities.push({
        id: Math.random().toString(),
        type: 'COIN',
        pos: { ...pos },
        vel: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 },
        radius: 8,
        health: 1,
        maxHealth: 1,
        angle: 0,
        color: GAME_CONSTANTS.COLORS.COIN,
        isDead: false
      });
    }
  };

  const handleUpgrade = (type: keyof Upgrades) => {
    const cost = GAME_CONSTANTS.UPGRADE_BASE_COST * (gameState.upgrades[type] + 1);
    if (gameState.coins >= cost) {
      setGameState(prev => {
        const nextUpgrades = { ...prev.upgrades, [type]: prev.upgrades[type] + 1 };
        let nextMaxHealth = prev.maxHealth;
        let nextCurrentHealth = prev.health;
        
        if (type === 'maxHealth') {
          nextMaxHealth += 25;
          nextCurrentHealth += 25;
          engineRef.current.player.maxHealth = nextMaxHealth;
          engineRef.current.player.health = nextCurrentHealth;
        }
        
        return {
          ...prev,
          coins: prev.coins - cost,
          upgrades: nextUpgrades,
          maxHealth: nextMaxHealth,
          health: nextCurrentHealth
        };
      });
    }
  };

  const startGame = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      engineRef.current.player.pos = { x: canvas.width / 2, y: canvas.height - 150 };
    }
    engineRef.current.player.health = GAME_CONSTANTS.BASE_PLAYER_MAX_HEALTH;
    engineRef.current.player.maxHealth = GAME_CONSTANTS.BASE_PLAYER_MAX_HEALTH;
    engineRef.current.entities = [];
    engineRef.current.bullets = [];
    engineRef.current.particles = [];
    setGameState({
      score: 0,
      coins: 0,
      wave: 1,
      health: GAME_CONSTANTS.BASE_PLAYER_MAX_HEALTH,
      maxHealth: GAME_CONSTANTS.BASE_PLAYER_MAX_HEALTH,
      isPlaying: true,
      isGameOver: false,
      isShopOpen: false,
      briefing: 'Initializing...',
      isBriefingLoading: false,
      upgrades: { fireRate: 0, speed: 0, damage: 0, maxHealth: 0 }
    });
    requestBriefing(1, 0);
  };

  const update = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const { player, keys, entities, bullets, particles } = engineRef.current;
    const { upgrades } = gameState;

    // Movement logic (Keyboard)
    const moveSpeed = GAME_CONSTANTS.BASE_PLAYER_SPEED + (upgrades.speed * 0.8);
    if (keys.has('ArrowUp') || keys.has('w')) player.pos.y -= moveSpeed;
    if (keys.has('ArrowDown') || keys.has('s')) player.pos.y += moveSpeed;
    if (keys.has('ArrowLeft') || keys.has('a')) player.pos.x -= moveSpeed;
    if (keys.has('ArrowRight') || keys.has('d')) player.pos.x += moveSpeed;

    // Boundary check
    player.pos.x = Math.max(player.radius, Math.min(ctx.canvas.width - player.radius, player.pos.x));
    player.pos.y = Math.max(player.radius, Math.min(ctx.canvas.height - player.radius, player.pos.y));

    // Auto-Shooting
    const fireInterval = Math.max(80, GAME_CONSTANTS.BASE_FIRE_RATE - (upgrades.fireRate * 20));
    if (time - engineRef.current.lastShot > fireInterval) {
      const damage = GAME_CONSTANTS.BASE_DAMAGE + (upgrades.damage * 5);
      bullets.push({
        id: Math.random().toString(),
        type: 'BULLET',
        pos: { x: player.pos.x, y: player.pos.y - 25 },
        vel: { x: 0, y: -GAME_CONSTANTS.BASE_BULLET_SPEED },
        radius: 4,
        health: 1,
        maxHealth: 1,
        angle: 0,
        color: GAME_CONSTANTS.COLORS.BULLET_PLAYER,
        isDead: false,
        owner: 'PLAYER',
        damage: damage
      });
      engineRef.current.lastShot = time;
    }

    // Spawning Enemies
    if (Math.random() < GAME_CONSTANTS.ENEMY_SPAWN_RATE) {
      const x = Math.random() * ctx.canvas.width;
      entities.push({
        id: Math.random().toString(),
        type: 'SCOUT',
        pos: { x, y: -50 },
        vel: { x: (Math.random() - 0.5) * 4, y: Math.random() * 2 + 2 },
        radius: 18,
        health: 20 + (gameState.wave * 10),
        maxHealth: 20 + (gameState.wave * 10),
        angle: Math.PI / 2,
        color: GAME_CONSTANTS.COLORS.SCOUT,
        isDead: false,
        scoreValue: 100
      });
    }

    if (Math.random() < GAME_CONSTANTS.TANK_SPAWN_RATE) {
      const x = Math.random() * ctx.canvas.width;
      entities.push({
        id: Math.random().toString(),
        type: 'TANK',
        pos: { x, y: -50 },
        vel: { x: 0, y: 1 },
        radius: 25,
        health: 60 + (gameState.wave * 20),
        maxHealth: 60 + (gameState.wave * 20),
        angle: Math.PI / 2,
        color: GAME_CONSTANTS.COLORS.TANK,
        isDead: false,
        scoreValue: 300
      });
    }

    // Update Entities
    entities.forEach(e => {
      e.pos.x += e.vel.x;
      e.pos.y += e.vel.y;

      if (e.type === 'COIN') {
        const dx = player.pos.x - e.pos.x;
        const dy = player.pos.y - e.pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 150) { // Attraction
          e.vel.x += dx / 100;
          e.vel.y += dy / 100;
        }
        if (dist < player.radius + e.radius) {
          e.isDead = true;
          setGameState(prev => ({ ...prev, coins: prev.coins + 1 }));
        }
        e.vel.x *= 0.95;
        e.vel.y *= 0.95;
      }

      if (e.type === 'TANK' && Math.random() < 0.015) {
        bullets.push({
          id: Math.random().toString(),
          type: 'BULLET',
          pos: { x: e.pos.x, y: e.pos.y },
          vel: { x: 0, y: 6 },
          radius: 5,
          health: 1,
          maxHealth: 1,
          angle: 0,
          color: GAME_CONSTANTS.COLORS.BULLET_ENEMY,
          isDead: false,
          owner: 'ENEMY',
          damage: 20
        });
      }

      if (e.pos.y > ctx.canvas.height + 100) e.isDead = true;
    });

    // Update Bullets
    bullets.forEach(b => {
      b.pos.x += b.vel.x;
      b.pos.y += b.vel.y;
      if (b.pos.y < -50 || b.pos.y > ctx.canvas.height + 50) b.isDead = true;

      if (b.owner === 'PLAYER') {
        entities.forEach(e => {
          if (e.type === 'COIN') return;
          const dist = Math.sqrt((b.pos.x - e.pos.x)**2 + (b.pos.y - e.pos.y)**2);
          if (dist < b.radius + e.radius) {
            e.health -= b.damage;
            b.isDead = true;
            if (e.health <= 0) {
              e.isDead = true;
              setGameState(prev => ({ ...prev, score: prev.score + (e.scoreValue || 0) }));
              spawnExplosion(e.pos, e.color);
            }
          }
        });
      } else {
        const dist = Math.sqrt((b.pos.x - player.pos.x)**2 + (b.pos.y - player.pos.y)**2);
        if (dist < b.radius + player.radius) {
          player.health -= b.damage;
          b.isDead = true;
          setGameState(prev => ({ ...prev, health: Math.max(0, player.health) }));
          spawnExplosion(player.pos, player.color, 5);
          if (player.health <= 0) {
            setGameState(prev => ({ ...prev, isGameOver: true, isPlaying: false }));
          }
        }
      }
    });

    particles.forEach(p => {
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.life -= 0.02;
      p.opacity = p.life;
      if (p.life <= 0) p.isDead = true;
    });

    engineRef.current.entities = entities.filter(e => !e.isDead);
    engineRef.current.bullets = bullets.filter(b => !b.isDead);
    engineRef.current.particles = particles.filter(p => !p.isDead);
    engineRef.current.bgOffset = (engineRef.current.bgOffset + 2) % 2000;
  }, [gameState.wave, gameState.coins, gameState.upgrades]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { player, entities, bullets, particles, bgOffset, stars } = engineRef.current;
    
    // Clear with Gradient
    const bgGrad = ctx.createRadialGradient(ctx.canvas.width/2, ctx.canvas.height/2, 0, ctx.canvas.width/2, ctx.canvas.height/2, ctx.canvas.width);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Stars
    stars.forEach(s => {
      s.y = (s.y + s.s * 0.5) % ctx.canvas.height;
      ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });

    // Parallax Grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < ctx.canvas.width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }
    for (let y = (bgOffset % 100); y < ctx.canvas.height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }

    // Draw Entities (Coins & Enemies)
    entities.forEach(e => {
      if (e.type === 'COIN') {
        ctx.fillStyle = e.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        ctx.beginPath();
        ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Inner detail
        ctx.fillStyle = 'white';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', e.pos.x, e.pos.y + 3);
      } else if (e.type === 'TANK') {
        // Advanced Tank Graphics
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(e.pos.x - 25, e.pos.y - 20, 50, 40);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.pos.x - 20, e.pos.y - 15, 40, 30);
        // Turret
        ctx.fillStyle = '#475569';
        ctx.fillRect(e.pos.x - 8, e.pos.y + 5, 16, 20);
        ctx.beginPath();
        ctx.arc(e.pos.x, e.pos.y, 12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Advanced Scout Graphics
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(e.pos.x, e.pos.y + 25);
        ctx.lineTo(e.pos.x - 20, e.pos.y - 15);
        ctx.lineTo(e.pos.x, e.pos.y - 5);
        ctx.lineTo(e.pos.x + 20, e.pos.y - 15);
        ctx.closePath();
        ctx.fill();
        // Glow core
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(e.pos.x, e.pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (e.health < e.maxHealth && e.type !== 'COIN') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(e.pos.x - 20, e.pos.y - 40, 40, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.pos.x - 20, e.pos.y - 40, 40 * (e.health / e.maxHealth), 6);
      }
    });

    // Bullets
    bullets.forEach(b => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, b.radius/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Particles
    particles.forEach(p => {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player with better graphics
    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);
    
    // Engine glow
    const engineGlow = ctx.createRadialGradient(0, 15, 0, 0, 15, 20);
    engineGlow.addColorStop(0, '#fde047');
    engineGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.arc(0, 15 + Math.random() * 5, 10, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.shadowBlur = 20;
    ctx.shadowColor = GAME_CONSTANTS.COLORS.PLAYER_GLOW;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-25, 20);
    ctx.lineTo(0, 5);
    ctx.lineTo(25, 20);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.ellipse(0, -10, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(-2, -14, 2, 4, Math.PI/4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const handleKeyDown = (e: KeyboardEvent) => engineRef.current.keys.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => engineRef.current.keys.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    const loop = (time: number) => {
      if (gameState.isPlaying && !gameState.isGameOver && !gameState.isShopOpen) {
        update(ctx, time);
      }
      draw(ctx);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPlaying, gameState.isGameOver, gameState.isShopOpen, update, draw]);

  useEffect(() => {
    if (gameState.score > 0 && gameState.score % 2000 === 0) {
      setGameState(prev => ({ ...prev, wave: prev.wave + 1, isShopOpen: true }));
      requestBriefing(gameState.wave + 1, gameState.score);
    }
  }, [gameState.score]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      {gameState.isPlaying && <HUD state={gameState} />}
      {!gameState.isPlaying && !gameState.isGameOver && <Menu onStart={startGame} />}
      {gameState.isGameOver && <GameOver score={gameState.score} onRestart={startGame} />}
      
      {gameState.isShopOpen && (
        <UpgradeShop 
          state={gameState} 
          onUpgrade={handleUpgrade} 
          onClose={() => setGameState(prev => ({ ...prev, isShopOpen: false }))} 
        />
      )}

      {/* Shop Trigger Button */}
      {gameState.isPlaying && !gameState.isShopOpen && (
        <button 
          onClick={() => setGameState(prev => ({ ...prev, isShopOpen: true }))}
          className="absolute bottom-24 right-6 bg-slate-900/80 backdrop-blur border border-sky-500/50 p-4 rounded-2xl text-white font-bold hover:bg-sky-600 transition-all z-40 group"
        >
          <div className="text-[10px] text-sky-400 uppercase tracking-widest mb-1 group-hover:text-white">Upgrade Station</div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>SHOP</span>
          </div>
        </button>
      )}
      
      {gameState.isPlaying && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-none z-10 transition-opacity duration-500">
          <div className="bg-black/40 backdrop-blur-md border border-sky-500/30 p-3 rounded-lg animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-ping" />
              <span className="text-[10px] font-bold text-sky-400 tracking-widest uppercase">Gemini Tactical Intelligence</span>
            </div>
            <p className="text-sm text-slate-100 font-mono italic leading-tight">
              {gameState.isBriefingLoading ? 'Analyzing sector data...' : `> ${gameState.briefing}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
