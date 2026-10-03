/* Menu dos três pontinhos (canto do cabeçalho): Área do cliente, Minha conta, Aparência (claro/escuro) e Sair.
   Funciona em todas as páginas. Só carrega o login (Supabase) quando já existe uma sessão salva neste navegador,
   para não pesar nas visitas de quem nunca entrou. A sessão fica salva (o cliente continua logado). */
(function () {
  const header = document.querySelector(".header__in");
  if (!header) return;

  const here = document.currentScript ? document.currentScript.src : "";
  const asset = (rel) => new URL(rel, here || location.href).href;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CFG = (typeof SITE !== "undefined" && SITE.auth) || {};
  const live = CFG.mode === "live" && CFG.supabase;
  const ref = live ? new URL(CFG.supabase.url).hostname.split(".")[0] : "";
  const hasSession = () => { try { return !!localStorage.getItem("sb-" + ref + "-auth-token"); } catch (e) { return false; } };
  const page = location.pathname.split("/").pop() || "index.html";
  const nextHere = encodeURIComponent(page + location.search);

  /* ---------- tema ---------- */
  const getMode = () => { try { return localStorage.getItem("mrc_theme") || "light"; } catch (e) { return "light"; } };
  function applyMode(mode) {
    try { localStorage.setItem("mrc_theme", mode); } catch (e) {}
    const dark = mode === "dark" || (mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    render();
  }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (getMode() === "auto") applyMode("auto"); });

  /* ---------- botão e painel ---------- */
  const btn = document.createElement("button");
  btn.className = "kebab";
  btn.type = "button";
  btn.setAttribute("aria-label", "Abrir menu da conta e configurações");
  btn.setAttribute("aria-haspopup", "menu");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = "<span></span>";
  const burger = header.querySelector(".burger");
  header.insertBefore(btn, burger || null);

  const pop = document.createElement("div");
  pop.className = "kebab-menu";
  pop.setAttribute("role", "menu");
  pop.hidden = true;
  header.parentElement.appendChild(pop);

  // Botão do cabeçalho, ao lado do "Assinar": "Entrar" enquanto não há login; "Área do cliente" quando há.
  // Só na página inicial e na de assinatura (nas outras o cabeçalho já tem o botão de voltar).
  const showAuthBtn = ["", "index.html", "assinar.html"].includes(page);
  const authBtn = document.createElement("a");
  authBtn.className = "btn btn--small btn--ghost header-auth";
  if (showAuthBtn) header.insertBefore(authBtn, btn);
  function paintAuthBtn() {
    const logged = me ? true : hasSession() && !ready;
    authBtn.textContent = logged ? "Área do cliente" : "Entrar";
    authBtn.href = logged ? "conta.html" : "entrar.html?next=" + nextHere;
  }

  let me = null;      // { displayName, name, email, avatarUrl, role } quando logado
  let ready = false;

  function initials(s) { return (String(s || "?").trim()[0] || "?").toUpperCase(); }

  function render() {
    paintAuthBtn();
    const mode = getMode();
    const first = me ? (me.displayName || (me.name || "").split(" ")[0] || me.email) : "";
    const head = me
      ? `<div class="kebab-menu__who">
           ${me.avatarUrl ? `<img src="${esc(me.avatarUrl)}" alt="" width="44" height="44">` : `<span class="kebab-menu__ini">${esc(initials(first))}</span>`}
           <div><strong>${esc(first)}</strong><small>${esc(me.email)}</small></div>
         </div>`
      : "";
    const account = me
      ? `<a role="menuitem" href="conta.html">Área do cliente</a>
         ${me.role === "admin" ? `<a role="menuitem" href="admin.html">Painel dos donos</a>` : ""}
         <a role="menuitem" href="perfil.html">Minha conta</a>`
      : `<a role="menuitem" href="conta.html">Área do cliente</a>`;
    const seg = (v, label) => `<button type="button" role="menuitemradio" aria-checked="${mode === v}" data-mode="${v}" class="${mode === v ? "is-on" : ""}">${label}</button>`;
    pop.innerHTML = `${head}
      <div class="kebab-menu__group">${account}</div>
      <div class="kebab-menu__group">
        <p class="kebab-menu__label">Aparência</p>
        <div class="kebab-menu__seg">${seg("light", "Claro")}${seg("dark", "Escuro")}${seg("auto", "Automático")}</div>
      </div>
      ${me ? `<div class="kebab-menu__group"><button type="button" role="menuitem" class="kebab-menu__out" id="kebab-out">Sair da conta</button></div>` : ""}`;
  }

  function open(v) {
    pop.hidden = !v;
    btn.setAttribute("aria-expanded", String(v));
    if (v) { render(); const first = pop.querySelector("a,button"); if (first) first.focus(); }
  }
  btn.addEventListener("click", (e) => { e.stopPropagation(); open(pop.hidden); });
  document.addEventListener("click", (e) => { if (!pop.hidden && !e.target.closest(".kebab-menu") && !e.target.closest(".kebab")) open(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pop.hidden) { open(false); btn.focus(); } });
  pop.addEventListener("click", async (e) => {
    const m = e.target.closest("[data-mode]");
    if (m) { applyMode(m.dataset.mode); return; }
    if (e.target.closest("#kebab-out")) {
      await ensureApi();
      await API.auth.signOut();
      location.href = "index.html";
    }
  });

  /* ---------- login (só carrega quando precisa) ---------- */
  function load(src, integrity) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = false;
      if (integrity) { s.integrity = integrity; s.crossOrigin = "anonymous"; }
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  async function ensureApi() {
    if (typeof API !== "undefined") return true;
    if (!live) return false;
    try {
      if (!window.supabase) await load("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js", "sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok");
      await load(asset("services/api.js"));
      return typeof API !== "undefined";
    } catch (e) { return false; }
  }
  async function loadMe() {
    if (!live || !hasSession()) return;
    if (!(await ensureApi())) return;
    try { me = await API.profile.me(); } catch (e) { me = null; }
  }

  render();
  loadMe().then(() => { ready = true; render(); });
})();
