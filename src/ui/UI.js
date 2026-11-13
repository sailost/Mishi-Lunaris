"use strict";
Mishi.UI = {
  overlay: () => document.getElementById("overlay"),
  set(html, view = "dialog") {
    const el = this.overlay();
    el.innerHTML = html;
    el.dataset.view = view;
    el.hidden = false;
    document.body.dataset.screen = view;
    if (view === "dialog") {
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-labelledby", "panel-title");
    } else {
      el.removeAttribute("role");
      el.removeAttribute("aria-labelledby");
    }
    el.scrollTop = 0;
  },
  clear() {
    this.overlay().innerHTML = "";
    this.overlay().hidden = true;
    document.body.dataset.screen = "play";
    document.getElementById("pause").textContent = "Pausar";
  },
  bind(id, fn) {
    document.getElementById(id)?.addEventListener("click", () => {
      Mishi.audio.start();
      fn();
    });
  },
  chapters() {
    const current = Mishi.storage.data.level;
    document.getElementById("chapters").innerHTML = Mishi.LEVELS.map(
      (
        level,
        i,
      ) => `<li class="chapter ${i < current ? "unlocked" : ""}" ${i + 1 === current ? 'aria-current="step"' : ""}>
        <span class="chapter-number">${i + 1}</span><span class="chapter-name">${level.short}</span>
        <span class="sr-only">${i < current ? "Desbloqueado" : "Por descubrir"}</span>
      </li>`,
    ).join("");
  },
  menu(scene) {
    document.getElementById("hud").hidden = true;
    document.getElementById("pause").hidden = true;
    document.getElementById("touch").hidden = true;
    this.chapters();
    const { level, highScore } = Mishi.storage.data;
    this.set(
      `<div class="menu-copy">
        <h1 class="menu-title"><span class="title-name">Mishi</span><span class="title-sub">y la noche de las<br>estrellas caídas</span></h1>
        <p class="menu-lead">Las estrellas han caído sobre Lunaris.<br>Una escoba, un pequeño gato<br>y un largo camino a casa.</p>
        <nav class="menu-nav" aria-label="Menú principal">
          ${level > 1 ? `<button class="menu-option featured" id="continue"><span>Continuar<small>Capítulo ${level} · ${Mishi.LEVELS[level - 1].short}</small></span></button>` : ""}
          <button class="menu-option ${level > 1 ? "" : "featured"}" id="start">${level > 1 ? "Nueva partida" : "Comenzar aventura"}</button>
          <button class="menu-option subtle" id="help">Cómo jugar</button>
        </nav>
        <p class="menu-record">Tu récord: <strong>${highScore.toLocaleString("es")} puntos</strong></p>
      </div>`,
      "menu",
    );
    this.bind("start", () =>
      scene.scene.start("Play", { level: 1, score: 0, lives: 3 }),
    );
    this.bind("continue", () =>
      scene.scene.start("Play", {
        level: Mishi.storage.data.level,
        score: 0,
        lives: 3,
      }),
    );
    this.bind("help", () => this.help(scene));
  },
  help(scene) {
    this.set(`<div class="center-panel guide-panel">
      <p class="eyebrow">Cómo jugar</p><h2 id="panel-title">Tu primer vuelo</h2>
      <p>Recoge las estrellas y abre camino hasta el castillo. Allí te espera la Bruja Sombra.</p>
      <div class="guide-grid">
        <div><h3>Vuela y lanza hechizos</h3><p><kbd>WASD</kbd> o las <kbd>flechas</kbd> para moverte. Mantén <kbd>Espacio</kbd> o <kbd>J</kbd> para disparar. Pausa con <kbd>P</kbd> o <kbd>Esc</kbd>.</p></div>
        <div><h3>Cuida tus vidas</h3><p>Empiezas con 3. Cada 300 puntos recuperas una, hasta 7. Si escapan 3 criaturas, pierdes una vida.</p></div>
      </div>
      <dl class="power-guide">
        <div><dt>Leche mágica</dt><dd>Te protege del daño.</dd></div>
        <div><dt>Pez dorado</dt><dd>Tres hechizos por disparo.</dd></div>
        <div><dt>Ovillo estelar</dt><dd>Atrae las estrellas cercanas.</dd></div>
      </dl>
      <p class="guide-note">Cada poder dura 8,5 segundos. En celular, usa la cruceta y mantén pulsado Hechizo. Puedes moverte y disparar a la vez.</p>
      <div class="actions"><button class="primary" id="back">Volver al menú</button></div>
    </div>`);
    this.bind("back", () => this.menu(scene));
  },
  hud(scene) {
    document.getElementById("hud").hidden = false;
    document.getElementById("pause").hidden = false;
    document.getElementById("touch").hidden = !(
      matchMedia("(any-pointer: coarse)").matches || innerWidth < 900
    );
    document.getElementById("level-label").textContent = scene.config.short;
    document.getElementById("score").textContent =
      scene.score.toLocaleString("es");
    const lives = document.getElementById("lives");
    lives.textContent = "♥ ".repeat(scene.lives);
    lives.setAttribute("aria-label", `${scene.lives} vidas`);
    document.getElementById("wave-label").textContent =
      scene.level === 5
        ? `Sombra · Fase ${scene.bossPhase} de 3`
        : `Capítulo ${scene.level} de 5`;
    const progress =
      scene.level === 5
        ? (scene.bossHP / scene.bossMaxHP) * 100
        : (scene.resolved / scene.config.total) * 100;
    document.getElementById("progress").style.width = progress + "%";
    const track = document.querySelector(".progress-track");
    track.setAttribute("aria-valuenow", String(Math.round(progress)));
    track.setAttribute(
      "aria-label",
      scene.level === 5 ? "Vida de la Bruja Sombra" : "Avance del capítulo",
    );
    document.getElementById("powers").textContent = Object.entries(
      scene.player.powers,
    )
      .filter(([, until]) => until > scene.activeTime)
      .map(
        ([key, until]) =>
          ({ shield: "Escudo", triple: "Triple disparo", magnet: "Imán" })[
            key
          ] +
          " · " +
          Math.ceil((until - scene.activeTime) / 1000) +
          " s",
      )
      .join(" / ");
  },
  toast(text) {
    document.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.textContent = text;
    document.querySelector(".game-shell").append(el);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.remove(), 3200);
  },
  pause(scene) {
    scene.frozen = true;
    scene.physics.pause();
    Mishi.audio.paused = true;
    document.getElementById("touch").hidden = true;
    document.getElementById("pause").textContent = "Reanudar";
    this.set(`<div class="center-panel">
      <p class="eyebrow">Pausa</p><h2 id="panel-title">Un respiro en el camino</h2>
      <p>${scene.config.name}<br><strong>${scene.score.toLocaleString("es")} puntos</strong></p>
      <div class="actions"><button class="primary" id="resume">Seguir volando</button><button class="secondary" id="exit">Volver al menú</button></div>
      <p class="panel-note">Al salir conservarás los capítulos desbloqueados.<br>La partida actual no se guarda.</p>
    </div>`);
    this.bind("resume", () => this.resume(scene));
    this.bind("exit", () => {
      Mishi.audio.paused = false;
      scene.scene.start("Menu");
    });
  },
  resume(scene) {
    scene.frozen = false;
    scene.physics.resume();
    Mishi.audio.paused = false;
    this.clear();
    this.hud(scene);
  },
};
