"use strict";
window.Mishi = window.Mishi || {};
Mishi.Storage = class {
  constructor() {
    this.key = "mishi-lunaris-v1";
    this.available = true;
    this.data = { highScore: 0, level: 1, muted: false, won: false };
    try {
      const d = JSON.parse(localStorage.getItem(this.key) || "{}") || {};
      this.data = {
        highScore: Number.isFinite(Number(d.highScore))
          ? Math.max(0, Math.floor(Number(d.highScore)))
          : 0,
        level: Number.isFinite(Number(d.level))
          ? Math.min(5, Math.max(1, Math.floor(Number(d.level))))
          : 1,
        muted: d.muted === true,
        won: d.won === true,
      };
    } catch {
      this.available = false;
    }
  }
  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch {
      this.available = false;
    }
  }
  score(value) {
    this.data.highScore = Math.max(this.data.highScore, value);
    this.save();
  }
  unlock(level) {
    this.data.level = Math.max(this.data.level, Math.min(5, level));
    this.save();
  }
};
