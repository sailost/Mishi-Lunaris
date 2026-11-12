"use strict";
Mishi.Player = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "mishi", "cat");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(0.22).setFlipX(true).setDepth(10).setCollideWorldBounds(true);
    // Cuerpo del gato mirando a la derecha; la escoba y las chispas no reciben daño.
    this.body.setSize(205, 245).setOffset(305, 45);
    this.nextShot = 0;
    this.invincibleUntil = 0;
    this.powers = { shield: 0, triple: 0, magnet: 0 };
  }
  move(keys, touch) {
    let x =
      Number(!!(keys.right.isDown || keys.D.isDown || touch.right)) -
      Number(!!(keys.left.isDown || keys.A.isDown || touch.left));
    let y =
      Number(!!(keys.down.isDown || keys.S.isDown || touch.down)) -
      Number(!!(keys.up.isDown || keys.W.isDown || touch.up));
    const v = new Phaser.Math.Vector2(x, y)
      .normalize()
      .scale(Mishi.Rules.playerSpeed);
    this.setVelocity(v.x, v.y);
    this.setAngle(y * 6);
  }
  shoot(time) {
    if (time < this.nextShot) return;
    this.nextShot = time + Mishi.Rules.shotDelay;
    const scene = this.scene;
    for (const angle of this.powers.triple > time ? [-0.2, 0, 0.2] : [0]) {
      const b = scene.shots.get(this.x + 64, this.y - 8, "spell");
      if (b) {
        b.enableBody(true, this.x + 64, this.y - 8, true, true);
        b.setScale(0.7);
        b.body.setCircle(9);
        b.setVelocity(
          Math.cos(angle) * Mishi.Rules.shotSpeed,
          Math.sin(angle) * Mishi.Rules.shotSpeed,
        );
      }
    }
    Mishi.audio.fx("shoot");
  }
};
