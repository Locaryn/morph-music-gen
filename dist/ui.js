(function () {
  "use strict";

  const CSS = `
:host { display: block; width: 100%; color: var(--text, #e8edf5); font-family: inherit; box-sizing: border-box; }
* { box-sizing: border-box; }
.panel-container { width: 100%; max-width: 920px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.header-card {
  display: flex; align-items: center; justify-content: space-between; padding: 16px 20px;
  background: var(--surface, rgba(255, 255, 255, 0.035)); border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius, 12px);
}
.title-wrap { display: flex; align-items: center; gap: 12px; }
.icon-box {
  width: 40px; height: 40px; border-radius: 10px; background: rgba(var(--accent-rgb, 110, 168, 254), 0.15);
  color: var(--accent, #6ea8fe); display: grid; place-items: center; font-size: 20px;
}
.title { font-size: 16px; font-weight: 700; color: var(--text, #e8edf5); }
.subtitle { font-size: 12px; color: var(--text-faint, #96a3b8); margin-top: 2px; }
.badge {
  display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 99px; font-size: 11px;
  font-weight: 600; background: rgba(101, 211, 145, 0.12); color: #65d391; border: 1px solid rgba(101, 211, 145, 0.25);
}
.field-card {
  display: flex; flex-direction: column; gap: 10px; background: var(--surface, rgba(255, 255, 255, 0.035));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1)); border-radius: var(--radius, 12px); padding: 16px;
}
.label { font-size: 11px; font-weight: 700; color: var(--text-dim, #94a3b8); text-transform: uppercase; letter-spacing: 0.06em; }
.textarea, .input {
  width: 100%; border: 1px solid var(--border, rgba(255, 255, 255, 0.14)); border-radius: var(--radius-sm, 8px);
  background: var(--bg, rgba(0, 0, 0, 0.25)); color: inherit; padding: 10px 12px; font: inherit; font-size: 13px; outline: none;
}
.textarea { min-height: 80px; resize: vertical; }
.btn-primary {
  width: 100%; padding: 12px; background: var(--accent, #6ea8fe); color: #0b101b; border: none;
  border-radius: var(--radius-sm, 8px); font-weight: 700; font-size: 14px; cursor: pointer;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
`;

  class LocarynMusicGenPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.prompt = "";
      this.genre = "Lo-Fi Beats";
      this.duration = 10;
      this.isComposing = false;
    }
    connectedCallback() { this.render(); }

    async compose() {
      if (!this.prompt.trim() || this.isComposing) return;
      this.isComposing = true;
      this.render();
      try {
        const bridge = window.locaryn || window.LocarynPluginAPI;
        if (bridge && bridge.invokeExtensionTool) {
          await bridge.invokeExtensionTool("generate_music", {
            prompt: this.prompt,
            genre: this.genre,
            duration_seconds: Number(this.duration)
          });
        }
      } catch (err) {
        alert("Erreur de composition audio: " + err);
      } finally {
        this.isComposing = false;
        this.render();
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="panel-container">
          <div class="header-card">
            <div class="title-wrap">
              <div class="icon-box">🎵</div>
              <div>
                <div class="title">Studio Composition Musicale</div>
                <div class="subtitle">Génération de pistes audio et sound FX via MusicGen & AudioCraft</div>
              </div>
            </div>
            <div class="badge">Actif</div>
          </div>

          <div class="field-card">
            <label class="label">Ambiance & Instruments (Prompt)</label>
            <textarea class="textarea" id="mg-prompt" placeholder="Ex: Relaxing chillhop beats, vintage vinyl crackle, warm rhodes piano chords...">${this.prompt}</textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="field-card">
              <label class="label">Style / Genre</label>
              <input class="input" id="mg-genre" value="${this.genre}" placeholder="Ex: Lo-Fi, Synthwave, Cyberpunk, Jazz" />
            </div>
            <div class="field-card">
              <label class="label">Durée (secondes)</label>
              <input class="input" type="number" id="mg-dur" value="${this.duration}" min="5" max="60" />
            </div>
          </div>

          <button class="btn-primary" id="mg-btn" ${this.isComposing || !this.prompt.trim() ? "disabled" : ""}>
            ${this.isComposing ? "Composition en cours..." : "Générer la piste musicale"}
          </button>
        </div>
      `;

      const promptEl = this.shadowRoot.querySelector("#mg-prompt");
      if (promptEl) {
        promptEl.addEventListener("input", (e) => {
          this.prompt = e.target.value;
          const btn = this.shadowRoot.querySelector("#mg-btn");
          if (btn) btn.disabled = !this.prompt.trim() || this.isComposing;
        });
      }

      const genreEl = this.shadowRoot.querySelector("#mg-genre");
      if (genreEl) {
        genreEl.addEventListener("input", (e) => { this.genre = e.target.value; });
      }

      const durEl = this.shadowRoot.querySelector("#mg-dur");
      if (durEl) {
        durEl.addEventListener("input", (e) => { this.duration = Number(e.target.value); });
      }

      const btn = this.shadowRoot.querySelector("#mg-btn");
      if (btn) {
        btn.addEventListener("click", () => this.compose());
      }
    }
  }

  if (!customElements.get("locaryn-music-gen-panel")) {
    customElements.define("locaryn-music-gen-panel", LocarynMusicGenPanel);
  }
})();
