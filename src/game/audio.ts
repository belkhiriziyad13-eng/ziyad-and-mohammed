type MusicTrack = 'NONE' | 'MENU' | 'STREET' | 'BOSS' | 'VICTORY';

class ArcadeAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private currentTrack: MusicTrack = 'NONE';
  private musicTimer: number | null = null;
  private stepIdx = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.24;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.55;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.7, this.ctx.currentTime, 0.02);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public setMusicTrack(track: MusicTrack): void {
    if (this.currentTrack === track) return;
    this.currentTrack = track;
    this.stepIdx = 0;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (track === 'NONE') return;

    const tempoMs =
      track === 'BOSS' ? 128 : track === 'STREET' ? 148 : track === 'VICTORY' ? 165 : 185;

    this.musicTimer = window.setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      this.playMusicStep(track);
      this.stepIdx = (this.stepIdx + 1) % 32;
    }, tempoMs);
  }

  private playMusicStep(track: MusicTrack): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    const menuLead = [
      330, 0, 392, 440, 523, 0, 494, 440, 392, 0, 330, 294, 330, 392, 440, 0,
      349, 0, 440, 523, 587, 0, 523, 440, 392, 330, 294, 0, 262, 294, 330, 0,
    ];
    const streetLead = [
      220, 262, 330, 0, 294, 330, 392, 0, 440, 392, 330, 294, 262, 0, 294, 330,
      220, 262, 330, 440, 523, 0, 494, 440, 392, 330, 294, 262, 196, 220, 262, 0,
    ];
    const bossLead = [
      196, 233, 262, 294, 311, 0, 294, 262, 233, 0, 262, 294, 311, 392, 349, 311,
      294, 262, 233, 196, 233, 262, 294, 0, 392, 349, 311, 294, 262, 233, 196, 0,
    ];
    const victoryLead = [
      523, 0, 659, 0, 784, 0, 1046, 0, 784, 659, 784, 1046, 880, 784, 659, 523,
      587, 659, 784, 880, 1046, 0, 880, 784, 659, 587, 523, 0, 523, 0, 0, 0,
    ];

    const notes =
      track === 'MENU'
        ? menuLead
        : track === 'BOSS'
          ? bossLead
          : track === 'VICTORY'
            ? victoryLead
            : streetLead;

    const freq = notes[this.stepIdx];
    if (freq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = track === 'BOSS' ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.14);
    }

    // Bass pulse every 2 steps
    if (this.stepIdx % 2 === 0 && track !== 'VICTORY') {
      const bassFreq = track === 'BOSS' ? (this.stepIdx % 8 < 4 ? 98 : 116) : this.stepIdx % 16 < 8 ? 110 : 98;
      const bass = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(bassFreq, now);
      bGain.gain.setValueAtTime(0.14, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      bass.connect(bGain);
      bGain.connect(this.musicGain);
      bass.start(now);
      bass.stop(now + 0.19);
    }
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume = 0.22
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const jitter = 0.94 + Math.random() * 0.12;
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd * jitter), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private noiseBurst(duration: number, volume = 0.25, highpass = 400): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpass;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start();
  }

  public playSwing(heavy = false): void {
    this.tone(heavy ? 240 : 420, heavy ? 85 : 150, heavy ? 0.13 : 0.08, 'triangle', 0.16);
  }

  public playHit(heavy = false): void {
    this.noiseBurst(heavy ? 0.15 : 0.08, heavy ? 0.34 : 0.2, heavy ? 180 : 520);
    this.tone(heavy ? 160 : 240, heavy ? 42 : 75, heavy ? 0.16 : 0.09, 'square', heavy ? 0.28 : 0.18);
  }

  public playJump(): void {
    this.tone(240, 520, 0.11, 'square', 0.12);
  }

  public playSpecial(isMohamed: boolean): void {
    if (isMohamed) {
      // Glasses glint chime + heavy charge whoosh
      this.tone(1180, 1760, 0.14, 'sine', 0.2);
      setTimeout(() => this.tone(180, 65, 0.24, 'sawtooth', 0.24), 40);
    } else {
      this.tone(360, 740, 0.18, 'square', 0.18);
      this.noiseBurst(0.16, 0.16, 700);
    }
  }

  public playBlock(): void {
    this.tone(680, 420, 0.09, 'square', 0.2);
  }

  public playPickup(): void {
    this.tone(523, 784, 0.09, 'square', 0.15);
    setTimeout(() => this.tone(784, 1046, 0.12, 'square', 0.15), 75);
  }

  public playPlayerHurt(): void {
    this.tone(190, 70, 0.18, 'sawtooth', 0.24);
  }

  public playCrateBreak(): void {
    this.noiseBurst(0.14, 0.28, 300);
    this.tone(180, 70, 0.12, 'triangle', 0.22);
  }

  public playBossTelegraph(): void {
    this.tone(310, 620, 0.22, 'sawtooth', 0.16);
  }

  public playStageClear(): void {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, idx) => {
      setTimeout(() => this.tone(n, n * 1.02, 0.16, 'square', 0.18), idx * 95);
    });
  }
}

export const arcadeAudio = new ArcadeAudioEngine();
