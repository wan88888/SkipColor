var G = GameGlobal;

function spawnBeamParticles(startX, startY, endX, endY, color) {
  if (!G.settings.particleEnabled) return;
  var steps = 8;
  for (var i = 0; i <= steps; i++) {
    var t = i / steps;
    G.particles.push({
      x: startX + (endX - startX) * t,
      y: startY + (endY - startY) * t,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      life: 1,
      decay: 0.05,
      size: 3 + Math.random() * 2,
      color: color || G.CONFIG.cellFilled
    });
  }
}

function spawnFillBurst(x, y, color) {
  if (!G.settings.particleEnabled) return;
  var count = 12;
  for (var i = 0; i < count; i++) {
    var angle = (Math.PI * 2 * i) / count;
    var speed = 1 + Math.random() * 2;
    G.particles.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.04,
      size: 2 + Math.random() * 3,
      color: color || G.CONFIG.cellFilled
    });
  }
}

function spawnIceBreak(x, y) {
  if (!G.settings.particleEnabled) return;
  var count = 16;
  for (var i = 0; i < count; i++) {
    var angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    var speed = 2 + Math.random() * 3;
    G.particles.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.03,
      size: 2 + Math.random() * 4,
      color: G.CONFIG.iceHp2
    });
  }
}

function spawnCelebration() {
  if (!G.settings.particleEnabled) return;
  G.celebrating = true;
  G.celebrationTimer = 60;
  var cx = G.W / 2;
  var cy = G.H / 2;
  var colors = [G.CONFIG.cellFilled, G.CONFIG.accentColor, G.CONFIG.cellNumber, '#ffd700', '#ff6b6b'];
  for (var i = 0; i < 80; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 2 + Math.random() * 5;
    G.particles.push({
      x: cx + (Math.random() - 0.5) * 100,
      y: cy + (Math.random() - 0.5) * 100,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      decay: 0.015,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.1
    });
  }
}

function update() {
  var alive = [];
  for (var i = 0; i < G.particles.length; i++) {
    var p = G.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.life -= p.decay;
    if (p.life > 0) alive.push(p);
  }
  G.particles = alive;

  if (G.celebrating) {
    G.celebrationTimer--;
    if (G.celebrationTimer <= 0) G.celebrating = false;
    G.markDirty();
  }

  if (G.particles.length > 0) G.markDirty();
}

function render(ctx) {
  for (var i = 0; i < G.particles.length; i++) {
    var p = G.particles[i];
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (G.celebrating) {
    var cx = G.W / 2;
    var cy = G.H / 2;
    var scale = 1 + (60 - G.celebrationTimer) * 0.01;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    var text = '🎉 通关！';
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
}

module.exports = {
  spawnBeamParticles: spawnBeamParticles,
  spawnFillBurst: spawnFillBurst,
  spawnIceBreak: spawnIceBreak,
  spawnCelebration: spawnCelebration,
  update: update,
  render: render
};
