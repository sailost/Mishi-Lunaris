"use strict";
// Música y efectos sintetizados con Web Audio.
Mishi.Audio = class {
  constructor(storage) {
    this.storage = storage;
    this.muted = storage.data.muted;
    this.step = 0;
    this.paused = false;
  }
  start() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.master.gain.value = this.muted ? 0 : 0.24;
      this.timer = setInterval(() => this.music(), 310);
    }
    this.ctx.resume().catch(() => {});
  }
  tone(freq, length = 0.2, type = "sine", volume = 0.3, delay = 0) {
    if (!this.ctx || this.muted || this.paused) return;
    const t = this.ctx.currentTime + delay,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + length);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + length + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  music() {
    const melody = [
      659, 0, 784, 988, 880, 784, 659, 587, 523, 0, 659, 784, 587, 0, 494, 587,
    ];
    this.tone(melody[this.step % 16] || 330, 0.65, "sine", 0.16);
    if (this.step % 4 === 0)
      this.tone(
        [131, 110, 87, 98][Math.floor(this.step / 4) % 4],
        1.2,
        "triangle",
        0.13,
      );
    this.step++;
  }
  fx(name) {
    const sounds = {
      shoot: [880, 0.1, "sine", 0.13],
      hit: [110, 0.25, "sawtooth", 0.22],
      star: [1318, 0.23, "sine", 0.35],
      power: [988, 0.5, "triangle", 0.3],
      win: [784, 0.7, "sine", 0.4],
    };
    this.tone(...(sounds[name] || sounds.star));
    if (name === "win" || name === "power") {
      this.tone(1318, 0.7, "sine", 0.25, 0.12);
      this.tone(1568, 0.8, "sine", 0.2, 0.25);
    }
  }
  toggle() {
    this.start();
    this.muted = !this.muted;
    this.master?.gain.setValueAtTime(
      this.muted ? 0 : 0.24,
      this.ctx.currentTime,
    );
    this.storage.data.muted = this.muted;
    this.storage.save();
  }
};
