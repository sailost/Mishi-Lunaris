"use strict";

Mishi.ViewportManager = class {
  static size(width, height) {
    if (width <= 0 || height <= 0) return null;
    return {
      width: Math.max(320, Math.round((width / height) * 720)),
      height: 720,
    };
  }

  constructor(game, container) {
    this.game = game;
    this.container = container;
    this.onResize = (size) => {
      for (const key of Object.keys(Mishi.touch)) Mishi.touch[key] = false;
      for (const scene of game.scene.getScenes(true)) {
        scene.resizeViewport?.(size.width, size.height);
      }
    };
    game.scale.on("resize", this.onResize);
    this.observer = new ResizeObserver(() => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.update(), 120);
    });
    this.observer.observe(container);
  }

  update() {
    const size = Mishi.ViewportManager.size(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    if (!size || size.width === this.game.scale.width) return;
    this.game.scale.resize(size.width, size.height);
  }

  destroy() {
    clearTimeout(this.timer);
    this.observer.disconnect();
    this.game.scale.off("resize", this.onResize);
  }
};
