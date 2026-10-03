/* Painel dos donos. Tudo passa por API.admin (js/services/api.js).
   Em modo "live" só funciona para quem tem cargo "admin" no banco; a proteção de verdade é do banco (RLS e funções),
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

  let customers = [];
  let themes = [];
  let isOwner = false;
  let accounts = [];
  let roleLog = [];

  const toast = (msg) => { const t = $("toast"); t.textContent = msg; t.hidden = !msg; if (msg) setTimeout(() => { t.hidden = true; }, 6000); };

  /* ---------- entrada ---------- */
  async function start() {
    const user = await API.auth.currentUser();
    if (LIVE && !user) return showGate();
    if (LIVE && !(await API.admin.isAdmin())) {
      showGate("Esta conta não tem acesso ao painel dos donos. Entre com a conta de dono.");
      return;
    }
    if (LIVE) { const me = await API.profile.me(); isOwner = !!me && me.role === "owner"; }
    $("tab-owners-btn").hidden = !isOwner;
    $("gate").hidden = true;
    $("app").hidden = false;
    $("btn-logout").hidden = !LIVE;
    $("adm-banner").innerHTML = LIVE
      ? "<strong>Painel dos donos.</strong> Você está logado como dono e vê os dados reais dos clientes. Cuide bem deles."
      : "<strong>Protótipo, sem segurança real.</strong> Os clientes mostrados são <strong>fictícios (demonstração)</strong> e nada é salvo de verdade.";
    $("themes-hint").innerHTML = LIVE
      ? "Cadastre o tema de cada mês. O tema marcado como <strong>do mês</strong> aparece na página principal, na seção \"Tema do mês\"."
      : "Protótipo: os temas ficam só neste navegador e não mudam a página principal.";
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
    /* ---------- Donos (só dono principal) ---------- */
  const ROLE_LABEL = { customer: "Cliente", admin: "Dono", owner: "Dono principal" };
  const nameOf = (a) => a.display_name || a.name || a.email || "—";
  ["o-q"].forEach((id) => $(id).addEventListener("input", renderOwners));

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
  });
  $("btn-logout").addEventListener("click", async () => { await API.auth.signOut(); location.reload(); });
  $("btn-refresh").addEventListener("click", () => load());
  $("logo").addEventListener("click", (e) => { e.preventDefault(); if (!$("app").hidden) load(); window.scrollTo({ top: 0, behavior: "smooth" }); });

  async function load() {
    try {
      [customers, themes] = await Promise.all([API.admin.customers(), API.admin.themes.list()]);
      if (isOwner) [accounts, roleLog] = await Promise.all([API.owner.accounts(), API.owner.log()]);
    } catch (err) {
      toast("Não foi possível carregar os dados agora. Tente atualizar.");
      return;
    }
    renderAll();
  }
  function renderAll() { renderSummary(); renderCustomers(); renderOrders(); renderThemes(); renderPassportTable(); if (isOwner) renderOwners(); }

  /* ---------- abas ---------- */
  const panels = ["summary", "customers", "orders", "themes", "passports", "owners"];
  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    document.querySelectorAll("#tabs button[data-tab]").forEach((x) => x.classList.toggle("is-on", x === b));
    panels.forEach((p) => ($("tab-" + p).hidden = p !== b.dataset.tab));
  });

  /* ---------- Resumo ---------- */
  function renderSummary() {
    const subs = customers.filter((c) => c.status !== "aguardando pagamento");
    const active = customers.filter((c) => c.status === "ativo");
    const k = (label, val, bad) => `<div class="kpi${bad ? " kpi--bad" : ""}"><small>${label}</small><strong>${val}</strong></div>`;
    const withNext = customers.filter((c) => c.next);
    $("kpis").innerHTML = [
      k("Assinantes (já pagaram)", subs.length),
      k("Ativos", active.length),
      k("Cancelados", customers.filter((c) => c.status === "cancelado").length),
      k("Pagamento em atraso", customers.filter((c) => c.status === "inadimplente").length, true),
      k("Receita mensal (estim.)", brl(active.reduce((s, c) => s + plan(c.plan).price, 0))),
      k("Boxes a preparar", withNext.filter((c) => c.next.status === "A preparar" || c.next.status === "Em preparação").length),
      k("Boxes prontas", withNext.filter((c) => c.next.status === "Pronta para envio").length),
      k("Boxes enviadas", withNext.filter((c) => c.next.status === "Enviado").length),
      k("Pedidos atrasados", withNext.filter(LATE).length, true),
      k("Aguardando pagamento", customers.filter((c) => c.status === "aguardando pagamento").length),
    ].join("");

    const upcoming = withNext.filter((c) => c.next.status !== "Enviado" && c.next.status !== "Entregue").sort((a, b) => (a.next.shipDate || "9").localeCompare(b.next.shipDate || "9"));
    $("next-list").innerHTML = upcoming.length
      ? upcoming.map((c) => `<li><span><strong>${esc(c.name)}</strong> · ${esc(plan(c.plan).name)} · caixa nº ${c.next.n}</span><span class="${LATE(c) ? "late" : ""}">${LATE(c) ? "Atrasado · " : ""}${c.next.shipDate ? d(c.next.shipDate) : "sem data de envio"} · ${esc(c.next.status)}${c.status === "inadimplente" ? " · pagamento em atraso" : ""}</span></li>`).join("")
      : `<li>Nenhum envio pendente.</li>`;

    const confirmed = customers.filter((c) => c.metrics.confirmed);
    const avgReg = confirmed.length ? Math.round(confirmed.reduce((s, c) => s + c.metrics.regularity, 0) / confirmed.length) : 0;
    $("freq").innerHTML = [
      k("Regularidade média", avgReg + "%"),
      k("Selos emitidos (total)", customers.reduce((s, c) => s + c.stamps.length, 0)),
      k("Perto do 12º selo (10+)", customers.filter((c) => c.status === "ativo" && c.stamps.length >= 10).length),
      k("Sem pagamento confirmado", customers.filter((c) => !c.metrics.confirmed).length, true),
    ].join("");
  }

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
    const list = all.filter((c) =>
      (!$("f-status").value || c.next.status === $("f-status").value) &&
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
      </article>`).join("") : `<p class="adm-empty">Nenhuma caixa em aberto. Elas aparecem quando um pagamento é registrado.</p>`;
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
    const prods = (t.products || "").split("\n").map((x) => x.trim()).filter(Boolean);
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
    $("theme-list").innerHTML = themes.length
      ? themes.map((t) => `<article class="adm-card" data-id="${esc(t.id)}">
          <div class="adm-card__top"><div><h3>${esc(t.name)}</h3><p>Envio: ${d(t.shipDate)}</p></div>${t.isCurrent ? '<span class="st st--ok">Tema do mês</span>' : ""}</div>
          <p style="white-space:pre-line">${esc(t.description)}</p>
          ${t.image ? "" : `<p class="acc-muted">⏳ Arte ainda não criada.</p>`}
          <div class="theme-form__btns">
            <button class="btn btn--small btn--ghost" data-act="edit" type="button">Editar</button>
            <button class="btn btn--small btn--ghost" data-act="current" type="button">${t.isCurrent ? "Tirar do mês" : "Marcar como do mês"}</button>
            <button class="btn btn--small btn--ghost btn--danger" data-act="del" type="button">Excluir</button>
          </div></article>`).join("")
      : `<p class="adm-empty">Nenhum tema cadastrado ainda.</p>`;
  }
  const form = $("theme-form");
  /* ---------- Sugestão automática de descrição e produtos (regras por assunto; sempre editável) ---------- */
  function suggestInto(force) {
    const name = form.elements.name.value.trim();
    if (!name) return false;
    const s = ThemeArt.suggest(name, form.elements.description.value);
    let filled = [];
    if (force || !form.elements.description.value.trim()) { form.elements.description.value = s.description; filled.push("descrição"); }
    if (force || !form.elements.products.value.trim()) { form.elements.products.value = s.products; filled.push("ideias de produtos"); }
    return filled;
  }
  $("sug-btn").addEventListener("click", () => {
    const name = form.elements.name.value.trim();
    const m = $("sug-msg");
    if (!name) { m.textContent = "Escreva o título do tema primeiro."; m.hidden = false; return; }
    const had = form.elements.description.value.trim() || form.elements.products.value.trim();
    if (had && !confirm("Isso substitui a descrição e os produtos que já estão escritos. Continuar?")) return;
    suggestInto(true);
    m.textContent = "Pronto! São ideias para você ajustar do seu jeito antes de salvar."; m.hidden = false;
  });
  const themeErr = (m) => { $("theme-error").textContent = m; $("theme-error").hidden = !m; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = String(f.get("name") || "").trim();
    if (!name) return themeErr("Informe o nome do tema.");
    themeErr("");
    const auto = suggestInto(false);
    if (auto && auto.length) { toast("Você só escreveu o título, então sugeri " + auto.join(" e ") + ". Dá para editar depois."); }
    const f2 = new FormData(form);
    const t = { id: f2.get("id") || "", name, description: String(f2.get("description") || "").trim(), products: String(f2.get("products") || ""), image: safeImg(f2.get("image")), shipDate: f2.get("shipDate") || "" };
    if (!LIVE && !t.id) t.id = "t" + Date.now();
    const r = await API.admin.themes.save(t);
    if (!r.ok) return themeErr(r.message);
    form.reset(); form.elements.id.value = ""; showArt(""); artMsg("");
    await load();
  });
  /* ---------- Imagem do tema: criar arte pelo nome/descrição ou enviar a própria ---------- */
  const artMsg = (m, good) => { const el = $("art-msg"); el.textContent = m; el.hidden = !m; el.style.color = good ? "#25683b" : ""; };
  const showArt = (url) => { const im = $("art-preview"); if (url && safeImg(url)) { im.src = url; im.hidden = false; } else im.hidden = true; };
  $("art-url").addEventListener("input", () => showArt($("art-url").value));

  $("art-gen").addEventListener("click", async () => {
    const name = form.elements.name.value.trim();
    if (!name) return artMsg("Escreva o nome do tema primeiro (por exemplo: Jardim Encantado).");
    const svg = ThemeArt.svg(name, form.elements.description.value);
    // prévia imediata, mesmo antes de enviar
    const im = $("art-preview"); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); im.hidden = false;
    artMsg("Salvando a arte...", true);
    const r = await API.admin.themes.uploadArt(new Blob([svg], { type: "image/svg+xml" }), "svg");
    if (!r.ok) return artMsg(r.message + " A prévia acima não foi salva.");
    $("art-url").value = r.url; showArt(r.url);
    artMsg("Arte criada! Agora clique em \"Salvar tema\". Se quiser outra, mude a descrição e crie de novo.", true);
  });

  // Reduz a foto (máx. 1200 px de largura) antes de enviar
  function shrinkPhoto(file) {
    return new Promise((resolve, reject) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 1200 / img.width); const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.85);
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
      const r = await API.admin.themes.uploadArt(await shrinkPhoto(file), "jpg");
      if (!r.ok) return artMsg(r.message);
      $("art-url").value = r.url; showArt(r.url);
      artMsg("Imagem enviada! Agora clique em \"Salvar tema\".", true);
    } catch (err) { artMsg("Não foi possível usar essa imagem. Tente outra."); }
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

  start();
})();
