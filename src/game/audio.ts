/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private rumbleOsc: OscillatorNode | null = null;
  private rumbleGain: GainNode | null = null;
  private lastRumbleVolume: number = 0;

  constructor() {
    try {
      this.isMuted = localStorage.getItem('sisyphus_muted') === 'true';
    } catch {
      // Ignore
    }
  }

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('sisyphus_muted', String(this.isMuted));
    } catch {
      // Ignore
    }

    if (this.isMuted && this.rumbleGain) {
      this.rumbleGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }

    return this.isMuted;
  }

  /**
   * Sound of Sisyphus heaving against the stone.
   * Pitch and timbre vary subtly to prevent ear fatigue during high-frequency spam.
   */
  public playPush(burstSize: number = 1): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Random pitch variance (+- 8%)
    const pitchJitter = 1 + (Math.random() * 0.16 - 0.08);
    const baseFreq = (75 + Math.min(burstSize * 4, 30)) * pitchJitter;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);

    // Subtle stone scrape noise burst
    this.playNoiseScuff(ctx, now);
  }

  private playNoiseScuff(ctx: AudioContext, now: number): void {
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(450, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.07);
  }

  /**
   * Continuous grinding rumble modulated by stone rolling speed.
   */
  public updateRollingSound(velocity: number): void {
    if (this.isMuted) {
      if (this.rumbleGain && this.ctx) {
        this.rumbleGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }

    const ctx = this.initContext();
    if (!ctx) return;

    if (!this.rumbleOsc) {
      this.rumbleOsc = ctx.createOscillator();
      this.rumbleGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      this.rumbleOsc.type = 'sawtooth';
      this.rumbleOsc.frequency.setValueAtTime(38, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, ctx.currentTime);

      this.rumbleGain.gain.setValueAtTime(0, ctx.currentTime);

      this.rumbleOsc.connect(filter);
      filter.connect(this.rumbleGain);
      this.rumbleGain.connect(ctx.destination);

      this.rumbleOsc.start();
    }

    const absVel = Math.abs(velocity);
    const targetVol = absVel > 0.1 ? Math.min(0.25, absVel * 0.02) : 0;

    if (this.rumbleGain && Math.abs(targetVol - this.lastRumbleVolume) > 0.01) {
      this.rumbleGain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.08);
      this.lastRumbleVolume = targetVol;
    }
  }

  /**
   * Sound played when the stone rolls backwards down the hill.
   */
  public playRollbackSting(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  /**
   * Achievement fanfare: ethereal ancient Greek lyre harmonics.
   */
  public playAchievementChime(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const chords = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    chords.forEach((freq, idx) => {
      const noteTime = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.55);
    });
  }

  public playClick(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Powerful mythological thunder explosion with low rumbling decay.
   */
  public playThunder(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Initial crack
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.7);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  /**
   * Sound of light stones rattling and tumbling down the scree.
   */
  public playStoneClatter(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + Math.random() * 180, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }
}
