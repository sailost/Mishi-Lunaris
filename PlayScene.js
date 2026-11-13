"use strict";
Mishi.PlayScene = class extends Phaser.Scene {
  constructor() {
    super("Play");
  }
  resizeViewport(width, height) {
    const ratio = width / this.viewportWidth;
    this.viewportWidth = width;
    this.physics.world.setBounds(10, 90, width - 20, height - 100);
    const objects = [this.player, this.boss];
    for (const group of [
      this.enemies,
      this.shots,
      this.darkShots,
      this.stars,
      this.drops,
    ]) {
      objects.push(...group.getChildren());
    }
    for (const object of objects) {
      if (!object?.active) continue;
      const x = object.x * ratio;
      const { x: vx, y: vy } = object.body.velocity;
      object.body.reset(x, object.y);
      object.setVelocity(vx, vy);
    }
    for (const hazard of this.hazards) {
      hazard.x *= ratio;
      hazard.warning.setPosition(hazard.x, height / 2).setSize(32, height);
      hazard.text.setX(hazard.x);
    }
    Mishi.Art.background(this, this.level);
    if (!this.frozen && !this.ending) Mishi.UI.hud(this);
  }
  init(data = {}) {
    this.level = data.level || 1;
    this.score = data.score || 0;
    this.lives = data.lives || 3;
    this.config = Mishi.LEVELS[this.level - 1];
    this.spawned = 0;
    this.resolved = 0;
    this.kills = 0;
    this.escaped = 0;
    this.clearAt = 0;
    this.boss = null;
    this.frozen = false;
    this.ending = false;
    this.activeTime = 0;
    this.nextSpawn = 1800;
    this.nextHazard = 6000;
    this.nextEnemyShot = 4000;
    this.nextGift = 6000;
    this.nextHUD = 0;
    this.bossPhase = 1;
    this.bossMaxHP = 100;
    this.bossHP = 100;
    this.nextLife = Math.floor(this.score / 300 + 1) * 300;
    this.hazards = [];
  }
  create() {
    this.viewportWidth = this.scale.width;
    const w = this.scale.width,
      h = this.scale.height;
    Mishi.Art.background(this, this.level);
    Mishi.UI.clear();
    Mishi.storage.unlock(this.level);
    Mishi.UI.chapters();
    this.physics.world.setBounds(10, 90, w - 20, h - 100);
    this.player = new Mishi.Player(this, w * 0.15, h * 0.52);
    this.shots = this.physics.add.group({
      defaultKey: "spell",
      maxSize: 70,
      allowGravity: false,
    });
    this.enemies = this.physics.add.group({ allowGravity: false });
    this.stars = this.physics.add.group({
      defaultKey: "star",
      maxSize: 100,
      allowGravity: false,
    });
    this.drops = this.physics.add.group({ allowGravity: false });
    this.darkShots = this.physics.add.group({
      defaultKey: "dark",
      maxSize: 70,
      allowGravity: false,
    });
    this.keys = this.input.keyboard.addKeys(
      "up,down,left,right,W,A,S,D,SPACE,J,P,ESC",
    );
    this.input.keyboard.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT"]);
    this.shieldRing = this.add
      .circle(this.player.x, this.player.y, 43, 0x9edfd0, 0.07)
      .setStrokeStyle(2, 0xb5eed0, 0.6)
      .setDepth(11)
      .setVisible(false);
    // Overlaps de Arcade: los proyectiles, coleccionables y enemigos tienen cuerpos reales.
    this.physics.add.overlap(this.shots, this.enemies, (shot, enemy) => {
      if (!shot.active || !enemy.active) return;
      shot.disableBody(true, true);
      enemy.hp--;
      this.burst(enemy.x, enemy.y, 3);
      if (enemy.hp <= 0) this.defeatEnemy(enemy);
    });
    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => {
      this.hurt();
      if (enemy.active) {
        enemy.destroy();
        this.resolved++;
      }
    });
    this.physics.add.overlap(this.player, this.stars, (_, star) => {
      if (!star.active) return;
      star.disableBody(true, true);
      this.addScore(Mishi.Rules.starValue);
      Mishi.audio.fx("star");
    });
    this.physics.add.overlap(this.player, this.drops, (_, drop) => {
      if (!drop.active) return;
      const type = drop.getData("power");
      if (type === "life") this.lives = Math.min(7, this.lives + 1);
      else this.player.powers[type] = this.activeTime + Mishi.Rules.powerMs;
      drop.destroy();
      Mishi.audio.fx("power");
      Mishi.UI.toast(
        {
          shield: "Leche mágica · Escudo activado",
          triple: "Pez dorado · Disparo triple",
          magnet: "Ovillo de estrellas · Imán activado",
          life: "Una vida más para Mishi",
        }[type],
      );
    });
    this.physics.add.overlap(this.player, this.darkShots, (_, shot) => {
      if (!shot.active) return;
      shot.disableBody(true, true);
      this.hurt();
    });
    if (this.level === 5) this.createBoss();
    Mishi.UI.hud(this);
    Mishi.UI.toast(
      this.level === 1
        ? "Vuela con WASD o flechas · Mantén ESPACIO para lanzar luz"
        : this.config.name,
    );
    this.blur = () => {
      if (!this.frozen && !this.ending) Mishi.UI.pause(this);
      Object.keys(Mishi.touch).forEach((k) => (Mishi.touch[k] = false));
    };
    window.addEventListener("blur", this.blur);
    this.events.once("shutdown", () => {
      window.removeEventListener("blur", this.blur);
      document.querySelector(".toast")?.remove();
      Mishi.audio.paused = false;
      Object.keys(Mishi.touch).forEach((k) => (Mishi.touch[k] = false));
    });
  }
  createBoss() {
    const w = this.scale.width,
      h = this.scale.height;
    this.boss = this.physics.add
      .sprite(w * 0.81, h * 0.45, "boss")
      .setScale(w < 700 ? 0.62 : 0.82)
      .setDepth(7)
      .setImmovable(true);
    this.boss.body.setSize(142, 180).setOffset(80, 55);
    // En un overlap sprite/grupo, Phaser entrega primero el sprite y luego la bala.
    this.physics.add.overlap(this.boss, this.shots, (boss, shot) => {
      if (!boss.active || !shot.active || this.frozen || this.ending) return;
      shot.disableBody(true, true);
      this.bossHP--;
      this.burst(shot.x, shot.y, 2);
      if (this.bossHP <= 0) {
        this.boss.disableBody(true, true);
        this.addScore(300);
        this.finish(true);
      } else {
        const phase = this.bossHP > 66 ? 1 : this.bossHP > 33 ? 2 : 3;
        if (phase !== this.bossPhase) {
          this.bossPhase = phase;
          this.cameras.main.flash(250, 120, 90, 140);
          Mishi.UI.toast("Fase " + phase + " · El cielo se oscurece");
          this.boss.setTint(phase === 2 ? 0xc4b2d7 : 0xb09ac9);
        }
      }
    });
    this.physics.add.overlap(this.player, this.boss, () => this.hurt());
    this.nextEnemyShot = 2200;
  }
  spawnEnemy() {
    const w = this.scale.width,
      h = this.scale.height;
    const types =
      this.level === 1
        ? ["bat", "mouse"]
        : this.level === 2
          ? ["bat", "bat", "crow"]
          : this.level === 3
            ? ["cloud", "bat", "crow"]
            : ["mouse", "crow", "bat"];
    const type = types[this.spawned % types.length];
    const y =
      this.level === 4
        ? 125 + ((this.spawned % 4) * (h - 190)) / 4
        : Phaser.Math.Between(125, h - 85);
    const e = new Mishi.Enemy(this, w + 50, y, type, this.spawned);
    this.enemies.add(e);
    e.setVelocityX(-this.config.speed);
    this.spawned++;
  }
  defeatEnemy(enemy) {
    const x = enemy.x,
      y = enemy.y;
    enemy.destroy();
    this.resolved++;
    this.kills++;
    this.burst(x, y, 8);
    for (let i = 0; i < 3; i++) {
      const s = this.stars.get(
        x + Phaser.Math.Between(-15, 15),
        y + Phaser.Math.Between(-18, 18),
        "star",
      );
      if (s) {
        s.enableBody(true, s.x, s.y, true, true);
        s.setScale(0.75);
        s.setVelocity(-65, Phaser.Math.Between(-15, 15));
        s.body.setCircle(11, 5, 5);
      }
    }
    if (this.kills % 5 === 0)
      this.drop(
        x,
        y,
        ["shield", "triple", "magnet"][(Math.floor(this.kills / 5) - 1) % 3],
      );
  }
  drop(x, y, type) {
    const d = this.drops.create(x, y, type);
    d.setData("power", type).setScale(0.7).setVelocityX(-75);
    d.body.setCircle(25, 7, 7);
  }
  burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const p = this.add
        .image(x, y, "star")
        .setScale(0.15 + Math.random() * 0.25)
        .setDepth(12);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-45, 45),
        y: y + Phaser.Math.Between(-45, 45),
        alpha: 0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
  }
  addScore(points) {
    this.score += points;
    Mishi.storage.score(this.score);
    if (this.score >= this.nextLife) {
      this.nextLife += 300;
      this.lives = Math.min(7, this.lives + 1);
      Mishi.UI.toast("300 chispas · ¡Una vida de regalo!");
    }
  }
  hurt() {
    if (
      this.ending ||
      this.frozen ||
      this.player.invincibleUntil > this.activeTime ||
      this.player.powers.shield > this.activeTime
    )
      return;
    this.lives--;
    this.player.invincibleUntil = this.activeTime + Mishi.Rules.invincibleMs;
    Mishi.audio.fx("hit");
    this.cameras.main.shake(130, 0.004);
    if (this.lives <= 0) this.finish(false);
  }
  lightning() {
    const x = Phaser.Math.Between(
        Math.round(this.scale.width * 0.2),
        this.scale.width - 45,
      ),
      h = this.scale.height;
    const warning = this.add
      .rectangle(x, h / 2, 32, h, 0xffd97a, 0.12)
      .setDepth(3);
    const text = this.add
      .text(x, 100, "⚡", { fontSize: "28px", color: "#ffe7a3" })
      .setOrigin(0.5);
    this.hazards.push({
      x,
      warning,
      text,
      strike: this.activeTime + 1200,
      end: this.activeTime + 1600,
      hit: false,
    });
  }
  shootDark() {
    if (this.level === 5) {
      const b = this.boss;
      if (!b?.active) return;
      const count = this.bossPhase + 2;
      for (let i = 0; i < count; i++) {
        const s = this.darkShots.get(b.x - 50, b.y, "dark");
        if (s) {
          s.enableBody(true, b.x - 50, b.y, true, true);
          const aim =
            Math.atan2(this.player.y - b.y, this.player.x - b.x) +
            (i - (count - 1) / 2) * 0.19;
          const speed = 145 + this.bossPhase * 24;
          s.setVelocity(Math.cos(aim) * speed, Math.sin(aim) * speed);
          s.body.setCircle(9, 5, 5);
        }
      }
    } else {
      const e = this.enemies
        .getChildren()
        .find((e) => e.x < this.scale.width - 30 && e.x > this.player.x + 60);
      if (e) {
        const s = this.darkShots.get(e.x, e.y, "dark");
        if (s) {
          s.enableBody(true, e.x, e.y, true, true);
          this.physics.moveToObject(s, this.player, 140);
        }
      }
    }
  }
  nextLevel() {
    if (this.ending) return;
    this.ending = true;
    this.frozen = true;
    this.physics.pause();
    Mishi.storage.unlock(this.level + 1);
    Mishi.UI.chapters();
    document.getElementById("touch").hidden = true;
    document.getElementById("pause").hidden = true;
    Mishi.audio.fx("win");
    Mishi.UI.set(
      `<div class="center-panel"><span class="panel-mark" aria-hidden="true">✦</span><div class="eyebrow">CAPÍTULO ${String(this.level).padStart(2, "0")} COMPLETADO</div><h2>Camino despejado.</h2><p>Has superado ${this.config.name}.<br>Siguiente destino: <strong>${Mishi.LEVELS[this.level].name}</strong>.</p><div class="result-score">${this.score}</div><div class="result-label">PUNTOS ACUMULADOS</div><p>${this.lives} ${this.lives === 1 ? "vida disponible" : "vidas disponibles"} · Progreso guardado</p><div class="actions"><button class="primary" id="next">Siguiente capítulo →</button><button class="secondary" id="menu-between">Salir al menú</button></div></div>`,
    );
    Mishi.UI.bind("next", () =>
      this.scene.restart({
        level: this.level + 1,
        score: this.score,
        lives: this.lives,
      }),
    );
    Mishi.UI.bind("menu-between", () => this.scene.start("Menu"));
  }
  finish(won) {
    if (this.ending) return;
    this.ending = true;
    Mishi.storage.score(this.score);
    if (won) {
      Mishi.storage.data.won = true;
      Mishi.storage.save();
    }
    this.scene.start("End", { won, score: this.score, level: this.level });
  }
  update(_time, delta) {
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.P) ||
      Phaser.Input.Keyboard.JustDown(this.keys.ESC)
    ) {
      if (!this.ending) {
        this.frozen ? Mishi.UI.resume(this) : Mishi.UI.pause(this);
      }
    }
    if (this.frozen || this.ending) return;
    this.activeTime += Math.min(delta, 50);
    const t = this.activeTime,
      w = this.scale.width,
      h = this.scale.height;
    this.player.move(this.keys, Mishi.touch);
    if (this.keys.SPACE.isDown || this.keys.J.isDown || Mishi.touch.fire)
      this.player.shoot(t);
    this.player.alpha =
      this.player.invincibleUntil > t ? (Math.floor(t / 100) % 2 ? 0.4 : 1) : 1;
    this.shieldRing
      .setPosition(this.player.x + 22, this.player.y - 8)
      .setVisible(this.player.powers.shield > t);
    if (
      this.level < 5 &&
      this.spawned < this.config.total &&
      t > this.nextSpawn
    ) {
      this.spawnEnemy();
      this.nextSpawn = t + this.config.interval;
    }
    for (const e of [...this.enemies.getChildren()]) {
      e.step(t);
      if (e.x < -80 || e.y > h + 80 || e.y < -80) {
        e.destroy();
        this.resolved++;
        this.escaped++;
        if (this.escaped % 3 === 0) {
          this.lives--;
          Mishi.audio.fx("hit");
          Mishi.UI.toast("Tres criaturas escaparon · Pierdes una vida");
          if (this.lives <= 0) {
            this.finish(false);
            return;
          }
        }
      }
    }
    for (const group of [this.shots, this.darkShots, this.stars])
      for (const obj of group.getChildren()) {
        if (!obj.active) continue;
        if (obj.x > w + 80 || obj.x < -70 || obj.y > h + 70 || obj.y < -70)
          obj.disableBody(true, true);
      }
    for (const d of [...this.drops.getChildren()]) if (d.x < -70) d.destroy();
    for (const star of this.stars.getChildren()) {
      if (!star.active) continue;
      const distance = Phaser.Math.Distance.Between(
        star.x,
        star.y,
        this.player.x,
        this.player.y,
      );
      if (distance < (this.player.powers.magnet > t ? 360 : 90))
        this.physics.moveToObject(star, this.player, 320);
    }
    if (this.level < 5 && t > this.nextGift) {
      this.drop(
        w - 40,
        Phaser.Math.Clamp(this.player.y, 130, h - 85),
        ["shield", "triple", "magnet"][Math.floor(this.nextGift / 9000) % 3],
      );
      this.nextGift = t + 9000;
    }
    if (this.level >= 3 && t > this.nextHazard) {
      this.lightning();
      this.nextHazard = t + (this.level === 5 ? 6500 : 5200);
    }
    for (const z of this.hazards) {
      if (t > z.strike) {
        z.warning.setFillStyle(0xfff0be, 0.8);
        if (!z.hit && Math.abs(this.player.x - z.x) < 34) {
          this.hurt();
          z.hit = true;
        }
      }
      if (t > z.end) {
        z.warning.destroy();
        z.text.destroy();
      }
    }
    this.hazards = this.hazards.filter((z) => t <= z.end);
    if (this.level >= 3 && t > this.nextEnemyShot) {
      this.shootDark();
      this.nextEnemyShot =
        t + (this.level === 5 ? 1700 - this.bossPhase * 230 : 2300);
    }
    if (this.boss?.active) {
      this.boss.setY(h * 0.5 + Math.sin(t / 1000) * (h * 0.26));
      if (this.bossPhase === 3)
        this.boss.setX(w * 0.78 + Math.sin(t / 600) * 25);
    }
    if (t > this.nextHUD) {
      Mishi.UI.hud(this);
      this.nextHUD = t + 120;
    }
    if (this.level < 5 && this.resolved >= this.config.total) {
      if (!this.clearAt) this.clearAt = t + 3000;
      if (t > this.clearAt) this.nextLevel();
    }
  }
};
