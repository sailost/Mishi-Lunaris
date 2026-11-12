"use strict";
Mishi.UI = {
  overlay: () => document.getElementById("overlay"),
  set(html, view = "dialog") {
    const el = this.overlay();
    el.innerHTML = html;
    el.dataset.view = view;
    el.hidden = false;
  },
  clear() {
    this.overlay().innerHTML = "";
    this.overlay().hidden = true;
  },
  bind(id, fn) {
    document.getElementById(id)?.addEventListener("click", () => {
      Mishi.audio.start();
      fn();
    });
  },
  chapters() {
    document.getElementById("chapters").innerHTML = Mishi.LEVELS.map(
      (l, i) =>
        `<div class="chapter ${i < Mishi.storage.data.level ? "unlocked" : ""}"><b>${String(i + 1).padStart(2, "0")}</b><span>${l.short}<small>${i < Mishi.storage.data.level ? "DESBLOQUEADO" : "BLOQUEADO"}</small></span></div>`,
    ).join("");
  },
  menu(scene) {
    document.getElementById("hud").hidden = true;
    document.getElementById("pause").hidden = true;
    document.getElementById("touch").hidden = true;
    this.chapters();
    this.set(
      `<div class="menu-copy">
      <div class="eyebrow"><span class="status-dot"></span> AVENTURA ARCADE <span class="eyebrow-divider">/</span> 5 CAPÍTULOS</div>
      <h1><span class="title-name">Mishi<span class="title-spark" aria-hidden="true">✦</span></span><span class="title-prefix">y la noche de las</span><span class="title-sub">estrellas caídas</span></h1>
      <p class="lead">La Bruja Sombra robó la luz de Lunaris.<br>Recupera las estrellas del bosque y enfréntate<br class="desktop-break"> a ella en las torres del castillo.</p>
      <div class="actions menu-actions">${Mishi.storage.data.level > 1 ? `<button class="primary" id="continue"><span>Continuar<small>Capítulo ${Mishi.storage.data.level} · ${Mishi.LEVELS[Mishi.storage.data.level - 1].short}</small></span><span class="arrow" aria-hidden="true">↗</span></button><button class="secondary" id="start">Nueva partida</button>` : `<button class="primary" id="start"><span>Jugar<small>Comienza en el Bosque Encantado</small></span><span class="arrow" aria-hidden="true">↗</span></button>`}</div>
      <button class="text-button" id="help"><span aria-hidden="true">⌘</span> Controles y poderes <span aria-hidden="true">→</span></button>
      <div class="menu-stats"><div><span>RÉCORD PERSONAL</span><strong><i aria-hidden="true">✧</i> ${Mishi.storage.data.highScore.toLocaleString("es")}</strong></div><div><span>PROGRESO</span><strong>${String(Mishi.storage.data.level).padStart(2, "0")} <em>/ 05</em></strong></div></div>
    </div><div class="art-caption"><span class="caption-line"></span><div><small>DESTINO</small><strong>Castillo de Lunaris</strong></div><span class="caption-symbol" aria-hidden="true">✧</span></div>`,
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
    this
      .set(`<div class="center-panel guide-panel"><div class="eyebrow">GUÍA DE VUELO</div><h2>Domina la escoba.</h2><p class="panel-intro">Dispara a las criaturas y recoge las estrellas que liberan. Cuatro oleadas te separan de la Bruja Sombra.</p>
      <div class="guide-grid"><div><b><span>01</span> Muévete y dispara</b><p><kbd>WASD</kbd> o <kbd>↑ ↓ ← →</kbd> para volar.<br>Mantén <kbd>ESPACIO</kbd> o <kbd>J</kbd> para disparar. <kbd>P</kbd> o <kbd>Esc</kbd> pausa la partida.</p></div><div><b><span>02</span> Protege tus vidas</b><p>Empiezas con 3. Cada 300 puntos recuperas una, hasta un máximo de 7. Si escapan 3 criaturas, pierdes una vida.</p></div></div>
      <div class="power-guide"><div><span class="power-symbol">◈</span><b>Leche mágica</b><small>Escudo contra el daño</small></div><div><span class="power-symbol">✦</span><b>Pez dorado</b><small>Tres hechizos por disparo</small></div><div><span class="power-symbol">◎</span><b>Ovillo estelar</b><small>Atrae estrellas cercanas</small></div></div>
      <p class="guide-note">Los poderes duran 8,5 segundos. En móvil, usa la cruceta y mantén pulsado el botón de hechizo.</p><button class="primary" id="back">Volver al menú <span aria-hidden="true">→</span></button></div>`);
    this.bind("back", () => this.menu(scene));
  },
  hud(scene) {
    document.getElementById("hud").hidden = false;
    document.getElementById("pause").hidden = false;
    document.getElementById("touch").hidden = !(
      matchMedia("(any-pointer: coarse)").matches || innerWidth < 900
    );
    document.getElementById("level-label").textContent =
      scene.config.short.toUpperCase();
    document.getElementById("score").textContent = String(scene.score).padStart(
      4,
      "0",
    );
    document.getElementById("lives").textContent = "♥ ".repeat(scene.lives);
    document.getElementById("wave-label").textContent =
      scene.level === 5
        ? `SOMBRA · FASE ${scene.bossPhase}/3`
        : `OLEADA ${scene.level} / 5`;
    document.getElementById("progress").style.width =
      (scene.level === 5
        ? (scene.bossHP / scene.bossMaxHP) * 100
        : (scene.resolved / scene.config.total) * 100) + "%";
    document.getElementById("powers").textContent = Object.entries(
      scene.player.powers,
    )
      .filter(([, until]) => until > scene.activeTime)
      .map(
        ([k, until]) =>
          ({ shield: "◈ Escudo", triple: "✦ Triple", magnet: "◎ Imán" })[k] +
          " " +
          Math.ceil((until - scene.activeTime) / 1000) +
          " s",
      )
      .join("   ");
  },
  toast(text) {
    document.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = "toast";
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
    this.set(
      `<div class="center-panel"><span class="panel-mark" aria-hidden="true">Ⅱ</span><div class="eyebrow">PARTIDA EN PAUSA</div><h2>Vuelo suspendido.</h2><p>${scene.config.name}<br><strong>${scene.score} puntos</strong> · Tu partida sigue aquí.</p><div class="actions"><button class="primary" id="resume">Reanudar <span aria-hidden="true">→</span></button><button class="secondary" id="exit">Salir al menú</button></div><p class="panel-note">Al salir se conserva el capítulo desbloqueado, no la partida actual.</p></div>`,
    );
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
