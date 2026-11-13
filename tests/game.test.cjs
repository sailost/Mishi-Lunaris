const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");

// Usa el despacho de colisiones de la versión de Phaser incluida en el juego.
function arcadeOverlapWorld() {
  const source = fs.readFileSync(
    path.join(root, "vendor/phaser.min.js"),
    "utf8",
  );
  const method = (name, next) => {
    const start = source.indexOf(name + ":function");
    const end = source.indexOf("," + next + ":function", start);
    assert.ok(start >= 0 && end > start);
    return vm.runInNewContext(
      "(" + source.slice(start + name.length + 1, end) + ")",
      { h: { STATIC_BODY: 1, DYNAMIC_BODY: 0 } },
    );
  };
  return {
    useTree: false,
    _total: 0,
    canCollide: () => true,
    separate: (a, b) => a.enable && b.enable,
    collideHandler: method("collideHandler", "canCollide"),
    collideSpriteVsGroup: method(
      "collideSpriteVsGroup",
      "collideGroupVsTilemapLayer",
    ),
  };
}

// Dobles pequeños para verificar reglas sin depender de WebGL ni un navegador.
function setup(saved = null, broken = false) {
  let stored = saved;
  class Sprite {
    constructor(scene, x, y) {
      this.scene = scene;
      this.x = x;
      this.y = y;
      this.body = {
        setSize() {
          return this;
        },
        setOffset() {
          return this;
        },
      };
    }
    setScale() {
      return this;
    }
    setFlipX() {
      return this;
    }
    setDepth() {
      return this;
    }
    setCollideWorldBounds() {
      return this;
    }
    setVelocity(x, y) {
      this.vx = x;
      this.vy = y;
      return this;
    }
    setAngle() {
      return this;
    }
  }
  class Scene {}
  class Vector {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    normalize() {
      const n = Math.hypot(this.x, this.y) || 1;
      this.x /= n;
      this.y /= n;
      return this;
    }
    scale(n) {
      this.x *= n;
      this.y *= n;
      return this;
    }
  }
  const c = {
    console,
    Math,
    Number,
    JSON,
    setTimeout,
    clearTimeout,
    matchMedia: () => ({ matches: false }),
    innerWidth: 1280,
    Phaser: {
      Scene,
      Physics: { Arcade: { Sprite } },
      Math: { Vector2: Vector },
      Input: { Keyboard: { JustDown: () => false } },
    },
    window: {},
    localStorage: {
      getItem() {
        if (broken) throw Error("blocked");
        return stored;
      },
      setItem(k, v) {
        if (broken) throw Error("blocked");
        stored = v;
      },
    },
  };
  c.window = c;
  c.Mishi = {};
  vm.createContext(c);
  for (const file of [
    "managers/StorageManager.js",
    "physics/rules.js",
    "objects/Player.js",
    "scenes/PlayScene.js",
  ])
    vm.runInContext(fs.readFileSync(path.join(root, "src", file), "utf8"), c, {
      filename: file,
    });
  c.Mishi.storage = new c.Mishi.Storage();
  c.Mishi.audio = { fx() {} };
  c.Mishi.UI = { toast() {} };
  return c;
}
function scene(c) {
  const s = new c.Mishi.PlayScene();
  s.init({});
  s.player = {
    powers: { shield: 0, triple: 0, magnet: 0 },
    invincibleUntil: 0,
  };
  s.cameras = { main: { shake() {} } };
  s.scene = {
    start(name, data) {
      s.transition = { name, data };
    },
  };
  return s;
}
test("guardado de récord y capítulo es monótono y se restaura", () => {
  const c = setup(),
    store = c.Mishi.storage;
  store.score(120);
  store.score(10);
  store.unlock(4);
  store.unlock(2);
  store.data.muted = true;
  store.save();
  const fresh = new c.Mishi.Storage();
  assert.equal(fresh.data.highScore, 120);
  assert.equal(fresh.data.level, 4);
  assert.equal(fresh.data.muted, true);
});
test("valida valores persistidos fuera de rango", () => {
  const c = setup('{"level":99,"highScore":-40,"muted":"yes"}');
  assert.equal(c.Mishi.storage.data.level, 5);
  assert.equal(c.Mishi.storage.data.highScore, 0);
  assert.equal(c.Mishi.storage.data.muted, false);
  const d = setup('{"level":2.9,"highScore":"Infinity"}');
  assert.equal(d.Mishi.storage.data.level, 2);
  assert.equal(d.Mishi.storage.data.highScore, 0);
});
test("localStorage bloqueado no impide jugar", () => {
  const c = setup(null, true);
  assert.equal(c.Mishi.storage.available, false);
  c.Mishi.storage.score(500);
  assert.equal(c.Mishi.storage.data.highScore, 500);
});
test("un golpe consume una vida y evita daño repetido durante 1,5 s", () => {
  const c = setup(),
    s = scene(c);
  s.hurt();
  assert.equal(s.lives, 2);
  s.hurt();
  assert.equal(s.lives, 2);
  s.activeTime = 1600;
  s.hurt();
  assert.equal(s.lives, 1);
  s.activeTime = 3200;
  s.hurt();
  assert.equal(s.transition.name, "End");
  assert.equal(s.transition.data.won, false);
});
test("escudo y pausa impiden daño; escudo expira", () => {
  const c = setup(),
    s = scene(c);
  s.player.powers.shield = 8500;
  s.activeTime = 8400;
  s.hurt();
  assert.equal(s.lives, 3);
  s.activeTime = 8501;
  s.hurt();
  assert.equal(s.lives, 2);
  s.frozen = true;
  s.activeTime = 12000;
  s.hurt();
  assert.equal(s.lives, 2);
});
test("cada 300 puntos concede una vida, sin superar siete", () => {
  const c = setup(),
    s = scene(c);
  s.addScore(290);
  assert.equal(s.lives, 3);
  s.addScore(10);
  assert.equal(s.lives, 4);
  s.addScore(10);
  assert.equal(s.lives, 4);
  s.lives = 7;
  s.addScore(290);
  assert.equal(s.lives, 7);
  assert.equal(s.score, 600);
  assert.equal(c.Mishi.storage.data.highScore, 600);
});
test("reiniciar escena limpia el temporizador de transición y el jefe anterior", () => {
  const c = setup(),
    s = scene(c);
  s.clearAt = 35000;
  s.boss = { active: true };
  s.ending = true;
  s.init({ level: 2, score: 120, lives: 4 });
  assert.equal(s.clearAt, 0);
  assert.equal(s.boss, null);
  assert.equal(s.ending, false);
  assert.equal(s.level, 2);
  assert.equal(s.score, 120);
  assert.equal(s.lives, 4);
});
test("pausa no avanza reloj, oleadas ni poderes", () => {
  const c = setup(),
    s = scene(c);
  s.keys = { P: {}, ESC: {} };
  s.activeTime = 5000;
  s.frozen = true;
  s.update(0, 1000);
  assert.equal(s.activeTime, 5000);
  assert.equal(s.spawned, 0);
});
test("disparo normal, cadencia, triple y expiración", () => {
  const c = setup(),
    shots = [];
  const s = {
    add: { existing() {} },
    physics: { add: { existing() {} } },
    shots: {
      get() {
        const b = {
          enableBody() {},
          setScale() {},
          body: { setCircle() {} },
          setVelocity(x, y) {
            shots.push([x, y]);
          },
        };
        return b;
      },
    },
  };
  const p = new c.Mishi.Player(s, 20, 50);
  p.shoot(100);
  assert.equal(shots.length, 1);
  p.shoot(110);
  assert.equal(shots.length, 1);
  p.powers.triple = 1000;
  p.shoot(400);
  assert.equal(shots.length, 4);
  assert.ok(shots[1][1] < 0 && shots[3][1] > 0);
  p.shoot(1200);
  assert.equal(shots.length, 5);
});
test("movimiento diagonal mantiene la misma velocidad", () => {
  const c = setup();
  const s = { add: { existing() {} }, physics: { add: { existing() {} } } };
  const p = new c.Mishi.Player(s, 0, 0);
  const keys = Object.fromEntries(
    ["up", "down", "left", "right", "W", "A", "S", "D"].map((k) => [
      k,
      { isDown: false },
    ]),
  );
  keys.W.isDown = true;
  keys.D.isDown = true;
  p.move(keys, {});
  assert.ok(Math.abs(Math.hypot(p.vx, p.vy) - 290) < 0.001);
});
test("victoria persiste y no se ejecuta dos veces", () => {
  const c = setup(),
    s = scene(c);
  s.score = 999;
  s.finish(true);
  assert.equal(s.transition.name, "End");
  assert.equal(s.transition.data.won, true);
  assert.equal(c.Mishi.storage.data.won, true);
  assert.equal(c.Mishi.storage.data.highScore, 999);
  s.finish(false);
  assert.equal(s.transition.data.won, true);
});
test("jefe pasa por tres fases y gana solo al agotar resistencia", () => {
  const c = setup(),
    s = scene(c);
  const overlaps = [];
  const world = arcadeOverlapWorld();
  const shots = [];
  s.shots = {
    isParent: true,
    physicsType: 0,
    children: { entries: shots },
    getLength: () => shots.length,
    getChildren: () => shots,
  };
  let won = false;
  s.level = 5;
  s.scale = { width: 1280, height: 720 };
  const boss = {
    active: true,
    visible: true,
    x: 1000,
    y: 300,
    body: {
      enable: true,
      checkCollision: { none: false },
      setSize() {
        return this;
      },
      setOffset() {},
    },
    setScale() {
      return this;
    },
    setDepth() {
      return this;
    },
    setImmovable() {
      return this;
    },
    setTint() {
      return this;
    },
    disableBody() {
      this.active = false;
      this.visible = false;
      this.body.enable = false;
    },
  };
  boss.body.gameObject = boss;
  s.physics = {
    add: {
      sprite: () => boss,
      overlap: (a, b, fn) => overlaps.push({ a, b, fn }),
    },
  };
  s.cameras.main.flash = () => {};
  s.burst = () => {};
  s.finish = (value) => {
    won = value;
    s.ending = true;
  };
  s.createBoss();
  const collide = () => {
    const { a, b, fn } = overlaps[0];
    world.collideHandler(a, b, fn, null, s, true);
  };
  const shoot = () => {
    const shot = {
      active: true,
      visible: true,
      x: 1000,
      y: 300,
      body: { enable: true, checkCollision: { none: false } },
      disableBody() {
        this.active = false;
        this.visible = false;
        this.body.enable = false;
      },
    };
    shot.body.gameObject = shot;
    shots.push(shot);
    collide();
    return shot;
  };
  const firstShot = shoot();
  assert.equal(s.bossHP, 99);
  assert.equal(
    boss.active,
    true,
    "El jefe debe seguir activo tras el primer disparo",
  );
  assert.equal(boss.visible, true, "El primer disparo no debe ocultar al jefe");
  assert.equal(boss.body.enable, true);
  assert.equal(firstShot.active, false, "Se consume la bala, no el jefe");
  assert.equal(won, false);
  collide();
  assert.equal(s.bossHP, 99, "Una bala consumida no debe volver a causar daño");
  for (let i = 0; i < 33; i++) shoot();
  assert.equal(s.bossPhase, 2);
  assert.equal(boss.visible, true);
  for (let i = 0; i < 33; i++) shoot();
  assert.equal(s.bossPhase, 3);
  assert.equal(boss.visible, true);
  assert.equal(won, false);
  for (let i = 0; i < 33; i++) shoot();
  assert.equal(won, true);
  assert.equal(boss.active, false);
  assert.equal(boss.visible, false);
  assert.equal(s.bossHP, 0);
  assert.equal(s.score, 300);
  shoot();
  assert.equal(s.score, 300, "La recompensa solo se concede una vez");
});
test("HTML referencia archivos existentes y no depende de un CDN", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (match[1].startsWith("#")) continue;
    assert.ok(!/^https?:/.test(match[1]));
    assert.ok(fs.existsSync(path.join(root, match[1])), match[1]);
  }
  assert.ok(
    fs.statSync(path.join(root, "vendor/phaser.min.js")).size > 1000000,
  );
});
