"use strict";
Mishi.Enemy = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type, index) {
    super(scene, x, y, type);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.type = type;
    this.baseY = y;
    this.seed = index;
    this.hp = type === "cloud" ? 3 : type === "mouse" ? 2 : 1;
    this.setScale(type === "cloud" ? 0.66 : 0.6);
    this.body.setSize(64, 45).setOffset(30, 35);
    this.setDepth(8);
    this.speed = scene.config.speed;
    this.setVelocityX(-this.speed);
  }
  step(time) {
    if (this.type === "bat")
      this.setVelocityY(Math.cos(time / 380 + this.seed) * 65);
    if (this.type === "crow")
      this.setVelocityY(Math.sin(time / 700 + this.seed) * 35);
  }
};
