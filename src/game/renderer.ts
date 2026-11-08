/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimulationState, StoneSkin, TerrainType, WeatherCondition } from './types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  startSize: number;
  endSize: number;
  currentSize: number;
  color: string;
  alphaMultiplier: number;
  drag: number;
  gravityY: number;
  active: boolean;
  type: 'dust' | 'pebble' | 'spark';
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particlePool: Particle[] = [];
  private readonly maxParticles = 180;
  private cameraShakeTrauma: number = 0;
  private emberTimer: number = 0;
  private rollingDustAccumulator: number = 0;
  private footstepDustAccumulator: number = 0;
  private weatherTimer: number = 0;
  private lightningFlash: number = 0;
  private nextLightningTime: number = 4.0;
  private onThunderCallback?: () => void;

  public setThunderCallback(cb: () => void): void {
    this.onThunderCallback = cb;
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = context;

    // Pre-allocate zero-GC particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        startSize: 2,
        endSize: 6,
        currentSize: 2,
        color: '#ffffff',
        alphaMultiplier: 0.6,
        drag: 0.95,
        gravityY: 40,
        active: false,
        type: 'dust',
      });
    }
  }

  public resize(width: number, height: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public triggerShake(amount: number = 0.3): void {
    this.cameraShakeTrauma = Math.min(1.0, this.cameraShakeTrauma + amount);
  }

  public spawnBurstParticles(x: number, y: number, count: number, color: string): void {
    let spawned = 0;
    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      const p = this.particlePool[i];
      if (!p.active) {
        p.active = true;
        p.type = 'spark';
        p.x = x + (Math.random() * 8 - 4);
        p.y = y + (Math.random() * 8 - 4);
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 90;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.maxLife = 0.25 + Math.random() * 0.35;
        p.life = p.maxLife;
        p.startSize = 2.0 + Math.random() * 2.0;
        p.endSize = 0.5;
        p.currentSize = p.startSize;
        p.alphaMultiplier = 0.85;
        p.drag = 0.94;
        p.gravityY = 60;
        p.color = color;
        spawned++;
      }
    }
  }

  /**
   * Emits billowing ground dust and grit pebbles as the rock rolls along the slope.
   * Particles are ejected opposite to motion direction with air drag and radial cloud expansion.
   */
  public emitRollingDust(
    contactX: number,
    contactY: number,
    dirX: number,
    dirY: number,
    normX: number,
    normY: number,
    velocity: number,
    terrain: TerrainType,
    dt: number
  ): void {
    const rollSpeed = Math.abs(velocity);
    if (rollSpeed < 0.1) return;

    // Accumulate emission budget proportional to rolling speed
    this.rollingDustAccumulator += Math.min(rollSpeed, 20) * dt * 28;

    const rollDir = Math.sign(velocity); // +1 uphill, -1 downhill

    while (this.rollingDustAccumulator >= 1.0) {
      this.rollingDustAccumulator -= 1.0;

      // Find inactive particle in pool
      for (let i = 0; i < this.maxParticles; i++) {
        const p = this.particlePool[i];
        if (!p.active) {
          p.active = true;

          const isPebble = Math.random() < 0.2;
          p.type = isPebble ? 'pebble' : 'dust';

          // Emit near contact patch with slight lateral jitter
          const tangentOffset = (Math.random() * 14 - 7);
          p.x = contactX + dirX * tangentOffset;
          p.y = contactY + dirY * tangentOffset;

          // Eject velocity: opposite to rolling direction along slope + lift into the air
          const kickSpeed = (12 + Math.random() * 32) * Math.min(2.0, 0.6 + rollSpeed * 0.15);
          // Tangent component (backwards relative to roll)
          const kickX = -rollDir * dirX * kickSpeed;
          const kickY = -rollDir * dirY * kickSpeed;
          // Normal lift away from ground surface
          const liftSpeed = 8 + Math.random() * 20;
          const liftX = -normX * liftSpeed;
          const liftY = -normY * liftSpeed;

          // Add slight turbulence
          const turbulenceX = (Math.random() * 12 - 6);
          const turbulenceY = (Math.random() * 12 - 6);

          p.vx = kickX + liftX + turbulenceX;
          p.vy = kickY + liftY + turbulenceY;

          if (isPebble) {
            p.maxLife = 0.28 + Math.random() * 0.2;
            p.life = p.maxLife;
            p.startSize = 1.6 + Math.random() * 1.4;
            p.endSize = p.startSize;
            p.currentSize = p.startSize;
            p.alphaMultiplier = 0.75;
            p.drag = 0.98;
            p.gravityY = 160; // falls fast
            p.color = terrain.groundAccentColor;
          } else {
            // Billowing dust puff: expands as it fades into air
            p.maxLife = 0.4 + Math.random() * 0.4;
            p.life = p.maxLife;
            p.startSize = 2.2 + Math.random() * 2.0;
            p.endSize = 7.5 + Math.random() * 6.5;
            p.currentSize = p.startSize;
            p.alphaMultiplier = 0.45 + Math.random() * 0.2;
            p.drag = 0.91; // air drag
            p.gravityY = 18; // gentle float
            // Subtle color nuance
            p.color = Math.random() < 0.6 ? terrain.groundAccentColor : terrain.groundColor;
          }
          break;
        }
      }
    }
  }

  public updateParticles(dt: number): void {
    const clampedDt = Math.min(dt, 0.05);

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlePool[i];
      if (p.active) {
        p.life -= clampedDt;
        if (p.life <= 0) {
          p.active = false;
        } else {
          // Apply air drag damping
          const dragCoeff = Math.pow(p.drag, clampedDt * 60);
          p.vx *= dragCoeff;
          p.vy *= dragCoeff;
          // Apply gravity
          p.vy += p.gravityY * clampedDt;
          // Integrate position
          p.x += p.vx * clampedDt;
          p.y += p.vy * clampedDt;

          // Expand / contract size along life curve
          const progress = 1 - Math.max(0, p.life / p.maxLife);
          p.currentSize = p.startSize + (p.endSize - p.startSize) * progress;
        }
      }
    }
    // Decay camera trauma
    this.cameraShakeTrauma = Math.max(0, this.cameraShakeTrauma - clampedDt * 2.2);
  }

  /**
   * Main Render Pass:
   * Test 3 Assurance:
   * - Hill slope is rendered relative to camera viewport anchor (Sisyphus & Boulder).
   * - Infinite modulo parallax prevents mathematical runaway or precision degradation.
   * - Continuous coordinate mapping ensures zero clipping or pop-in.
   */
  public render(
    state: SimulationState,
    skin: StoneSkin,
    terrain: TerrainType,
    inputsPerSec: number,
    dt: number,
    weather?: WeatherCondition
  ): void {
    const width = parseFloat(this.canvas.style.width) || this.canvas.width;
    const height = parseFloat(this.canvas.style.height) || this.canvas.height;
    const ctx = this.ctx;

    this.weatherTimer += dt;

    // Process Storm Lightning
    if (weather?.id === 'storm') {
      this.nextLightningTime -= dt;
      if (this.nextLightningTime <= 0) {
        this.lightningFlash = 0.95;
        this.triggerShake(0.5);
        this.onThunderCallback?.();
        this.nextLightningTime = 3.5 + Math.random() * 4.0;
      }
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.0);
    }

    // Apply Camera Shake
    ctx.save();
    if (this.cameraShakeTrauma > 0) {
      const shakeMag = Math.pow(this.cameraShakeTrauma, 2) * 8;
      const shakeX = (Math.random() * 2 - 1) * shakeMag;
      const shakeY = (Math.random() * 2 - 1) * shakeMag;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Sky & Tartarus Backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, terrain.skyGradient[0]);
    skyGrad.addColorStop(1, terrain.skyGradient[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Weather sky ambiance & lightning flash
    this.renderWeatherSky(ctx, width, height, weather);

    // Dynamic rising embers for underworld atmosphere
    this.renderEmbers(ctx, width, height, dt, terrain);

    // Slope parameters: dynamically steepens with altitude
    const effectiveSlopeAngleDeg = state.currentSlopeAngleDeg || terrain.slopeAngleDeg;
    const slopeAngleRad = (effectiveSlopeAngleDeg * Math.PI) / 180;
    // Boulder & Sisyphus fixed camera center anchor
    const anchorX = width * 0.44;
    const anchorY = height * 0.62;

    // Incline unit vectors (uphill along slope)
    const dirX = Math.cos(slopeAngleRad);
    const dirY = -Math.sin(slopeAngleRad);
    const normX = Math.sin(slopeAngleRad);
    const normY = Math.cos(slopeAngleRad);

    // 2. Parallax Distant Mountain Peaks (scrolls at 12% speed)
    this.renderDistantMountains(ctx, width, height, state.distance, terrain);

    // 3. Midground Crags & Jagged Spires (scrolls at 35% speed)
    this.renderMidgroundCrags(ctx, width, height, state.distance, terrain);

    // 4. Incline Ground Surface & Mile Markers
    this.renderGroundSlope(
      ctx,
      width,
      height,
      anchorX,
      anchorY,
      dirX,
      dirY,
      normX,
      normY,
      state.distance,
      terrain,
      effectiveSlopeAngleDeg
    );

    // Boulder contact point on the slope
    const stoneRadius = 38;
    const stoneCenterDist = stoneRadius; // Distance above ground along normal
    const stoneCenterX = anchorX + normX * -stoneCenterDist;
    const stoneCenterY = anchorY + normY * -stoneCenterDist;

    // 5. Draw Sisyphus (behind the boulder, pushing against it)
    this.renderSisyphus(
      ctx,
      anchorX,
      anchorY,
      dirX,
      dirY,
      normX,
      normY,
      stoneRadius,
      state.velocity,
      inputsPerSec
    );

    // 6. Draw The Boulder (with active skin & exact rotation)
    this.renderBoulder(ctx, stoneCenterX, stoneCenterY, stoneRadius, state.stoneAngle, skin, state.velocity);

    // 7. Ground contact rolling dust & friction particles
    const contactX = anchorX;
    const contactY = anchorY;

    this.emitRollingDust(
      contactX,
      contactY,
      dirX,
      dirY,
      normX,
      normY,
      state.velocity,
      terrain,
      dt
    );

    if (state.activeInputBurstCount > 0) {
      this.spawnBurstParticles(contactX, contactY - 8, state.activeInputBurstCount * 2, skin.accentColor);
    }

    // 8. Render Particles
    this.renderParticles(ctx);

    // 9. Foreground Weather Atmosphere (Mist, falling stones, rain streaks, updraft)
    if (weather) {
      this.renderWeatherForeground(ctx, width, height, dt, weather, dirX, dirY, normX, normY, anchorX, anchorY);
    }

    ctx.restore();
  }

  private renderWeatherSky(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    weather?: WeatherCondition
  ): void {
    if (!weather) return;

    ctx.save();
    if (weather.id === 'storm') {
      // Dark thundercloud horizon
      const cloudGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
      cloudGrad.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
      cloudGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = cloudGrad;
      ctx.fillRect(0, 0, width, height * 0.5);

      // Lightning screen flash
      if (this.lightningFlash > 0.02) {
        ctx.fillStyle = `rgba(224, 242, 254, ${this.lightningFlash * 0.38})`;
        ctx.fillRect(0, 0, width, height);
      }
    } else if (weather.id === 'fog') {
      // Atmospheric background mist blanket
      const mistGrad = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.8);
      mistGrad.addColorStop(0, 'rgba(148, 163, 184, 0.08)');
      mistGrad.addColorStop(0.5, 'rgba(203, 213, 225, 0.18)');
      mistGrad.addColorStop(1, 'rgba(148, 163, 184, 0.05)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (weather.id === 'zephyr') {
      // Golden divine rays in sky
      const rayGrad = ctx.createLinearGradient(width * 0.2, 0, width * 0.8, height);
      rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.12)');
      rayGrad.addColorStop(0.6, 'rgba(234, 179, 8, 0.04)');
      rayGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rayGrad;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  private renderWeatherForeground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dt: number,
    weather: WeatherCondition,
    dirX: number,
    dirY: number,
    normX: number,
    normY: number,
    anchorX: number,
    anchorY: number
  ): void {
    ctx.save();
    const t = this.weatherTimer;

    switch (weather.id) {
      case 'storm': {
        // Driving underworld storm rain / electrical streaks slanted along headwind
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.32)';
        ctx.lineWidth = 1.4;
        const numDrops = 36;
        for (let i = 0; i < numDrops; i++) {
          const speed = 650 + (i % 6) * 70;
          const offset = (i * 137.5) % width;
          const dropY = ((t * speed + i * 45) % (height + 100)) - 50;
          // Slanted along headwind (downhill)
          const dropX = (offset + dropY * 0.45) % (width + 100) - 50;
          const length = 22 + (i % 4) * 8;

          ctx.beginPath();
          ctx.moveTo(dropX, dropY);
          ctx.lineTo(dropX - dirX * length * 0.6, dropY - dirY * length * 0.6);
          ctx.stroke();
        }
        break;
      }
      case 'fog': {
        // Volumetric drifting mist banks
        ctx.fillStyle = 'rgba(226, 232, 240, 0.09)';
        for (let b = 0; b < 3; b++) {
          const baseY = height * (0.35 + b * 0.22);
          const drift = (t * (18 + b * 10)) % (width * 1.5);
          ctx.beginPath();
          ctx.moveTo(-100, height);
          for (let x = -100; x <= width + 100; x += 60) {
            const wave = Math.sin((x + drift) * 0.008 + b) * 35 + Math.cos(x * 0.015) * 15;
            ctx.lineTo(x, baseY + wave);
          }
          ctx.lineTo(width + 100, height);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'rockfall': {
        // Small tumbling scree stones bouncing downhill along the slope crust
        const scale = 40;
        ctx.fillStyle = '#44403c';
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 1.0;

        for (let s = 0; s < 5; s++) {
          const rockSpeed = 85 + s * 22;
          const cycleTime = 4.0 + s * 0.8;
          const cycleProgress = (t % cycleTime) / cycleTime;
          // Travel downhill from far ahead (+25m) towards behind (-15m)
          const meterDist = 24 - cycleProgress * 38;
          const px = anchorX + dirX * (meterDist * scale);
          const py = anchorY + dirY * (meterDist * scale);

          // Bounce arc along normal
          const bounce = Math.abs(Math.sin(cycleProgress * Math.PI * 5)) * 14;
          const rx = px + normX * -bounce;
          const ry = py + normY * -bounce;

          if (rx > -50 && rx < width + 50 && ry > -50 && ry < height + 50) {
            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(t * 8 + s);
            ctx.beginPath();
            ctx.arc(0, 0, 3.2 + (s % 3), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }
        break;
      }
      case 'zephyr': {
        // Golden/cyan updraft wind ribbons soaring uphill along slope
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.28)';
        ctx.lineWidth = 2.0;

        for (let w = 0; w < 6; w++) {
          const wSpeed = 240 + w * 40;
          const wOffset = ((t * wSpeed + w * 180) % (width * 1.6)) - width * 0.3;
          const waveAmp = Math.sin(t * 3 + w) * 16;

          const startX = anchorX - dirX * 300 + normX * (-40 - w * 25) + dirX * wOffset;
          const startY = anchorY - dirY * 300 + normY * (-40 - w * 25) + dirY * wOffset;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(
            startX + dirX * 45 + normX * waveAmp,
            startY + dirY * 45 + normY * waveAmp,
            startX + dirX * 110,
            startY + dirY * 110
          );
          ctx.stroke();
        }
        break;
      }
    }
    ctx.restore();
  }

  private renderEmbers(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dt: number,
    terrain: TerrainType
  ): void {
    this.emberTimer += dt;
    ctx.save();
    ctx.fillStyle = terrain.id === 'phlegethon_abyss' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(217, 119, 6, 0.25)';
    
    // 16 procedural floating sparks with deterministic sine paths
    for (let i = 0; i < 16; i++) {
      const seed = i * 137.5;
      const speed = 25 + (i % 5) * 12;
      const x = (seed * 11 + Math.sin(this.emberTimer * 0.8 + i) * 60) % width;
      const y = (height - ((this.emberTimer * speed + seed * 7) % (height + 50)));
      const size = 1.5 + (i % 3);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderDistantMountains(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    distance: number,
    terrain: TerrainType
  ): void {
    ctx.save();
    ctx.fillStyle = terrain.mountainColor;
    ctx.beginPath();

    const parallaxOffset = (distance * 6) % width;
    ctx.moveTo(0, height);

    const step = 90;
    const numPoints = Math.ceil(width / step) + 2;

    for (let i = -1; i <= numPoints; i++) {
      const px = i * step - (parallaxOffset % step);
      const wave = Math.sin((i + Math.floor(parallaxOffset / step)) * 1.7) * 45;
      const py = height * 0.42 + wave;
      ctx.lineTo(px, py);
    }

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private renderMidgroundCrags(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    distance: number,
    terrain: TerrainType
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(24, 24, 27, 0.85)';
    ctx.beginPath();

    const parallaxOffset = (distance * 18) % width;
    ctx.moveTo(0, height);

    const step = 60;
    const numPoints = Math.ceil(width / step) + 2;

    for (let i = -1; i <= numPoints; i++) {
      const px = i * step - (parallaxOffset % step);
      const wave = Math.sin((i + Math.floor(parallaxOffset / step)) * 2.3) * 35;
      const py = height * 0.54 + wave;
      ctx.lineTo(px, py);
    }

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private renderGroundSlope(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    anchorX: number,
    anchorY: number,
    dirX: number,
    dirY: number,
    normX: number,
    normY: number,
    distance: number,
    terrain: TerrainType,
    slopeAngleDeg: number
  ): void {
    ctx.save();

    // 1 meter = 40 pixels along the slope
    const scale = 40;
    const viewSpan = Math.max(width, height) * 1.8;

    // Draw solid mountain ground polygon below the slope line
    const pStart = {
      x: anchorX - dirX * viewSpan,
      y: anchorY - dirY * viewSpan,
    };
    const pEnd = {
      x: anchorX + dirX * viewSpan,
      y: anchorY + dirY * viewSpan,
    };

    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.lineTo(pEnd.x + normX * 800, pEnd.y + normY * 800);
    ctx.lineTo(pStart.x + normX * 800, pStart.y + normY * 800);
    ctx.closePath();

    const groundGrad = ctx.createLinearGradient(anchorX, anchorY, anchorX + normX * 300, anchorY + normY * 300);
    groundGrad.addColorStop(0, terrain.groundColor);
    groundGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = groundGrad;
    ctx.fill();

    // Incline surface crust line
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.strokeStyle = terrain.groundAccentColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Mile markers carved into the slope every 10 meters ("10m", "20m", "50m", etc.)
    const meterOffset = distance % 10;
    const currentTen = Math.floor(distance / 10) * 10;

    for (let offset = -40; offset <= 60; offset += 10) {
      const markerMeter = currentTen + offset;
      if (markerMeter < 0) continue;

      const deltaMeters = markerMeter - distance;
      const markerDistPixels = deltaMeters * scale;

      const mx = anchorX + dirX * markerDistPixels;
      const my = anchorY + dirY * markerDistPixels;

      // Check if inside visible bounds
      if (mx > -100 && mx < width + 100 && my > -100 && my < height + 100) {
        // Draw stone slab / Greek milestone pillar
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate((slopeAngleDeg * Math.PI) / 180);

        // Milestone base
        ctx.fillStyle = '#27272a';
        ctx.fillRect(-12, 0, 24, 28);
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-12, 0, 24, 28);

        // Milestone text
        ctx.fillStyle = '#e4e4e7';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${markerMeter}m`, 0, 18);

        ctx.restore();
      }
    }

    ctx.restore();
  }

  private renderSisyphus(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    dirX: number,
    dirY: number,
    normX: number,
    normY: number,
    stoneRadius: number,
    velocity: number,
    inputsPerSec: number
  ): void {
    ctx.save();

    // Position Sisyphus behind the boulder along the slope (downhill side)
    const sisyphusDistBehind = stoneRadius + 14;
    const posX = anchorX - dirX * sisyphusDistBehind;
    const posY = anchorY - dirY * sisyphusDistBehind;

    ctx.translate(posX, posY);
    // Align coordinate space with the hill incline (+X uphill towards stone, -Y up into air, Y=0 ground)
    const angle = Math.atan2(dirY, dirX);
    ctx.rotate(angle);

    // Dynamic Kinematic & Exertion State
    const now = Date.now();
    const isPushing = velocity > 0.05 || inputsPerSec > 1.5;
    const isSlipping = velocity < -0.12;

    // Effort breathing & muscular strain pulsation
    const effortRate = Math.min(16, Math.max(3, inputsPerSec * 1.4));
    const effortCycle = Math.sin(now * 0.008 * effortRate);
    const effortBob = isPushing ? effortCycle * 2.2 : Math.sin(now * 0.002) * 1.0;
    const muscleTremor = isPushing ? (Math.random() * 0.8 - 0.4) : 0;

    // Heroic Greek Underworld Palette
    const skinDark = '#1c1917';        // Deep shadow silhouette
    const skinMid = '#292524';         // Sculpted muscle midtone
    const rimLight = 'rgba(251, 191, 36, 0.85)'; // Amber/golden heroic edge highlight
    const clothColor = '#7f1d1d';      // Terracotta/crimson Spartan cloth
    const clothAccent = '#b91c1c';     // Cloth fold highlight
    const cordColor = '#d97706';       // Ancient golden waist cord

    // Stride phase driven by velocity and effort
    const strideFreq = isPushing ? 0.009 * Math.max(3, velocity * 2.5) : 0;
    const legPhase = isPushing ? Math.sin(now * strideFreq) : 0;

    // Contact point on the boulder surface: hands brace against the rock
    // Boulder is located ahead at (stoneRadius + 14, -stoneRadius)
    const handsX = stoneRadius - 10;
    const handsY = -24 + effortBob * 0.6;

    // Head position
    const headX = 11 + muscleTremor;
    const headY = -37 + effortBob * 0.8;

    // --- 1. FAR LEG (Background layer, driving into the slope) ---
    ctx.save();
    ctx.fillStyle = '#141210';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
    ctx.lineWidth = 1.2;

    const farKneeX = isSlipping ? -18 : -14 + legPhase * 5;
    const farKneeY = isSlipping ? -10 : -14 - Math.max(0, legPhase) * 6;
    const farFootX = isSlipping ? -28 : -22 - legPhase * 6;
    const farFootY = 0; // Firmly planted on ground

    ctx.beginPath();
    // Pelvis to knee (quad)
    ctx.moveTo(-10, -18);
    ctx.quadraticCurveTo(farKneeX - 3, farKneeY - 4, farKneeX, farKneeY);
    // Knee to heel (calf)
    ctx.quadraticCurveTo(farFootX - 4, farFootY - 6, farFootX, farFootY);
    // Foot sole gripping ground
    ctx.lineTo(farFootX + 8, farFootY);
    ctx.quadraticCurveTo(farFootX + 4, farFootY - 4, farKneeX + 3, farKneeY);
    ctx.quadraticCurveTo(-6, -16, -6, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // --- 2. FAR ARM (Background arm pressed high on the boulder) ---
    ctx.save();
    ctx.fillStyle = '#141210';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
    ctx.lineWidth = 1.2;

    const farShoulderX = headX + 1;
    const farShoulderY = headY + 11;
    const farElbowX = farShoulderX + 11;
    const farElbowY = farShoulderY + 4;
    const farHandX = handsX - 2;
    const farHandY = handsY - 6;

    ctx.beginPath();
    ctx.moveTo(farShoulderX, farShoulderY);
    ctx.quadraticCurveTo(farElbowX, farElbowY - 3, farElbowX, farElbowY);
    ctx.quadraticCurveTo(farHandX - 2, farHandY + 2, farHandX, farHandY);
    ctx.lineTo(farHandX + 4, farHandY + 3);
    ctx.quadraticCurveTo(farElbowX + 2, farElbowY + 4, farShoulderX + 4, farShoulderY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // --- 3. TORSO & CORE ANATOMY (Muscular back, chest and abs) ---
    ctx.save();
    // Torso body fill
    const torsoGrad = ctx.createLinearGradient(headX - 10, headY, -14, -6);
    torsoGrad.addColorStop(0, skinMid);
    torsoGrad.addColorStop(1, skinDark);
    ctx.fillStyle = torsoGrad;

    ctx.beginPath();
    // From back of neck down the spine
    ctx.moveTo(headX - 6, headY + 8);
    // Trapezius and upper back arch
    ctx.quadraticCurveTo(headX - 14, headY + 16, -6 + muscleTremor, -18 + effortBob * 0.4);
    // Latissimus dorsi and lumbar curve
    ctx.quadraticCurveTo(-14, -13, -13, -8);
    // Glutes and hips
    ctx.quadraticCurveTo(-12, -4, -6, -6);
    // Lower abdomen / groin
    ctx.lineTo(1, -12);
    // Serratus anterior & ribcage
    ctx.quadraticCurveTo(5, -17, headX + 3, headY + 20);
    // Pectoral chest braced forward
    ctx.quadraticCurveTo(headX + 9, headY + 16, headX + 2, headY + 8);
    ctx.closePath();
    ctx.fill();

    // Sculpted back muscle contour lines
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(headX - 8, headY + 13);
    ctx.quadraticCurveTo(-2, -18, -4, -13); // Spinal furrow
    ctx.moveTo(headX - 3, headY + 15);
    ctx.quadraticCurveTo(2, -16, 1, -12);  // Rib line
    ctx.stroke();

    // Golden Rim Light along the arched spine and shoulders
    ctx.strokeStyle = rimLight;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(headX - 6, headY + 7);
    ctx.quadraticCurveTo(headX - 14, headY + 16, -6 + muscleTremor, -18 + effortBob * 0.4);
    ctx.quadraticCurveTo(-14, -13, -13, -8);
    ctx.stroke();
    ctx.restore();

    // --- 4. TATTERED GREEK CLOTH (Chiton / Loincloth around waist) ---
    ctx.save();
    ctx.fillStyle = clothColor;
    ctx.beginPath();
    ctx.moveTo(-11, -12);
    ctx.lineTo(-4, -6);
    // Fluttering hem
    const clothFlutter = Math.sin(now * 0.01 + velocity * 2) * 2;
    ctx.lineTo(-1, -3 + clothFlutter);
    ctx.lineTo(3, -9);
    ctx.lineTo(-2, -14);
    ctx.closePath();
    ctx.fill();

    // Cloth fold lines & highlights
    ctx.strokeStyle = clothAccent;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-9, -11);
    ctx.lineTo(-2, -5);
    ctx.stroke();

    // Golden braided cord
    ctx.strokeStyle = cordColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.quadraticCurveTo(-5, -11, 2, -13);
    ctx.stroke();
    ctx.restore();

    // --- 5. NEAR LEG (Foreground driving leg with articulated anatomy) ---
    ctx.save();
    ctx.fillStyle = skinMid;

    // Leg kinematics: alternates with legPhase
    let nearKneeX: number;
    let nearKneeY: number;
    let nearFootX: number;
    const nearFootY = 0; // Contact with ground

    if (isSlipping) {
      // Skidding posture: front foot digging in to halt the stone
      nearKneeX = 0;
      nearKneeY = -11;
      nearFootX = 6;
    } else {
      // Powerful forward drive
      nearKneeX = 2 - legPhase * 6;
      nearKneeY = -12 + Math.max(0, -legPhase) * 5;
      nearFootX = 4 + legPhase * 5;
    }

    ctx.beginPath();
    // Hip to knee (thigh / quadriceps curvature)
    ctx.moveTo(-8, -10);
    ctx.quadraticCurveTo(nearKneeX - 4, nearKneeY - 5, nearKneeX, nearKneeY);
    // Knee cap
    ctx.lineTo(nearKneeX + 3, nearKneeY + 1);
    // Shin to ankle & foot
    ctx.quadraticCurveTo(nearFootX - 1, nearFootY - 5, nearFootX, nearFootY);
    // Sandal sole flat on ground
    ctx.lineTo(nearFootX - 8, nearFootY);
    // Heel to calf bulge back to knee
    ctx.quadraticCurveTo(nearFootX - 7, nearFootY - 6, nearKneeX - 3, nearKneeY + 3);
    ctx.quadraticCurveTo(-4, -8, -8, -10);
    ctx.closePath();
    ctx.fill();

    // Golden rim light along the back of the calf and heel
    ctx.strokeStyle = rimLight;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(nearKneeX - 3, nearKneeY + 3);
    ctx.quadraticCurveTo(nearFootX - 7, nearFootY - 6, nearFootX - 8, nearFootY);
    ctx.stroke();

    // Sandal straps
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(nearFootX - 6, nearFootY - 2);
    ctx.lineTo(nearFootX + 1, nearFootY - 2);
    ctx.moveTo(nearKneeX - 1, nearKneeY + 4);
    ctx.lineTo(nearFootX - 3, nearFootY - 4);
    ctx.stroke();
    ctx.restore();

    // --- 6. NEAR ARM (Bracing hard against the boulder with flexed bicep) ---
    ctx.save();
    ctx.fillStyle = skinMid;

    const shoulderX = headX + 2;
    const shoulderY = headY + 15;
    const elbowX = shoulderX + 13 + muscleTremor;
    const elbowY = shoulderY + 5 + effortBob * 0.4;
    const handX = handsX;
    const handY = handsY + 4;

    ctx.beginPath();
    // Shoulder deltoid
    ctx.arc(shoulderX, shoulderY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Bicep / tricep segment
    ctx.beginPath();
    ctx.moveTo(shoulderX - 2, shoulderY - 3);
    ctx.quadraticCurveTo(shoulderX + 6, shoulderY - 5, elbowX, elbowY - 2); // flexed tricep
    ctx.quadraticCurveTo(elbowX + 1, elbowY + 3, elbowX - 2, elbowY + 4);  // elbow point
    ctx.quadraticCurveTo(shoulderX + 5, shoulderY + 6, shoulderX - 1, shoulderY + 4); // bicep
    ctx.closePath();
    ctx.fill();

    // Forearm segment with muscular taper
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY - 2);
    ctx.quadraticCurveTo(elbowX + 7, elbowY - 1, handX - 3, handY - 4);
    ctx.lineTo(handX, handY - 3);
    // Hand gripping boulder surface with visible fingers
    ctx.lineTo(handX + 4, handY + 1); // thumb / palm base
    ctx.lineTo(handX + 2, handY + 6); // fingertips pressing rock
    ctx.quadraticCurveTo(elbowX + 6, elbowY + 5, elbowX - 2, elbowY + 4);
    ctx.closePath();
    ctx.fill();

    // Hand knuckles / fingers contour
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(handX + 1, handY - 1);
    ctx.lineTo(handX + 3, handY + 2);
    ctx.moveTo(handX, handY + 2);
    ctx.lineTo(handX + 2, handY + 5);
    ctx.stroke();

    // Golden rim light along top of forearm and deltoid
    ctx.strokeStyle = rimLight;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(shoulderX - 2, shoulderY - 3);
    ctx.quadraticCurveTo(shoulderX + 6, shoulderY - 5, elbowX, elbowY - 2);
    ctx.quadraticCurveTo(elbowX + 7, elbowY - 1, handX, handY - 3);
    ctx.stroke();
    ctx.restore();

    // --- 7. HEAD & HEROIC PROFILE (Brow, jaw, beard, hair, laurel) ---
    ctx.save();
    // Neck
    ctx.fillStyle = skinMid;
    ctx.beginPath();
    ctx.moveTo(headX - 4, headY + 5);
    ctx.lineTo(headX - 6, headY + 11);
    ctx.lineTo(headX + 4, headY + 12);
    ctx.lineTo(headX + 2, headY + 5);
    ctx.closePath();
    ctx.fill();

    // Head base
    ctx.beginPath();
    ctx.arc(headX, headY, 7.8, 0, Math.PI * 2);
    ctx.fill();

    // Heroic Greek profile: strong brow ridge, straight nose, beard
    ctx.beginPath();
    // Forehead and brow
    ctx.moveTo(headX + 3, headY - 4);
    ctx.lineTo(headX + 7.5, headY - 1); // brow ridge
    ctx.lineTo(headX + 8.5, headY + 2); // classical straight nose tip
    ctx.lineTo(headX + 5.5, headY + 3.5); // philtrum / upper lip
    ctx.lineTo(headX + 7.5, headY + 7); // determined bearded chin
    ctx.lineTo(headX + 2, headY + 8);   // jawline
    ctx.lineTo(headX - 2, headY + 5);
    ctx.closePath();
    ctx.fill();

    // Tousled ancient Greek hair & beard curls
    ctx.fillStyle = '#0c0a09'; // Dark curls
    ctx.beginPath();
    // Back hair locks
    ctx.arc(headX - 6, headY - 3, 3.5, 0, Math.PI * 2);
    ctx.arc(headX - 7, headY + 2, 3.2, 0, Math.PI * 2);
    ctx.arc(headX - 5, headY - 6, 3.2, 0, Math.PI * 2);
    // Top curls
    ctx.arc(headX, headY - 7.5, 3.4, 0, Math.PI * 2);
    ctx.arc(headX + 4, headY - 6, 2.8, 0, Math.PI * 2);
    // Bearded jaw curls
    ctx.arc(headX + 6, headY + 6.5, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Subtle laurel / headband of heroic perseverance
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(headX, headY, 6.8, Math.PI * 0.9, Math.PI * 1.85);
    ctx.stroke();

    // Golden rim light highlighting forehead, hair curls and nose
    ctx.strokeStyle = rimLight;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(headX - 4, headY - 4, 4.5, Math.PI * 0.8, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();

    // --- 8. EFFORT PARTICLES (Sweat & grit beads flying when pushing hard) ---
    if (inputsPerSec > 6) {
      ctx.save();
      ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
      const sweat1X = headX - 8 + (Math.sin(now * 0.03) * 6);
      const sweat1Y = headY - 2 + (Math.cos(now * 0.02) * 4);
      ctx.beginPath();
      ctx.arc(sweat1X, sweat1Y, 1.3, 0, Math.PI * 2);
      ctx.fill();

      if (inputsPerSec > 11) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        const sweat2X = headX - 14 + (Math.cos(now * 0.04) * 5);
        const sweat2Y = headY + 6 + (Math.sin(now * 0.035) * 5);
        ctx.beginPath();
        ctx.arc(sweat2X, sweat2Y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private renderBoulder(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    angle: number,
    skin: StoneSkin,
    velocity: number
  ): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Boulder shadow / ambient occlusion at contact point
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = skin.primaryColor;
    ctx.fill();

    // Subtle edge shading gradient for spherical depth
    const sphereGrad = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, radius * 0.1, 0, 0, radius);
    sphereGrad.addColorStop(0, skin.accentColor);
    sphereGrad.addColorStop(0.55, skin.primaryColor);
    sphereGrad.addColorStop(1, skin.secondaryColor);
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Radial Chisel Lines & Fissures that turn with rotation
    ctx.save();
    ctx.strokeStyle = skin.accentColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    switch (skin.patternType) {
      case 'obsidian': {
        // Geometric sharp crystalline shards and glowing cyan fissures
        ctx.strokeStyle = skin.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
          ctx.lineTo(Math.cos(a) * (radius - 5), Math.sin(a) * (radius - 5));
        }
        ctx.stroke();
        break;
      }
      case 'magma': {
        // Pulsing molten veins
        ctx.strokeStyle = skin.accentColor;
        ctx.lineWidth = 2.8;
        ctx.shadowColor = skin.accentColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(Math.cos(a + 0.4) * 20, Math.sin(a + 0.4) * 20, Math.cos(a) * (radius - 4), Math.sin(a) * (radius - 4));
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        break;
      }
      case 'gold': {
        // Divine geometric rings and polished reflection arcs
        ctx.strokeStyle = skin.secondaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = skin.accentColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          ctx.moveTo(Math.cos(a) * (radius * 0.4), Math.sin(a) * (radius * 0.4));
          ctx.lineTo(Math.cos(a) * (radius - 6), Math.sin(a) * (radius - 6));
        }
        ctx.stroke();
        break;
      }
      case 'cracks':
      default: {
        // Classical weathered fissures & radial stone seams
        ctx.strokeStyle = skin.secondaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5;
          ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
          ctx.lineTo(Math.cos(a + 0.3) * (radius * 0.6), Math.sin(a + 0.3) * (radius * 0.6));
          ctx.lineTo(Math.cos(a - 0.1) * (radius - 4), Math.sin(a - 0.1) * (radius - 4));
        }
        ctx.stroke();
        break;
      }
    }
    ctx.restore();

    // Outer silhouette rim
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlePool[i];
      if (p.active) {
        const lifeRatio = Math.max(0, p.life / p.maxLife);
        const alpha = Math.min(1.0, lifeRatio * p.alphaMultiplier);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.currentSize), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
