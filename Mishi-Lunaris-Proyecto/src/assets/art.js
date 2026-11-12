"use strict";
window.Mishi = window.Mishi || {};
// Texturas de enemigos, objetos y escenarios.
Mishi.Art = {
  canvas(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    return c.toDataURL();
  },
  ellipse(c, x, y, rx, ry, fill) {
    c.fillStyle = fill;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  },
  path(c, points, fill, stroke) {
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 2;
      c.stroke();
    }
  },
  star(c, x, y, r, color = "#f4d98b") {
    c.save();
    c.translate(x, y);
    c.fillStyle = color;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2,
        rr = i % 2 ? r * 0.43 : r;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
    c.restore();
  },
  mishi() {
    return Mishi.Character.dataUri;
  },
  enemy(type) {
    return this.canvas(128, 112, (c) => {
      const e = (...a) => this.ellipse(c, ...a),
        p = (...a) => this.path(c, ...a);
      if (type === "cloud") {
        e(64, 61, 51, 24, "#596173");
        e(45, 42, 24, 24, "#687182");
        e(77, 38, 29, 29, "#687182");
        p(
          [
            [55, 79],
            [44, 101],
            [64, 92],
            [59, 111],
            [83, 80],
          ],
          "#f5da83",
        );
      } else if (type === "mouse") {
        e(44, 37, 17, 20, "#8f819f");
        e(82, 37, 17, 20, "#8f819f");
        e(63, 65, 32, 28, "#ae9aad");
        p(
          [
            [42, 35],
            [60, 0],
            [82, 36],
          ],
          "#433755",
        );
        e(62, 36, 34, 6, "#433755");
      } else {
        p(
          [
            [55, 55],
            [8, 22],
            [2, 60],
            [18, 54],
            [26, 75],
            [41, 65],
            [62, 82],
            [89, 65],
            [104, 75],
            [111, 54],
            [127, 60],
            [120, 22],
            [73, 55],
          ],
          type === "crow" ? "#29364a" : "#645079",
          "#95768f",
        );
        e(64, 64, 21, 29, type === "crow" ? "#3c4b5b" : "#80618a");
        p(
          [
            [45, 46],
            [46, 23],
            [61, 44],
            [74, 42],
            [84, 23],
            [83, 52],
          ],
          "#80618a",
        );
      }
      e(52, 61, 6, 7, "#f3d7a2");
      e(76, 61, 6, 7, "#f3d7a2");
      e(54, 62, 2.5, 5, "#423246");
      e(74, 62, 2.5, 5, "#423246");
      p(
        [
          [59, 74],
          [69, 74],
          [64, 81],
        ],
        "#dbb56f",
      );
    });
  },
  boss() {
    return this.canvas(300, 280, (c) => {
      const e = (...a) => this.ellipse(c, ...a),
        p = (...a) => this.path(c, ...a);
      p(
        [
          [120, 96],
          [6, 49],
          [28, 165],
          [82, 195],
          [120, 216],
        ],
        "#493858",
        "#89658c",
      );
      p(
        [
          [180, 96],
          [294, 49],
          [272, 165],
          [218, 195],
          [180, 216],
        ],
        "#493858",
        "#89658c",
      );
      e(150, 161, 72, 95, "#544460");
      e(150, 180, 47, 63, "#827082");
      p(
        [
          [96, 100],
          [89, 42],
          [130, 73],
          [172, 72],
          [212, 42],
          [203, 111],
        ],
        "#675171",
      );
      e(121, 119, 33, 35, "#c4b6ae");
      e(180, 119, 33, 35, "#c4b6ae");
      e(123, 122, 17, 23, "#ebbd67");
      e(178, 122, 17, 23, "#ebbd67");
      e(125, 123, 6, 17, "#302938");
      e(176, 123, 6, 17, "#302938");
      p(
        [
          [138, 145],
          [164, 145],
          [150, 166],
        ],
        "#d3a267",
      );
      p(
        [
          [91, 70],
          [133, 6],
          [151, 26],
          [180, 14],
          [210, 72],
        ],
        "#302d44",
        "#9a7d98",
      );
      e(150, 72, 84, 12, "#302d44");
      this.star(c, 151, 52, 13, "#d4ae62");
      for (let i = 0; i < 5; i++)
        p(
          [
            [117 + i * 14, 205],
            [123 + i * 14, 219],
            [129 + i * 14, 205],
          ],
          "#b4a1a8",
        );
    });
  },
  power(type) {
    return this.canvas(64, 64, (c) => {
      c.shadowBlur = 10;
      c.shadowColor = "#efdc8e";
      this.ellipse(c, 32, 32, 27, 27, "#294e4b");
      c.strokeStyle = "#e5ca78";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(32, 32, 26, 0, Math.PI * 2);
      c.stroke();
      c.shadowBlur = 0;
      if (type === "shield") {
        c.fillStyle = "#e6e5c7";
        c.fillRect(23, 20, 19, 26);
        c.fillStyle = "#a5d7ce";
        c.fillRect(25, 30, 15, 13);
        c.fillStyle = "#e5ca78";
        c.fillRect(26, 15, 13, 7);
      }
      if (type === "triple") {
        this.ellipse(c, 30, 32, 14, 9, "#e9c86d");
        this.path(
          c,
          [
            [42, 32],
            [53, 20],
            [53, 44],
          ],
          "#e9c86d",
        );
        this.ellipse(c, 24, 30, 2, 2, "#294e4b");
      }
      if (type === "magnet") {
        this.ellipse(c, 32, 32, 15, 15, "#b2a4d2");
        c.strokeStyle = "#e9e0d8";
        c.lineWidth = 1.3;
        for (let i = 0; i < 4; i++) {
          c.beginPath();
          c.ellipse(32, 32, 6 + i * 2, 15, i * 0.5, 0, Math.PI * 2);
          c.stroke();
        }
      }
      if (type === "life") {
        c.fillStyle = "#edaaac";
        c.font = "bold 38px Arial";
        c.textAlign = "center";
        c.fillText("♥", 32, 45);
      }
    });
  },
  background(scene, level = 1, menu = false) {
    const w = scene.scale.width,
      h = scene.scale.height,
      key = "bg-" + scene.scene.key;
    scene.backgroundImage?.destroy();
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, w, h),
      c = tex.context;
    const palettes = [
      ["#102e31", "#315d4a", "#91aa75"],
      ["#182b45", "#52758a", "#c0ccc0"],
      ["#202439", "#4b4d6a", "#8c92a4"],
      ["#172c37", "#3c5960", "#aeb7a2"],
      ["#171c30", "#40394e", "#8b8d8c"],
    ];
    const colors = palettes[level - 1];
    let seed = 391;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const moonX = w * 0.74,
      moonY = h * 0.29,
      moonR = h * 0.17;
    const glow = c.createRadialGradient(
      moonX,
      moonY,
      moonR * 0.4,
      moonX,
      moonY,
      moonR * 2.4,
    );
    glow.addColorStop(0, "#dfdfab22");
    glow.addColorStop(1, "#dfdfab00");
    c.fillStyle = glow;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#dce1b8";
    c.beginPath();
    c.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.11;
    for (let i = 0; i < 9; i++)
      this.ellipse(
        c,
        moonX + (rand() - 0.5) * moonR * 1.3,
        moonY + (rand() - 0.5) * moonR * 1.3,
        rand() * 17 + 5,
        rand() * 11 + 4,
        "#778f6d",
      );
    c.globalAlpha = 1;
    for (let i = 0; i < 95; i++) {
      const x = rand() * w,
        y = rand() * h * 0.78;
      c.globalAlpha = 0.2 + rand() * 0.6;
      this.star(c, x, y, rand() * 2 + 1, "#e6e7b4");
    }
    c.globalAlpha = 1;
    // Capas de colinas, coníferas y niebla para dar profundidad al bosque.
    for (let layer = 0; layer < 3; layer++) {
      const base = h * (0.64 + layer * 0.13);
      c.fillStyle = ["#54735b", "#294d43", "#193b35"][layer];
      c.globalAlpha = 0.65;
      c.beginPath();
      c.moveTo(0, h);
      for (let x = 0; x <= w + 20; x += 20)
        c.lineTo(x, base + Math.sin((x / w) * 8 + layer * 2) * h * 0.055);
      c.lineTo(w, h);
      c.fill();
      c.globalAlpha = 1;
      for (let i = 0; i < 35; i++) {
        const x = (i * w) / 34 + (rand() - 0.5) * 28,
          y = base + Math.sin((x / w) * 8 + layer * 2) * h * 0.055,
          th = h * (0.09 + rand() * 0.19);
        this.path(
          c,
          [
            [x, y - th],
            [x - th * 0.26, y],
            [x + th * 0.26, y],
          ],
          ["#44674f", "#264a3c", "#13372f"][layer],
        );
        this.path(
          c,
          [
            [x, y - th * 0.7],
            [x - th * 0.34, y + th * 0.2],
            [x + th * 0.34, y + th * 0.2],
          ],
          ["#44674f", "#264a3c", "#13372f"][layer],
        );
      }
      const mist = c.createLinearGradient(0, base - 20, 0, base + 80);
      mist.addColorStop(0, "#c4d6a800");
      mist.addColorStop(0.6, "#c4d6a816");
      mist.addColorStop(1, "#c4d6a800");
      c.fillStyle = mist;
      c.fillRect(0, base - 20, w, 100);
    }
    // Academia Lunaris en la colina.
    const cx = w * 0.79,
      cy = h * 0.7,
      s = h / 700;
    c.save();
    c.translate(cx, cy);
    c.scale(s, s);
    c.fillStyle = "#193338";
    c.fillRect(-50, -87, 110, 108);
    for (const [x, y, ww, hh] of [
      [-85, -135, 32, 160],
      [45, -152, 32, 175],
      [-14, -180, 35, 190],
    ]) {
      c.fillStyle = "#1a3538";
      c.fillRect(x, y, ww, hh);
      this.path(
        c,
        [
          [x - 6, y],
          [x + ww / 2, y - 41],
          [x + ww + 6, y],
        ],
        "#1b3035",
      );
      c.fillStyle = "#e4d38b";
      c.globalAlpha = 0.65;
      c.fillRect(x + ww / 2 - 3, y + 19, 6, 12);
      c.globalAlpha = 1;
    }
    c.restore();
    for (let i = 0; i < 50; i++) {
      c.globalAlpha = 0.3 + rand() * 0.5;
      this.ellipse(
        c,
        rand() * w,
        h * 0.65 + rand() * h * 0.35,
        1 + rand() * 2,
        1 + rand() * 2,
        "#d8da85",
      );
    }
    c.globalAlpha = 1;
    if (menu) {
      const shade = c.createLinearGradient(0, 0, w, 0);
      shade.addColorStop(0, "#082a2cdd");
      shade.addColorStop(0.43, "#092c2c88");
      shade.addColorStop(1, "#082a2c00");
      c.fillStyle = shade;
      c.fillRect(0, 0, w, h);
    }
    tex.refresh();
    scene.backgroundImage = scene.add
      .image(0, 0, key)
      .setOrigin(0)
      .setDepth(-20);
  },
};
