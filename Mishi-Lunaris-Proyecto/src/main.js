"use strict";
Mishi.storage = new Mishi.Storage();
Mishi.audio = new Mishi.Audio(Mishi.storage);
Mishi.touch = {
  up: false,
  down: false,
  left: false,
  right: false,
  fire: false,
};
const mute = document.getElementById("mute");
function updateMute() {
  mute.innerHTML = Mishi.audio.muted
    ? "♪ <span>Sin sonido</span>"
    : "♫ <span>Sonido</span>";
  mute.setAttribute(
    "aria-label",
    Mishi.audio.muted ? "Activar audio" : "Silenciar audio",
  );
  mute.setAttribute("aria-pressed", String(Mishi.audio.muted));
}
updateMute();
mute.addEventListener("click", () => {
  Mishi.audio.toggle();
  updateMute();
});
document.getElementById("pause").addEventListener("click", () => {
  const scene = Mishi.game.scene.getScene("Play");
  if (scene.scene.isActive() && !scene.ending) {
    scene.frozen ? Mishi.UI.resume(scene) : Mishi.UI.pause(scene);
  }
});
for (const button of document.querySelectorAll("[data-control]")) {
  const key = button.dataset.control;
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    Mishi.touch[key] = true;
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(event, () => (Mishi.touch[key] = false));
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    const scene = Mishi.game.scene.getScene("Play");
    if (scene?.scene.isActive() && !scene.frozen && !scene.ending)
      Mishi.UI.pause(scene);
    Mishi.audio.ctx?.suspend();
  } else Mishi.audio.ctx?.resume().catch(() => {});
});
const gameContainer = document.querySelector(".game-shell");
const viewport = Mishi.ViewportManager.size(
  gameContainer.clientWidth,
  gameContainer.clientHeight,
) || { width: 1280, height: 720 };
Mishi.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: viewport.width,
  height: viewport.height,
  backgroundColor: "#123b37",
  antialias: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  input: { activePointers: 4 },
  scene: [Mishi.BootScene, Mishi.MenuScene, Mishi.PlayScene, Mishi.EndScene],
  fps: { target: 60, forceSetTimeOut: false },
  render: { roundPixels: true },
});
Mishi.viewport = new Mishi.ViewportManager(Mishi.game, gameContainer);
Mishi.game.events.once("destroy", () => Mishi.viewport.destroy());
if (!Mishi.storage.available)
  document.querySelector(".save-note").textContent =
    "Guardado no disponible en este navegador";
