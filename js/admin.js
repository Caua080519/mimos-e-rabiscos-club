/* Painel dos donos. Tudo passa por API (js/services/api.js).
   Em modo "live" só funciona para quem tem cargo "admin" ou "owner" no banco; a proteção de verdade é do banco (RLS e funções),
   esta tela só esconde o que a pessoa não pode ver. Dados vindos de clientes SEMPRE passam por esc() (nunca confiar neles). */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const d = (s) => (s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—");
  const plan = (id) => SITE.plans.find((p) => p.id === id) || { name: "—", price: 0 };
  const LIVE = API.mode === "live";
  const TODAY = LIVE ? new Date().toISOString().slice(0, 10) : DEMO_TODAY;
  const BOX_STATUS = ["A preparar", "Em preparação", "Pronta para envio", "Enviado", "Entregue"];
  const SUB_STATUS = ["ativo", "inadimplente", "cancelado", "aguardando pagamento"];
  const chipFor = (s) => ({ ativo: "ok", cancelado: "off", inadimplente: "bad", "aguardando pagamento": "warn" }[s] || "warn");
  const st = (s) => `<span class="st st--${chipFor(s)}">${esc(s)}</span>`;
  const LATE = (c) => c.next && c.next.status !== "Enviado" && c.next.status !== "Entregue" && c.next.shipDate && c.next.shipDate < TODAY;
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dashless = (s) => String(s || "").replace(/^\s*[-–•*]\s*/, "").trim();

  let customers = [];
  let themes = [];
  let isOwner = false;
  let accounts = [];
  let roleLog = [];
  let meInfo = null;

  const toast = (msg) => { const t = $("toast"); t.textContent = msg; t.hidden = !msg; if (msg) setTimeout(() => { t.hidden = true; }, 6500); };

  /* ---------- entrada ---------- */
  async function start() {
    try { await open(); } catch (err) {
      console.error("painel:", err);
      showGate("Não consegui abrir o painel agora. Recarregue a página (Ctrl+Shift+R) e entre de novo.");
    }
  }
  async function open() {
    const user = await API.auth.currentUser();
    if (LIVE && !user) return showGate();
    if (LIVE && !(await API.admin.isAdmin())) {
      showGate("Esta conta não tem acesso ao painel dos donos. Entre com a conta de dono.");
      return;
    }
    if (LIVE) { try { meInfo = await API.profile.me(); } catch (err) { meInfo = null; } isOwner = !!meInfo && meInfo.role === "owner"; }
    $("tab-owners-btn").hidden = !isOwner;
    $("gate").hidden = true;
    $("app").hidden = false;
    $("adm-banner").innerHTML = LIVE
      ? "<strong>Painel dos donos.</strong> Você está logado como dono e vê os dados reais dos clientes. Cuide bem deles."
      : "<strong>Protótipo, sem segurança real.</strong> Os clientes mostrados são <strong>fictícios (demonstração)</strong> e nada é salvo de verdade.";
    $("themes-hint").innerHTML = LIVE
      ? "Cadastre o tema de cada mês. O tema marcado como <strong>do mês</strong> aparece na seção \"Tema do mês\" e até <strong>4 temas</strong> podem aparecer em \"Temas futuros\"."
      : "Protótipo: os temas ficam só neste navegador e não mudam a página principal.";
    renderSideWho();
    $("asst-who").textContent = meInfo ? "Conectado como " + meInfo.email : "Modo demonstração";
    renderAssistantHint();
    await load();
  }

  function showGate(msg) {
    $("app").hidden = true; $("gate").hidden = false;
    const m = $("gate-msg"); m.textContent = msg || ""; m.hidden = !msg;
  }

  $("gate-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const r = await API.auth.signIn(f.email.value.trim(), f.password.value);
    f.password.value = "";
    if (!r.ok) { const m = $("gate-msg"); m.textContent = r.message; m.hidden = false; return; }
    start();
  });
  const logout = async () => { await API.auth.signOut(); location.reload(); };
  $("btn-logout").addEventListener("click", logout);
  $("side-out").addEventListener("click", logout);
  $("asst-out").addEventListener("click", logout);
  $("logo").addEventListener("click", (e) => { e.preventDefault(); if (!$("app").hidden) { goto("summary"); load(); } window.scrollTo({ top: 0, behavior: "smooth" }); });

  async function load() {
    // cada parte carrega sozinha: se uma falhar, as outras continuam aparecendo
    const jobs = [
      ["clientes", API.admin.customers(), (v) => { customers = v; }],
      ["temas", API.admin.themes.list(), (v) => { themes = v; }],
    ];
    if (isOwner) jobs.push(["donos", API.owner.accounts(), (v) => { accounts = v; }], ["histórico de cargos", API.owner.log(), (v) => { roleLog = v; }]);
    const res = await Promise.allSettled(jobs.map((j) => j[1]));
    const bad = [];
    res.forEach((r, i) => { if (r.status === "fulfilled") jobs[i][2](r.value); else { bad.push(jobs[i][0]); console.error("painel:", jobs[i][0], r.reason); } });
    renderAll(bad);
  }
  function renderAll(bad) {
    bad = bad || [];
    [renderSummary, renderCustomers, renderOrders, renderThemes, renderPassportTable, renderBadges, isOwner ? renderOwners : null].forEach((fn) => {
      if (!fn) return;
      try { fn(); } catch (err) { console.error("painel:", fn.name, err); bad.push(fn.name.replace("render", "").toLowerCase()); }
    });
    if (bad.length) toast("Algumas partes não carregaram (" + [...new Set(bad)].join(", ") + "). Recarregue com Ctrl+Shift+R; se continuar, me avise.");
  }

  /* ---------- barra lateral ---------- */
  function renderSideWho() {
    const name = meInfo ? meInfo.displayName || (meInfo.name || "").split(" ")[0] || meInfo.email : "Demonstração";
    const role = meInfo ? (meInfo.role === "owner" ? "Dono principal" : "Dono") : "Protótipo";
    const av = meInfo && meInfo.avatarUrl ? `<img src="${esc(meInfo.avatarUrl)}" alt="" width="44" height="44">` : `<span class="kebab-menu__ini">${esc((name[0] || "?").toUpperCase())}</span>`;
    $("side-who").innerHTML = `${av}<div><strong>${esc(name)}</strong><small>${esc(role)}</small></div>`;
  }
  function setBadge(id, n) { const b = $(id); b.textContent = n > 99 ? "99+" : n; b.hidden = !n; }
  function renderBadges() {
    setBadge("b-customers", customers.filter((c) => c.status === "aguardando pagamento").length);
    setBadge("b-orders", customers.filter((c) => c.next && ["A preparar", "Em preparação", "Pronta para envio"].includes(c.next.status)).length);
    setBadge("b-themes", themes.filter((t) => !t.image).length);
  }

  /* ---------- navegação entre ferramentas ---------- */
  const panels = ["summary", "customers", "orders", "themes", "passports", "files", "assistant", "owners"];
  function goto(tab, f) {
    document.querySelectorAll("#tabs button[data-tab]").forEach((x) => x.classList.toggle("is-on", x.dataset.tab === tab));
    panels.forEach((p) => ($("tab-" + p).hidden = p !== tab));
    if (f) {
      if ("cStatus" in f) $("c-status").value = f.cStatus || "";
      if ("cPlan" in f) $("c-plan").value = f.cPlan || "";
      if ("cConf" in f) $("c-conf").value = f.cConf || "";
      if ("cQ" in f) $("c-q").value = f.cQ || "";
      if ("fStatus" in f) $("f-status").value = f.fStatus || "";
      if ("fPlan" in f) $("f-plan").value = f.fPlan || "";
      if ("fQ" in f) $("f-q").value = f.fQ || "";
      renderCustomers(); renderOrders();
    }
    if (tab === "files") loadFiles();
    if (tab === "assistant") renderChat();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    goto(b.dataset.tab, b.dataset.tab === "customers" ? { cStatus: "", cPlan: "", cConf: "", cQ: "" } : b.dataset.tab === "orders" ? { fStatus: "", fPlan: "", fQ: "" } : null);
  });
  // cliques nos números, gráficos e listas do Resumo levam direto aos detalhes
  $("tab-summary").addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    try { const g = JSON.parse(b.dataset.go); goto(g.tab, g); } catch (err) {}
  });

  /* ---------- Resumo (interativo) ---------- */
  function countUp() {
    document.querySelectorAll("#tab-summary [data-count]").forEach((el) => {
      const n = parseInt(el.dataset.count, 10);
      if (REDUCED || !Number.isFinite(n) || n === 0) { el.textContent = el.dataset.fmt ? el.dataset.fmt : n; return; }
      const t0 = performance.now(), dur = 650;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  function renderSummary() {
    const first = meInfo ? meInfo.displayName || (meInfo.name || "").split(" ")[0] : "";
    $("sum-hello").textContent = first ? `Olá, ${first}!` : "Resumo";
    $("sum-date").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

    const subs = customers.filter((c) => c.status !== "aguardando pagamento");
    const active = customers.filter((c) => c.status === "ativo");
    const withNext = customers.filter((c) => c.next);
    const go = (o) => esc(JSON.stringify(o));
    const k = (label, val, target, bad, raw) => `<button type="button" class="kpi${bad ? " kpi--bad" : ""}" data-go='${go(target)}' title="Ver detalhes"><small>${label}</small><strong ${raw ? `data-fmt="${esc(val)}"` : ""} data-count="${raw ? 0 : val}">${raw ? esc(val) : val}</strong><i aria-hidden="true">→</i></button>`;
    $("kpis").innerHTML = [
      k("Assinantes (já pagaram)", subs.length, { tab: "customers", cConf: "sim" }),
      k("Ativos", active.length, { tab: "customers", cStatus: "ativo" }),
      k("Cancelados", customers.filter((c) => c.status === "cancelado").length, { tab: "customers", cStatus: "cancelado" }),
      k("Pagamento em atraso", customers.filter((c) => c.status === "inadimplente").length, { tab: "customers", cStatus: "inadimplente" }, true),
      k("Receita mensal (estim.)", brl(active.reduce((s, c) => s + plan(c.plan).price, 0)), { tab: "customers", cStatus: "ativo" }, false, true),
      k("Boxes a preparar", withNext.filter((c) => c.next.status === "A preparar" || c.next.status === "Em preparação").length, { tab: "orders", fStatus: "A preparar" }),
      k("Boxes prontas", withNext.filter((c) => c.next.status === "Pronta para envio").length, { tab: "orders", fStatus: "Pronta para envio" }),
      k("Boxes enviadas", withNext.filter((c) => c.next.status === "Enviado").length, { tab: "orders", fStatus: "Enviado" }),
      k("Pedidos atrasados", withNext.filter(LATE).length, { tab: "orders", fStatus: "__late" }, true),
      k("Aguardando pagamento", customers.filter((c) => c.status === "aguardando pagamento").length, { tab: "customers", cStatus: "aguardando pagamento" }),
    ].join("");

    // Pipeline das caixas
    const counts = BOX_STATUS.map((s) => (s === "Entregue" ? customers.reduce((n, c) => n + c.metrics.delivered, 0) : withNext.filter((c) => c.next.status === s).length));
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    const colors = ["#f6c6d6", "#e5d8fa", "#c9e4f7", "#bfe8cc", "#ece4b8"];
    $("pipeline").innerHTML = BOX_STATUS.map((s, i) => `<button type="button" class="pipe" style="flex:${Math.max(Math.sqrt(counts[i]), 1.7)};background:${colors[i]}" data-go='${go(s === "Entregue" ? { tab: "customers", cStatus: "ativo" } : { tab: "orders", fStatus: s })}' title="${esc(s)}: ${counts[i]}"><strong>${counts[i]}</strong><small>${esc(s)}</small></button>`).join("");

    // Rosca por situação
    const groups = [["ativo", "#8fd3a8"], ["inadimplente", "#f19ab8"], ["cancelado", "#b9b2cc"], ["aguardando pagamento", "#f2cf7b"]];
    const tot = customers.length;
    let acc = 0;
    const slices = groups.map(([s, c]) => { const n = customers.filter((x) => x.status === s).length; const from = acc; acc += tot ? (n / tot) * 360 : 0; return { s, c, n, from, to: acc }; });
    $("donut").style.background = tot ? `conic-gradient(${slices.map((x) => `${x.c} ${x.from}deg ${x.to}deg`).join(",")})` : "var(--line)";
    $("donut-total").innerHTML = `<b>${tot}</b><small>clientes</small>`;
    $("legend").innerHTML = slices.map((x) => `<li><button type="button" data-go='${go({ tab: "customers", cStatus: x.s })}'><i style="background:${x.c}"></i>${esc(x.s)} <b>${x.n}</b></button></li>`).join("");

    // Barras por Box
    const per = SITE.plans.map((p) => ({ p, n: active.filter((c) => c.plan === p.id).length }));
    const max = Math.max(1, ...per.map((x) => x.n));
    $("plan-bars").innerHTML = per.map((x) => `<button type="button" class="bar" data-go='${go({ tab: "customers", cPlan: x.p.id, cStatus: "ativo" })}' title="${esc(x.p.name)}: ${x.n} ativo(s)">
      <span class="bar__label">${esc(x.p.name)}</span>
      <span class="bar__track"><span class="bar__fill" style="width:${(x.n / max) * 100}%"></span></span>
      <span class="bar__val">${x.n} · ${brl(x.n * x.p.price)}</span></button>`).join("");

    // Próximos envios (dá para mudar o andamento aqui mesmo)
    const upcoming = withNext.filter((c) => c.next.status !== "Enviado" && c.next.status !== "Entregue").sort((a, b) => (a.next.shipDate || "9").localeCompare(b.next.shipDate || "9"));
    $("next-list").innerHTML = upcoming.length
      ? upcoming.map((c) => `<li data-id="${esc(c.id)}"><span><strong>${esc(c.name)}</strong> · ${esc(plan(c.plan).name)} · caixa nº ${c.next.n}</span>
          <span class="${LATE(c) ? "late" : ""}">${LATE(c) ? "Atrasado · " : ""}${c.next.shipDate ? d(c.next.shipDate) : "sem data de envio"}${c.status === "inadimplente" ? " · pagamento em atraso" : ""}
          <select data-quick="${esc(c.id)}" aria-label="Andamento da caixa">${BOX_STATUS.map((s) => `<option${s === c.next.status ? " selected" : ""}>${s}</option>`).join("")}</select></span></li>`).join("")
      : `<li>Nenhum envio pendente.</li>`;

    const confirmed = customers.filter((c) => c.metrics.confirmed);
    const avgReg = confirmed.length ? Math.round(confirmed.reduce((s, c) => s + c.metrics.regularity, 0) / confirmed.length) : 0;
    $("freq").innerHTML = [
      k("Regularidade média", avgReg + "%", { tab: "customers", cConf: "sim" }, false, true),
      k("Selos emitidos (total)", customers.reduce((s, c) => s + c.stamps.length, 0), { tab: "passports" }),
      k("Perto do 12º selo (10+)", customers.filter((c) => c.status === "ativo" && c.stamps.length >= 10).length, { tab: "passports" }),
      k("Sem pagamento confirmado", customers.filter((c) => !c.metrics.confirmed).length, { tab: "customers", cConf: "nao" }, true),
    ].join("");
    countUp();
  }

  $("next-list").addEventListener("change", async (e) => {
    const s = e.target.closest("[data-quick]");
    if (!s) return;
    const c = customers.find((x) => x.id === s.dataset.quick);
    if (!c || !c.next) return;
    if (s.value === "Entregue" && !confirm(`Marcar a caixa nº ${c.next.n} de ${c.name} como ENTREGUE?\n\nIsso carimba o selo nº ${c.next.n} no passaporte digital e não pode ser desfeito.`)) { renderSummary(); return; }
    const r = await API.admin.setBoxStatus(c.next.id, s.value, c.next.tracking, c.next.shipDate);
    if (!r.ok) toast(r.message);
    await load();
  });

  /* ---------- Clientes ---------- */
  SUB_STATUS.forEach((s) => ($("c-status").innerHTML += `<option>${s}</option>`));
  SITE.plans.forEach((p) => { $("c-plan").innerHTML += `<option value="${p.id}">${esc(p.name)}</option>`; $("f-plan").innerHTML += `<option value="${p.id}">${esc(p.name)}</option>`; });
  BOX_STATUS.forEach((s) => ($("f-status").innerHTML += `<option>${s}</option>`));
  ["c-q", "c-status", "c-plan", "c-conf"].forEach((id) => $(id).addEventListener("input", renderCustomers));
  ["f-status", "f-plan", "f-q"].forEach((id) => $(id).addEventListener("input", renderOrders));

  const addr = (c) => [c.address.line, c.address.complement, c.address.district].filter(Boolean).join(", ");
  const addr2 = (c) => [c.address.city, c.address.state].filter(Boolean).join(" - ") + (c.address.cep ? " · CEP " + c.address.cep : "");

  function renderCustomers() {
    const q = $("c-q").value.trim().toLowerCase();
    const list = customers.filter((c) =>
      (!q || (c.name + " " + c.email + " " + c.address.city).toLowerCase().includes(q)) &&
      (!$("c-status").value || c.status === $("c-status").value) &&
      (!$("c-plan").value || c.plan === $("c-plan").value) &&
      (!$("c-conf").value || (c.metrics.confirmed ? "sim" : "nao") === $("c-conf").value)
    );
    const planOpts = (sel) => SITE.plans.map((p) => `<option value="${p.id}"${p.id === sel ? " selected" : ""}>${esc(p.name)}</option>`).join("");
    $("c-table").innerHTML =
      `<thead><tr><th>Cliente</th><th>Plano</th><th>Status</th><th>Assinante desde</th><th>Endereço</th><th>Pagamento</th><th>Próxima caixa</th><th>Rastreio</th><th>Frequência</th><th>Ações</th></tr></thead><tbody>` +
      (list.length ? list.map((c) => `<tr data-id="${esc(c.id)}">
        <td><strong>${esc(c.name)}</strong>${c.role === "owner" ? ' <span class="chip">dono principal</span>' : c.role === "admin" ? ' <span class="chip">dono</span>' : ""}<small>${esc(c.email)}</small>${c.phone ? `<small>${esc(c.phone)}</small>` : ""}<small>${c.metrics.confirmed ? "Cliente confirmado" : "Sem pagamento confirmado"}</small></td>
        <td>${c.plan ? esc(plan(c.plan).name) : "—"}</td>
        <td>${st(c.status)}</td>
        <td>${d(c.since)}</td>
        <td>${addr(c) ? esc(addr(c)) + `<small>${esc(addr2(c))}</small>` : '<span class="tbd">sem endereço</span>'}</td>
        <td>${esc(c.pay.method)}<small>${esc(c.pay.status)}${c.pay.lastPaidAt ? " · último " + d(c.pay.lastPaidAt) : ""}</small></td>
        <td>${c.next ? "Nº " + c.next.n + "<small>" + (c.next.shipDate ? d(c.next.shipDate) : "sem data") + " · " + esc(c.next.status) + "</small>" : "—"}</td>
        <td>${c.next && c.next.tracking ? esc(c.next.tracking) : "—"}</td>
        <td>${c.metrics.delivered} caixa(s)<small>regularidade ${c.metrics.regularity}%</small></td>
        <td class="acts">
          <select data-f="plan" aria-label="Box">${planOpts(c.plan)}</select>
          <select data-f="method" aria-label="Forma de pagamento"><option>Pix</option><option>Cartão</option><option>Boleto</option></select>
          <button class="btn btn--small" data-act="pay" type="button">Registrar pagamento</button>
          ${c.plan && c.status !== "aguardando pagamento" ? `<select data-f="substatus" aria-label="Status da assinatura"><option value="">Mudar status...</option><option value="ativo">ativo</option><option value="inadimplente">inadimplente</option><option value="cancelado">cancelado</option></select>` : ""}
        </td>
      </tr>`).join("") : `<tr><td colspan="10" class="adm-empty">Nenhum cliente com esses filtros.</td></tr>`) + `</tbody>`;
  }

  $("c-table").addEventListener("click", async (e) => {
    const b = e.target.closest('[data-act="pay"]');
    if (!b) return;
    const tr = b.closest("tr"); const c = customers.find((x) => x.id === tr.dataset.id);
    if (!c) return;
    const p = tr.querySelector('[data-f="plan"]').value, m = tr.querySelector('[data-f="method"]').value;
    if (!confirm(`Registrar pagamento de ${c.name}: ${plan(p).name}, ${brl(plan(p).price)}, ${m}?\n\nIsso ativa a assinatura${c.passportCode ? "" : ", cria o passaporte"} e deixa a próxima caixa pronta para preparar.`)) return;
    b.disabled = true;
    const r = await API.admin.registerPayment(c.id, p, m);
    if (!r.ok) toast(r.message);
    await load();
  });
  $("c-table").addEventListener("change", async (e) => {
    const s = e.target.closest('[data-f="substatus"]');
    if (!s || !s.value) return;
    const c = customers.find((x) => x.id === s.closest("tr").dataset.id);
    if (!c) return;
    if (!confirm(`Mudar a assinatura de ${c.name} para "${s.value}"?`)) { s.value = ""; return; }
    const r = await API.admin.setSubscriptionStatus(c.id, s.value);
    if (!r.ok) toast(r.message);
    await load();
  });

  /* ---------- Envios ---------- */
  const insertFor = (n) =>
    n === 1 ? "Passaporte dos Mimos (novo) + carimbar selo 1"
    : n === SITE.passport.total ? `Carimbar selo ${n} e entregar o presente exclusivo (${SITE.passport.gift.replace("Presente exclusivo: ", "")})`
    : `Carimbar selo ${n} no passaporte`;

  function renderOrders() {
    const q = $("f-q").value.trim().toLowerCase();
    const all = customers.filter((c) => c.next);
    const fs = $("f-status").value;
    const list = all.filter((c) =>
      (!fs || (fs === "__late" ? LATE(c) : c.next.status === fs)) &&
      (!$("f-plan").value || c.plan === $("f-plan").value) &&
      (!q || (c.name + " " + c.address.city).toLowerCase().includes(q))
    );
    $("stats").innerHTML = [
      ["Envios", all.length],
      ["A preparar", all.filter((c) => c.next.status === "A preparar").length],
      ["Enviados", all.filter((c) => c.next.status === "Enviado").length],
      ["Receita mensal (estim.)", brl(all.filter((c) => c.status === "ativo").reduce((s, c) => s + plan(c.plan).price, 0))],
    ].map(([l, v]) => `<div class="stat"><small>${l}</small><strong>${v}</strong></div>`).join("");

    $("orders").innerHTML = list.length ? list.map((c) => `
      <article class="adm-card" data-id="${esc(c.id)}">
        <div class="adm-card__top">
          <div><h3>${esc(c.name)}</h3><p>${esc(c.email)}${c.phone ? " · " + esc(c.phone) : ""}</p></div>
          <span class="chip chip--box">${esc(plan(c.plan).name)}</span>
        </div>
        <div class="adm-grid">
          <p><small>Compra nº</small><strong>${c.next.n}ª caixa</strong></p>
          <p><small>Envio previsto</small>${c.next.shipDate ? d(c.next.shipDate) : "—"}</p>
          <p><small>Pagamento</small>${esc(c.pay.method)} · ${esc(c.pay.status)}</p>
          <p class="adm-wide"><small>Enviar para</small>${addr(c) ? esc(addr(c)) + "<br>" + esc(addr2(c)) : '<span class="tbd">cliente ainda não informou o endereço</span>'}</p>
          <p class="adm-wide adm-insert"><small>O que colocar nesta caixa</small>${esc(insertFor(c.next.n))}</p>
        </div>
        <div class="adm-actions">
          <label>Status
            <select data-act="box-status">${BOX_STATUS.map((s) => `<option${s === c.next.status ? " selected" : ""}>${s}</option>`).join("")}</select>
          </label>
          <label>Rastreio <input data-act="box-tracking" value="${esc(c.next.tracking)}" placeholder="Código dos Correios"></label>
          <label>Envio <input data-act="box-date" type="date" value="${esc(c.next.shipDate)}"></label>
        </div>
      </article>`).join("") : `<p class="adm-empty">Nenhuma caixa nesse filtro. As caixas aparecem quando um pagamento é registrado.</p>`;
  }

  $("orders").addEventListener("change", async (e) => {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const card = t.closest(".adm-card"); const c = customers.find((x) => x.id === card.dataset.id);
    if (!c || !c.next) return;
    const status = card.querySelector('[data-act="box-status"]').value;
    const tracking = card.querySelector('[data-act="box-tracking"]').value.trim();
    const date = card.querySelector('[data-act="box-date"]').value;
    if (status === "Entregue" && !confirm(`Marcar a caixa nº ${c.next.n} de ${c.name} como ENTREGUE?\n\nIsso carimba o selo nº ${c.next.n} no passaporte digital e não pode ser desfeito.`)) { renderOrders(); return; }
    const r = await API.admin.setBoxStatus(c.next.id, status, tracking, date);
    if (!r.ok) toast(r.message);
    await load();
  });

  /* ---------- Temas ---------- */
  const safeImg = (u) => (/^(https?:\/\/|assets\/|\.\/)/.test(String(u || "").trim()) ? String(u).trim() : "");
  function previewHtml(t) {
    if (!t) return "";
    const prods = (t.products || "").split("\n").map(dashless).filter(Boolean);
    const img = safeImg(t.image);
    return `<div class="theme-preview"><p class="eyebrow">Como vai aparecer na home · neste mês</p><h3>${esc(t.name)}</h3>
      ${t.description ? `<p>${esc(t.description)}</p>` : ""}
      ${prods.length ? `<ul>${prods.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${t.shipDate ? `<p><small>Envio: ${d(t.shipDate)}</small></p>` : ""}
      ${img ? `<img src="${esc(img)}" alt="Imagem do tema ${esc(t.name)}" width="1400" height="788">` : ""}</div>`;
  }
  function renderThemes() {
    const cur = themes.find((t) => t.isCurrent);
    $("theme-preview").innerHTML = previewHtml(cur);
    const pend = themes.filter((x) => !x.image).length;
    const pe = $("themes-pending");
    pe.hidden = !pend;
    pe.innerHTML = pend ? `<strong>${pend} tema(s) esperando a arte.</strong> Avise o Claude ("tem tema novo") que ele cria a imagem com o título no centro e já coloca no site.` : "";
    const shown = themes.filter((t) => t.showOnSite).length;
    $("vis-count").textContent = `${shown} de 4`;
    $("theme-list").innerHTML = themes.length
      ? themes.map((t) => `<article class="adm-card theme-card" data-id="${esc(t.id)}">
          ${safeImg(t.image) ? `<img class="theme-card__img" src="${esc(safeImg(t.image))}" alt="" width="1400" height="788" loading="lazy">` : `<div class="theme-card__img theme-card__img--none">sem arte ainda</div>`}
          <div class="adm-card__top"><div><h3>${esc(t.name)}</h3><p>Envio: ${d(t.shipDate)}</p></div>
            <span>${t.isCurrent ? '<span class="st st--ok">Tema do mês</span> ' : ""}${t.showOnSite ? '<span class="st st--warn">Aparece em Temas futuros</span>' : ""}</span></div>
          <p style="white-space:pre-line">${esc(t.description)}</p>
          ${t.image ? "" : `<p class="acc-muted">⏳ Arte ainda não criada.</p>`}
          <div class="theme-form__btns">
            <button class="btn btn--small ${t.showOnSite ? "" : "btn--ghost"}" data-act="vis" type="button">${t.showOnSite ? "✓ No site (tirar)" : "Mostrar no site"}</button>
            <button class="btn btn--small btn--ghost" data-act="edit" type="button">Editar</button>
            <button class="btn btn--small btn--ghost" data-act="current" type="button">${t.isCurrent ? "Tirar do mês" : "Marcar como do mês"}</button>
            <button class="btn btn--small btn--ghost btn--danger" data-act="del" type="button">Excluir</button>
          </div></article>`).join("")
      : `<p class="adm-empty">Nenhum tema cadastrado ainda.</p>`;
  }

  // Ideias de temas em alta
  $("ideas-grid").innerHTML = THEME_IDEAS.map((x, i) => `<article class="idea"><h3>${esc(x.title)}</h3><span class="chip">${esc(x.season)}</span><p>${esc(x.why)}</p><button class="btn btn--small btn--ghost" type="button" data-idea="${i}">Usar esta ideia</button></article>`).join("");
  $("ideas-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-idea]");
    if (!b) return;
    const x = THEME_IDEAS[+b.dataset.idea];
    form.reset(); form.elements.id.value = "";
    form.elements.name.value = x.title; form.elements.description.value = x.description; form.elements.products.value = x.products;
    showArt(""); artMsg("");
    const m = $("sug-msg"); m.textContent = "Ideia carregada! Ajuste o que quiser e clique em Salvar tema."; m.hidden = false;
    $("ideas-box").open = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* Sugestão automática de descrição e produtos (mesma forma de escrita das donas; sempre editável) */
  const form = $("theme-form");
  const themeErr = (m) => { $("theme-error").textContent = m; $("theme-error").hidden = !m; };
  function suggestInto(force) {
    const name = form.elements.name.value.trim();
    if (!name) return false;
    const s = ThemeArt.suggest(name, form.elements.description.value);
    const filled = [];
    if (force || !form.elements.description.value.trim()) { form.elements.description.value = s.description; filled.push("descrição"); }
    if (force || !form.elements.products.value.trim()) { form.elements.products.value = s.products; filled.push("ideias de produtos"); }
    return filled;
  }
  $("sug-btn").addEventListener("click", () => {
    const m = $("sug-msg");
    if (!form.elements.name.value.trim()) { m.textContent = "Escreva o título do tema primeiro."; m.hidden = false; return; }
    const had = form.elements.description.value.trim() || form.elements.products.value.trim();
    if (had && !confirm("Isso substitui a descrição e os produtos que já estão escritos. Continuar?")) return;
    suggestInto(true);
    m.textContent = "Pronto! São ideias para você ajustar do seu jeito antes de salvar."; m.hidden = false;
  });

  /* Imagem do tema: criar arte simples, enviar a própria ou escolher da biblioteca */
  const artMsg = (m, good) => { const el = $("art-msg"); el.textContent = m; el.hidden = !m; el.style.color = good ? "#25683b" : ""; };
  const showArt = (url) => { const im = $("art-preview"); if (url && safeImg(url)) { im.src = url; im.hidden = false; } else im.hidden = true; };
  $("art-url").addEventListener("input", () => showArt($("art-url").value));

  $("art-gen").addEventListener("click", async () => {
    const name = form.elements.name.value.trim();
    if (!name) return artMsg("Escreva o nome do tema primeiro.");
    const svg = ThemeArt.svg(name, form.elements.description.value);
    const im = $("art-preview"); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); im.hidden = false;
    artMsg("Salvando a arte...", true);
    const r = await API.admin.themes.uploadArt(new Blob([svg], { type: "image/svg+xml" }), "svg");
    if (!r.ok) return artMsg(r.message + " A prévia acima não foi salva.");
    $("art-url").value = r.url; showArt(r.url);
    artMsg("Arte simples criada! Clique em \"Salvar tema\". (A arte bonita fica por conta do Claude.)", true);
  });

  function shrink(file, maxW, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, maxW / img.width); const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img")); };
      img.src = url;
    });
  }
  $("art-file").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return artMsg("Use uma imagem JPG, PNG ou WEBP.");
    if (file.size > 12 * 1024 * 1024) return artMsg("Essa imagem é muito grande. Escolha uma de até 12 MB.");
    artMsg("Enviando a imagem...", true);
    try {
      const r = await API.admin.themes.uploadArt(await shrink(file, 1400, 0.85), "jpg");
      if (!r.ok) return artMsg(r.message);
      $("art-url").value = r.url; showArt(r.url);
      artMsg("Imagem enviada! Agora clique em \"Salvar tema\".", true);
    } catch (err) { artMsg("Não foi possível usar essa imagem. Tente outra."); }
  });
  $("art-lib").addEventListener("click", async () => {
    $("lib-grid").innerHTML = '<p class="acc-muted">Carregando...</p>';
    $("lib-modal").showModal();
    try {
      const files = await API.media.list();
      $("lib-grid").innerHTML = files.length
        ? files.map((f) => `<button type="button" class="file file--pick" data-url="${esc(f.url)}"><img src="${esc(f.url)}" alt="" width="300" height="200" loading="lazy"><small>${esc(f.name)}</small></button>`).join("")
        : '<p class="acc-muted">A biblioteca está vazia. Envie imagens na aba Arquivos.</p>';
    } catch (err) { $("lib-grid").innerHTML = '<p class="acc-muted">Não foi possível abrir a biblioteca.</p>'; }
  });
  $("lib-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-url]");
    if (!b) return;
    $("art-url").value = b.dataset.url; showArt(b.dataset.url);
    $("lib-modal").close();
    artMsg("Imagem escolhida! Agora clique em \"Salvar tema\".", true);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.elements.name.value.trim()) return themeErr("Informe o nome do tema.");
    themeErr("");
    const auto = suggestInto(false);
    if (auto && auto.length) toast("Você só escreveu o título, então sugeri " + auto.join(" e ") + ". Dá para editar depois.");
    const f2 = new FormData(form);
    const t = { id: f2.get("id") || "", name: String(f2.get("name")).trim(), description: String(f2.get("description") || "").trim(), products: String(f2.get("products") || ""), image: safeImg(f2.get("image")), shipDate: f2.get("shipDate") || "" };
    if (!LIVE && !t.id) t.id = "t" + Date.now();
    const r = await API.admin.themes.save(t);
    if (!r.ok) return themeErr(r.message);
    form.reset(); form.elements.id.value = ""; showArt(""); artMsg("");
    await load();
  });
  $("theme-reset").addEventListener("click", () => { form.reset(); form.elements.id.value = ""; themeErr(""); showArt(""); artMsg(""); });

  $("theme-list").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const id = b.closest(".adm-card").dataset.id;
    const t = themes.find((x) => x.id === id);
    if (!t) return;
    if (b.dataset.act === "edit") {
      form.elements.id.value = t.id; form.elements.name.value = t.name; form.elements.description.value = t.description;
      form.elements.products.value = t.products; form.elements.image.value = t.image; form.elements.shipDate.value = t.shipDate; showArt(t.image); artMsg("");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (b.dataset.act === "vis") {
      const r = await API.admin.themes.setVisible(id, !t.showOnSite);
      if (!r.ok) toast(r.message);
      await load();
    } else if (b.dataset.act === "current") {
      const r = await API.admin.themes.setCurrent(t.isCurrent ? null : id);
      if (!r.ok) toast(r.message);
      await load();
    } else if (b.dataset.act === "del" && confirm("Excluir este tema?")) {
      const r = await API.admin.themes.remove(id);
      if (!r.ok) toast(r.message);
      await load();
    }
  });
  $("vis-draw").addEventListener("click", async () => {
    if (!confirm("Sortear 4 temas para aparecerem em \"Temas futuros\"? Os escolhidos agora serão trocados.")) return;
    const r = await API.admin.themes.draw();
    if (!r.ok) toast(r.message);
    await load();
  });

  /* ---------- Passaportes ---------- */
  function renderPassportTable() {
    const rows = customers.filter((c) => c.passportCode);
    $("p-table").innerHTML =
      `<thead><tr><th>Código</th><th>Cliente</th><th>Status</th><th>Selos (registro)</th><th>Último selo</th><th>Regularidade</th><th>Confirmado</th></tr></thead><tbody>` +
      (rows.length ? rows.map((c) => `<tr><td class="mono">${esc(c.passportCode)}</td><td>${esc(c.name)}</td><td>${st(c.status)}</td><td>${c.stamps.length} de ${SITE.passport.total}</td><td>${d(c.metrics.lastStamp)}</td><td>${c.metrics.regularity}%</td><td>${c.metrics.confirmed ? "Sim" : "Não"}</td></tr>`).join("") : `<tr><td colspan="7" class="adm-empty">Os passaportes são criados quando o primeiro pagamento é registrado.</td></tr>`) + `</tbody>`;
  }
  $("verify-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const code = f.code.value.trim();
    if (!code) { $("verify-result").innerHTML = `<div class="verify-result verify-result--warn"><p>Digite o código do passaporte.</p></div>`; return; }
    const phys = f.stamps.value === "" ? NaN : parseInt(f.stamps.value, 10);
    const r = await API.admin.verifyPassport(code, phys);
    const c = r.customer;
    $("verify-result").innerHTML = `<div class="verify-result verify-result--${esc(r.level)}">
      <h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p>
      ${c ? `<p><strong>${esc(c.name)}</strong> · ${c.plan ? esc(plan(c.plan).name) : "—"} · ${st(c.status)}<br>
        Selos no registro: ${c.stamps.length} de ${SITE.passport.total}${c.stamps.length ? " (" + c.stamps.map((s) => s.n + "º em " + d(s.date)).join(", ") + ")" : ""}<br>
        Regularidade: ${c.metrics.regularity}% · Pagamento confirmado: ${c.metrics.confirmed ? "sim" : "não"}</p>` : ""}</div>`;
  });

  /* ---------- Arquivos (biblioteca) ---------- */
  const filesMsg = (m, good) => { const el = $("files-msg"); el.textContent = m; el.hidden = !m; el.style.color = good ? "#25683b" : ""; };
  const kb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");
  async function loadFiles() {
    if (!LIVE) { $("files-grid").innerHTML = '<p class="adm-empty">A biblioteca só funciona com o login real.</p>'; $("default-box").innerHTML = ""; return; }
    try {
      const [files, def] = await Promise.all([API.media.list(), API.settings.get("public.default_theme_image")]);
      $("default-box").innerHTML = def
        ? `<div class="default-box__in"><img src="${esc(def)}" alt="" width="1400" height="788"><div><strong>Imagem padrão dos temas</strong><p class="acc-muted">Aparece nos "Temas futuros" quando um tema ainda não tem arte.</p><button class="btn btn--small btn--ghost" type="button" data-def-clear>Tirar a imagem padrão</button></div></div>`
        : `<p class="acc-muted">Nenhuma imagem padrão para os temas. Escolha uma abaixo em "Usar como padrão dos temas".</p>`;
      $("files-grid").innerHTML = files.length
        ? files.map((f) => `<article class="file" data-name="${esc(f.name)}" data-url="${esc(f.url)}">
            <img src="${esc(f.url)}" alt="" width="300" height="200" loading="lazy">
            <strong title="${esc(f.name)}">${esc(f.name)}</strong><small>${kb(f.size)}</small>
            <div class="file__btns"><button class="btn btn--small btn--ghost" data-f="copy" type="button">Copiar endereço</button>
              <button class="btn btn--small btn--ghost" data-f="default" type="button">Usar como padrão dos temas</button>
              <button class="btn btn--small btn--ghost btn--danger" data-f="del" type="button">Apagar</button></div></article>`).join("")
        : '<p class="adm-empty">Nenhum arquivo ainda. Clique em "Enviar imagens".</p>';
    } catch (err) { filesMsg("Não foi possível abrir a biblioteca agora."); }
  }
  $("files-input").addEventListener("change", async (e) => {
    const list = [...(e.target.files || [])]; e.target.value = "";
    if (!list.length) return;
    let ok = 0, bad = [];
    for (const file of list) {
      filesMsg(`Enviando ${ok + bad.length + 1} de ${list.length}...`, true);
      try {
        let blob = file;
        if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("tipo");
        if (file.size > 2.5 * 1048576 && file.type !== "image/gif") blob = await shrink(file, 1600, 0.85);
        if (blob.size > 3 * 1048576) throw new Error("grande");
        const r = await API.media.upload(blob, file.name);
        if (!r.ok) throw new Error(r.message);
        ok++;
      } catch (err) { bad.push(file.name); }
    }
    filesMsg(`${ok} arquivo(s) enviado(s).${bad.length ? " Não consegui enviar: " + bad.join(", ") + " (use JPG, PNG, WEBP ou GIF de até 3 MB)." : ""}`, !bad.length);
    loadFiles();
  });
  $("tab-files").addEventListener("click", async (e) => {
    if (e.target.closest("[data-def-clear]")) { const r = await API.settings.set("public.default_theme_image", ""); if (!r.ok) toast(r.message); return loadFiles(); }
    const b = e.target.closest("[data-f]");
    if (!b) return;
    const card = b.closest(".file"); const name = card.dataset.name, url = card.dataset.url;
    if (b.dataset.f === "copy") {
      try { await navigator.clipboard.writeText(url); filesMsg("Endereço copiado! É só colar no campo Imagem do tema.", true); } catch (err) { filesMsg("Não consegui copiar. Endereço: " + url); }
    } else if (b.dataset.f === "default") {
      const r = await API.settings.set("public.default_theme_image", url);
      if (!r.ok) toast(r.message); else filesMsg("Pronto! Essa imagem agora é a padrão dos temas sem arte.", true);
      loadFiles();
    } else if (b.dataset.f === "del" && confirm("Apagar este arquivo? Se algum tema usa essa imagem, ela deixa de aparecer.")) {
      const r = await API.media.remove(name);
      if (!r.ok) toast(r.message);
      loadFiles();
    }
  });

  /* ---------- Assistente (ChatGPT) ---------- */
  let chat = [];
  function renderAssistantHint() {
    $("asst-hint").innerHTML = `<details><summary>Como ligar o assistente (só precisa fazer uma vez)</summary>
      <ol><li>Crie uma conta em <strong>platform.openai.com</strong> e gere uma chave em <em>API keys</em>. (O uso é pago por mensagem, em centavos; coloque um limite de gasto lá.)</li>
      <li>No <strong>Supabase</strong>, abra <em>Edge Functions → Secrets</em> e crie o segredo <code>OPENAI_API_KEY</code> com essa chave.</li>
      <li>Pronto: o assistente passa a responder aqui. A chave fica só no servidor e nunca aparece no site.</li></ol>
      <p class="acc-muted">Você entra e sai pelo mesmo login do painel: o botão <strong>Sair da conta</strong> aqui em cima desconecta você de tudo.</p></details>`;
  }
  function renderChat() {
    const box = $("chat");
    box.innerHTML = chat.length
      ? chat.map((m) => `<div class="msg msg--${m.role === "user" ? "me" : "ai"}"><p style="white-space:pre-line">${esc(m.content)}</p></div>`).join("")
      : '<div class="msg msg--ai"><p>Oi! Posso ajudar com ideias de tema, descrições, textos para o Instagram e dúvidas do painel. O que você precisa? 💜</p></div>';
    box.scrollTop = box.scrollHeight;
  }
  async function sendChat() {
    const input = $("chat-input"); const text = input.value.trim();
    if (!text) return;
    chat.push({ role: "user", content: text });
    input.value = ""; renderChat();
    const btn = $("chat-send"); btn.disabled = true; btn.textContent = "Pensando...";
    const r = await API.assistant.ask(chat.slice(-12));
    btn.disabled = false; btn.textContent = "Enviar";
    chat.push({ role: "assistant", content: r.ok ? r.reply || "(sem resposta)" : r.message });
    renderChat();
  }
  $("chat-form").addEventListener("submit", (e) => { e.preventDefault(); sendChat(); });
  $("chat-input").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } });
  $("asst-new").addEventListener("click", () => { chat = []; renderChat(); });

  /* ---------- Donos (só dono principal) ---------- */
  const ROLE_LABEL = { customer: "Cliente", admin: "Dono", owner: "Dono principal" };
  const nameOf = (a) => a.display_name || a.name || a.email || "—";
  $("o-q").addEventListener("input", renderOwners);

  function renderOwners() {
    if (!isOwner) return;
    const owners = accounts.filter((a) => a.role === "owner").length;
    $("owners-kpis").innerHTML = [
      ["Donos principais", `${owners} de 3`], ["Donos", accounts.filter((a) => a.role === "admin").length], ["Contas no total", accounts.length],
    ].map(([l, v]) => `<div class="kpi"><small>${l}</small><strong>${v}</strong></div>`).join("");
    const q = $("o-q").value.trim().toLowerCase();
    const list = accounts.filter((a) => !q || (nameOf(a) + " " + (a.email || "")).toLowerCase().includes(q));
    const opt = (v, cur) => `<option value="${v}"${v === cur ? " selected" : ""}>${ROLE_LABEL[v]}</option>`;
    $("o-table").innerHTML = `<thead><tr><th>Conta</th><th>Cargo atual</th><th>Mudar para</th></tr></thead><tbody>` +
      (list.length ? list.map((a) => `<tr data-id="${esc(a.id)}">
        <td><strong>${esc(nameOf(a))}</strong><small>${esc(a.email || "")}</small></td>
        <td><span class="chip">${esc(ROLE_LABEL[a.role] || a.role)}</span></td>
        <td class="acts"><select data-f="role" aria-label="Novo cargo">${opt("customer", a.role)}${opt("admin", a.role)}${opt("owner", a.role)}</select>
          <button class="btn btn--small" data-act="role" type="button">Aplicar</button></td>
      </tr>`).join("") : `<tr><td colspan="3" class="adm-empty">Nenhuma conta encontrada.</td></tr>`) + `</tbody>`;
    const byId = Object.fromEntries(accounts.map((a) => [a.id, a]));
    $("o-log").innerHTML = roleLog.length
      ? roleLog.map((l) => `<li><span><strong>${esc(byId[l.target] ? nameOf(byId[l.target]) : "conta removida")}</strong>: ${esc(ROLE_LABEL[l.old_role] || l.old_role)} → ${esc(ROLE_LABEL[l.new_role] || l.new_role)}</span><span>por ${esc(byId[l.changed_by] ? nameOf(byId[l.changed_by]) : "—")} · ${new Date(l.changed_at).toLocaleString("pt-BR")}</span></li>`).join("")
      : `<li>Nenhuma mudança ainda.</li>`;
  }
  $("o-table").addEventListener("click", async (e) => {
    const b = e.target.closest('[data-act="role"]');
    if (!b) return;
    const tr = b.closest("tr"); const a = accounts.find((x) => x.id === tr.dataset.id);
    const role = tr.querySelector('[data-f="role"]').value;
    if (!a || a.role === role) return;
    if (!confirm(`Mudar o cargo de ${nameOf(a)} (${a.email || ""}) para "${ROLE_LABEL[role]}"?${role !== "customer" ? "\n\nEssa pessoa passa a ver os dados de todos os clientes." : "\n\nEssa pessoa perde o acesso ao painel."}`)) return;
    b.disabled = true;
    const r = await API.owner.setRole(a.id, role);
    if (!r.ok) toast(r.message);
    await load();
  });

  start();
})();
