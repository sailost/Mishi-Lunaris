"use strict";

Mishi.MenuScene = class extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  create() {
    this.viewportWidth = this.scale.width;
    Mishi.Art.background(this, 1, true);
    this.cat = this.add.image(0, 0, "mishi", "cat");
    this.positionCharacter();
    this.menuStars = [];
    for (let i = 0; i < 14; i++) {
      const star = this.add
        .image(
          this.scale.width * (0.52 + Math.random() * 0.4),
          this.scale.height * (0.22 + Math.random() * 0.58),
          "star",
        )
        .setScale(0.25 + Math.random() * 0.6)
        .setAlpha(0.6);
      this.menuStars.push(star);
      this.tweens.add({
        targets: star,
        alpha: 0.15,
        y: star.y - 15,
        duration: 1500 + Math.random() * 1800,
        yoyo: true,
        repeat: -1,
      });
    }
    Mishi.UI.menu(this);
  }

  positionCharacter() {
    const small = this.scale.width < 700;
    this.tweens.killTweensOf(this.cat);
    this.cat
      .setPosition(
        this.scale.width * (small ? 0.62 : 0.76),
        this.scale.height * (small ? 0.475 : 0.46),
      )
      .setScale(small ? 0.35 : Math.min(0.82, (this.scale.width * 0.42) / 615))
      .setAngle(-5);
    this.tweens.add({
      targets: this.cat,
      y: this.cat.y - 15,
      angle: -1,
      duration: 2300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  resizeViewport(width) {
    const ratio = width / this.viewportWidth;
    this.viewportWidth = width;
    for (const star of this.menuStars) star.x *= ratio;
    Mishi.Art.background(this, 1, true);
    this.positionCharacter();
  }
};
