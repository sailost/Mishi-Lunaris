"use strict";
Mishi.storage = new Mishi.Storage();
Mishi.audio = new Mishi.Audio(Mishi.storage);
Mishi.touch = {
  up: false,
  down: false,
  left: false,
  right: false,
  fire: false,
  x: 0,
  y: 0,
};
const mute = document.getElementById("mute");
function updateMute() {
  mute.innerHTML = Mishi.audio.muted ? "Sonido desactivado" : "Sonido activado";
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

// Joystick virtual: x e y van de -1 a 1 según lo lejos que se arrastre la bolita.
(function () {
  const stick = document.getElementById("stick");
  const knob = document.getElementById("stick-knob");
  let activeId = null;
  function release() {
    activeId = null;
    Mishi.touch.x = 0;
    Mishi.touch.y = 0;
    knob.style.transform = "translate(-50%, -50%)";
    stick.classList.remove("active");
  }
  function update(e) {
    const rect = stick.getBoundingClientRect();
    const radius = rect.width / 2;
    const max = radius * 0.62;
    let dx = e.clientX - (rect.left + radius);
    let dy = e.clientY - (rect.top + radius);
    const dist = Math.hypot(dx, dy);
    if (dist > max) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    knob.style.transform =
      "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))";
    const dead = 0.12;
    const mag = Math.hypot(dx, dy) / max;
    if (mag < dead) {
      Mishi.touch.x = 0;
      Mishi.touch.y = 0;
    } else {
      Mishi.touch.x = dx / max;
      Mishi.touch.y = dy / max;
    }
  }
  stick.addEventListener("pointerdown", (e) => {
    if (activeId !== null) return;
    e.preventDefault();
    activeId = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    stick.classList.add("active");
    update(e);
  });
  stick.addEventListener("pointermove", (e) => {
    if (e.pointerId === activeId) update(e);
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"])
    stick.addEventListener(ev, (e) => {
      if (e.pointerId === activeId) release();
    });
  window.addEventListener("blur", () => {
    if (!matchMedia("(any-pointer: coarse)").matches) release();
  });
  Mishi.releaseStick = release;
})();
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
