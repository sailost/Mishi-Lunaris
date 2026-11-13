"use strict";
Mishi.EndScene = class extends Phaser.Scene {
  constructor() {
    super("End");
  }
  resizeViewport(width) {
    const ratio = width / this.viewportWidth;
    this.viewportWidth = width;
    for (const child of this.children.list) {
      if (child.texture?.key === "star") child.x *= ratio;
    }
    Mishi.Art.background(this, this.result.won ? 1 : 5);
  }
  init(data) {
    this.result = data;
  }
  create() {
    this.viewportWidth = this.scale.width;
    const { won, score, level } = this.result;
    Mishi.Art.background(this, won ? 1 : 5);
    document.getElementById("hud").hidden = true;
    document.getElementById("pause").hidden = true;
    document.getElementById("touch").hidden = true;
    if (won) {
      Mishi.audio.fx("win");
      for (let i = 0; i < 65; i++) {
        const star = this.add
          .image(
            Math.random() * this.scale.width,
            Math.random() * this.scale.height,
            "star",
          )
          .setScale(0.2 + Math.random() * 0.8)
          .setTint(
            Phaser.Utils.Array.GetRandom([0xffe79d, 0xb9e8c4, 0xe5b9d7]),
          );
        this.tweens.add({
          targets: star,
          y: star.y - 90,
          alpha: 0.15,
          duration: 1500 + Math.random() * 3000,
          yoyo: true,
          repeat: -1,
        });
      }
    }
    Mishi.UI.chapters();
    Mishi.UI.set(
      `<div class="center-panel"><p class="eyebrow">${won ? "Aventura completada" : "Fin de la partida"}</p><h2 id="panel-title">${won ? "Lunaris vuelve a brillar" : "Todavía quedan estrellas"}</h2><p>${won ? "La Linterna Estelar está a salvo. Sobre el castillo, las estrellas vuelven a encenderse. Mishi ya puede regresar a casa." : `El vuelo terminó en ${Mishi.LEVELS[level - 1].name}. Vuelve a intentarlo con 3 vidas y una nueva puntuación.`}</p><div class="result-score">${score.toLocaleString("es")}</div><div class="result-label">Puntos reunidos</div><p>Tu récord: <strong>${Mishi.storage.data.highScore.toLocaleString("es")}</strong></p><div class="actions"><button class="primary" id="retry">${won ? "Jugar de nuevo" : "Reintentar capítulo"}</button><button class="secondary" id="end-menu">Volver al menú</button></div></div>`,
    );
    Mishi.UI.bind("retry", () =>
      this.scene.start("Play", { level: won ? 1 : level, score: 0, lives: 3 }),
    );
    Mishi.UI.bind("end-menu", () => this.scene.start("Menu"));
  }
};
