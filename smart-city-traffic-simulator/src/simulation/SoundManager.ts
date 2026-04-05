/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class SoundManager {
  private static instance: SoundManager;
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new SoundManager();
    }
    return this.instance;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  private initContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playHorn() {
    this.playBeep(440, 0.2, 'square');
  }

  playSiren() {
    // Alternating beep for siren
    this.playBeep(880, 0.1, 'sine');
    setTimeout(() => this.playBeep(660, 0.1, 'sine'), 100);
  }

  playTurnSignal() {
    this.playBeep(1000, 0.05, 'sine');
  }
}
