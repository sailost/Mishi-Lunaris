"use strict";
Mishi.BootScene = class extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  preload() {
    this.load.image("mishi", Mishi.Art.mishi());
    for (const t of ["bat", "crow", "cloud", "mouse"])
      this.load.image(t, Mishi.Art.enemy(t));
    this.load.image("boss", Mishi.Art.boss());
    for (const t of ["shield", "triple", "magnet", "life"])
      this.load.image(t, Mishi.Art.power(t));
    this.load.image(
      "star",
      Mishi.Art.canvas(32, 32, (c) => {
        c.shadowColor = "#fff1a6";
        c.shadowBlur = 9;
        Mishi.Art.star(c, 16, 16, 10);
      }),
    );
    this.load.image(
      "spell",
      Mishi.Art.canvas(40, 28, (c) => {
        const g = c.createRadialGradient(22, 14, 1, 22, 14, 15);
        g.addColorStop(0, "#fffbd5");
        g.addColorStop(0.4, "#f8db84");
        g.addColorStop(1, "#f8db8400");
        c.fillStyle = g;
        c.fillRect(0, 0, 40, 28);
      }),
    );
    this.load.image(
      "dark",
      Mishi.Art.canvas(28, 28, (c) => {
        Mishi.Art.ellipse(c, 14, 14, 10, 10, "#b47da9");
        Mishi.Art.ellipse(c, 14, 14, 5, 5, "#f1c4cc");
      }),
    );
  }
  create() {
    // Frame sobre el PNG original: omite el margen transparente sin editar la imagen.
    const f = Mishi.Character.frame;
    this.textures.get("mishi").add("cat", 0, f.x, f.y, f.width, f.height);
    this.scene.start("Menu");
  }
};
