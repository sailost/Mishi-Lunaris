const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = { Mishi: {}, Phaser: { Scene: class {} } };
vm.createContext(context);
for (const file of [
  "src/managers/ViewportManager.js",
  "src/scenes/PlayScene.js",
]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
}

test("la resolución conserva las proporciones en escritorio, móvil y horizontal", () => {
  for (const [width, height] of [
    [1280, 720],
    [366, 490],
    [800, 450],
    [296, 490],
  ]) {
    const size = context.Mishi.ViewportManager.size(width, height);
    assert.equal(size.height, 720);
    assert.ok(Math.abs(size.width / size.height - width / height) < 0.002);
  }
  assert.equal(context.Mishi.ViewportManager.size(0, 0), null);
});

test("girar la pantalla conserva progreso, velocidades y avisos de rayos", () => {
  const scene = new context.Mishi.PlayScene();
  const actor = (x, y, vx, vy) => {
    const object = {
      active: true,
      x,
      y,
      setVelocity(x, y) {
        this.body.velocity = { x, y };
      },
    };
    object.body = {
      velocity: { x: vx, y: vy },
      reset(x, y) {
        object.x = x;
        object.y = y;
      },
    };
    return object;
  };
  const enemy = actor(900, 200, -120, 35);
  const star = actor(500, 300, -65, 0);
  scene.viewportWidth = 1280;
  scene.player = actor(200, 350, 80, 0);
  scene.boss = null;
  scene.enemies = { getChildren: () => [enemy] };
  scene.stars = { getChildren: () => [star] };
  for (const key of ["shots", "darkShots", "drops"])
    scene[key] = { getChildren: () => [] };
  scene.score = 370;
  scene.lives = 4;
  scene.activeTime = 9000;
  scene.level = 3;
  scene.frozen = true;
  scene.physics = {
    world: {
      setBounds(...bounds) {
        scene.bounds = bounds;
      },
    },
  };
  const hazard = {
    x: 1000,
    warning: {
      setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
      },
      setSize() {
        return this;
      },
    },
    text: {
      setX(x) {
        this.x = x;
      },
    },
  };
  scene.hazards = [hazard];
  context.Mishi.Art = { background() {} };
  context.Mishi.UI = {
    hud() {
      throw Error("La pausa debe continuar");
    },
  };
  scene.resizeViewport(540, 720);
  assert.equal(scene.player.x, 84.375);
  assert.equal(enemy.x, 379.6875);
  assert.equal(enemy.body.velocity.x, -120);
  assert.equal(hazard.x, 421.875);
  assert.equal(hazard.text.x, hazard.x);
  assert.equal(scene.score, 370);
  assert.equal(scene.lives, 4);
  assert.equal(scene.activeTime, 9000);
  scene.resizeViewport(1280, 720);
  assert.equal(scene.player.x, 200);
  assert.equal(enemy.x, 900);
});

test("la publicación usa rutas relativas y un índice en la raíz", () => {
  assert.ok(fs.existsSync(path.join(root, ".nojekyll")));
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(!url.startsWith("/") && !/^https?:/.test(url));
    const resolved = new URL(url, "https://example.github.io/mishi/");
    assert.ok(resolved.pathname.startsWith("/mishi/"));
    assert.ok(fs.existsSync(path.join(root, url)));
  }
});
