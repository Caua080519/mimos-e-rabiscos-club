/* Painel dos donos: Resumo, Clientes, Temas e Passaportes (PROTÓTIPO, dados fictícios via API).
   A aba Envios continua em js/admin.js. */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const d = (s) => (s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—");
  const plan = (id) => SITE.plans.find((p) => p.id === id) || { name: id, price: 0 };
  const chipFor = (st) => ({ ativo: "ok", cancelado: "off", inadimplente: "bad", "aguardando pagamento": "warn" }[st] || "warn");
  const st = (s) => `<span class="st st--${chipFor(s)}">${esc(s)}</span>`;
  const LATE = (c) => c.next && c.next.status !== "Enviado" && c.next.status !== "Entregue" && c.next.shipDate < DEMO_TODAY;

  let customers = [];

  /* ---------- abas ---------- */
  const panels = ["summary", "customers", "orders", "themes", "passports"];
  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    document.querySelectorAll("#tabs button").forEach((x) => x.classList.toggle("is-on", x === b));
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

    const upcoming = withNext.filter((c) => c.next.status !== "Enviado" && c.next.status !== "Entregue").sort((a, b) => a.next.shipDate.localeCompare(b.next.shipDate));
    $("next-list").innerHTML = upcoming.length
      ? upcoming.map((c) => `<li><span><strong>${esc(c.name)}</strong> · ${esc(plan(c.plan).name)} · caixa nº ${c.next.n}</span><span class="${LATE(c) ? "late" : ""}">${LATE(c) ? "Atrasado · " : ""}${d(c.next.shipDate)} · ${esc(c.next.status)}${c.status === "inadimplente" ? " · pagamento em atraso" : ""}</span></li>`).join("")
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
  ["ativo", "cancelado", "inadimplente", "aguardando pagamento"].forEach((s) => ($("c-status").innerHTML += `<option>${s}</option>`));
  SITE.plans.forEach((p) => ($("c-plan").innerHTML += `<option value="${p.id}">${esc(p.name)}</option>`));
  ["c-q", "c-status", "c-plan", "c-conf"].forEach((id) => $(id).addEventListener("input", renderCustomers));

  function renderCustomers() {
    const q = $("c-q").value.trim().toLowerCase();
    const list = customers.filter((c) =>
      (!q || (c.name + " " + c.email + " " + c.address.city).toLowerCase().includes(q)) &&
      (!$("c-status").value || c.status === $("c-status").value) &&
      (!$("c-plan").value || c.plan === $("c-plan").value) &&
      (!$("c-conf").value || (c.metrics.confirmed ? "sim" : "nao") === $("c-conf").value)
    );
    $("c-table").innerHTML =
      `<thead><tr><th>Cliente</th><th>Plano</th><th>Status</th><th>Assinante desde</th><th>Endereço</th><th>Pagamento</th><th>Próxima caixa</th><th>Rastreio</th><th>Frequência</th></tr></thead><tbody>` +
      (list.length ? list.map((c) => `<tr>
        <td><strong>${esc(c.name)}</strong><small>${esc(c.email)}</small><small>${c.metrics.confirmed ? "Cliente confirmado" : "Sem pagamento confirmado"}</small></td>
        <td>${esc(plan(c.plan).name)}</td>
        <td>${st(c.status)}</td>
        <td>${d(c.since)}</td>
        <td>${esc(c.address.line)}<small>${esc(c.address.city)} · CEP ${esc(c.address.cep)}</small></td>
        <td>${esc(c.pay.method)}<small>${esc(c.pay.status)}${c.pay.lastPaidAt ? " · último " + d(c.pay.lastPaidAt) : ""}</small></td>
        <td>${c.next ? "Nº " + c.next.n + "<small>" + d(c.next.shipDate) + " · " + esc(c.next.status) + "</small>" : "—"}</td>
        <td>${c.next && c.next.tracking ? esc(c.next.tracking) : "—"}</td>
        <td>${c.metrics.delivered} caixa(s)<small>regularidade ${c.metrics.regularity}%</small></td>
      </tr>`).join("") : `<tr><td colspan="9" class="adm-empty">Nenhum cliente com esses filtros.</td></tr>`) + `</tbody>`;
  }

  /* ---------- Temas (protótipo: localStorage, a home não lê) ---------- */
  let themes = [];
  let currentThemeId = "";
  const safeImg = (u) => (/^(https?:\/\/|assets\/|\.\/)/.test(String(u || "").trim()) ? String(u).trim() : "");

  function previewHtml(t) {
    if (!t) return "";
    const prods = (t.products || "").split("\n").map((x) => x.trim()).filter(Boolean);
    const img = safeImg(t.image);
    return `<div class="theme-preview"><p class="eyebrow">Como vai aparecer na home · neste mês</p><h3>${esc(t.name)}</h3>
      ${t.description ? `<p>${esc(t.description)}</p>` : ""}
      ${prods.length ? `<ul>${prods.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${t.shipDate ? `<p><small>Envio: ${d(t.shipDate)}</small></p>` : ""}
      ${img ? `<img src="${esc(img)}" alt="Imagem do tema ${esc(t.name)}" width="400" height="300">` : ""}</div>`;
  }

  function renderThemes() {
    $("theme-preview").innerHTML = previewHtml(themes.find((t) => t.id === currentThemeId));
    $("theme-list").innerHTML = themes.length
      ? themes.map((t) => `<article class="adm-card" data-id="${esc(t.id)}">
          <div class="adm-card__top"><div><h3>${esc(t.name)}</h3><p>Envio: ${d(t.shipDate)}</p></div>${t.id === currentThemeId ? '<span class="st st--ok">Tema do mês (prévia)</span>' : ""}</div>
          <p>${esc(t.description || "")}</p>
          <div class="theme-form__btns">
            <button class="btn btn--small btn--ghost" data-act="edit">Editar</button>
            <button class="btn btn--small btn--ghost" data-act="current">Marcar como do mês</button>
            <button class="btn btn--small btn--ghost btn--danger" data-act="del">Excluir</button>
          </div></article>`).join("")
      : `<p class="adm-empty">Nenhum tema cadastrado ainda.</p>`;
  }

  const form = $("theme-form");
  const themeErr = (m) => { $("theme-error").textContent = m; $("theme-error").hidden = !m; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = String(f.get("name") || "").trim();
    if (!name) return themeErr("Informe o nome do tema.");
    themeErr("");
    const t = { id: f.get("id") || "t" + Date.now(), name, description: String(f.get("description") || "").trim(), products: String(f.get("products") || ""), image: String(f.get("image") || "").trim(), shipDate: f.get("shipDate") || "" };
    const i = themes.findIndex((x) => x.id === t.id);
    if (i >= 0) themes[i] = t; else themes.push(t);
    await API.themes.save(themes);
    form.reset(); form.elements.id.value = "";
    renderThemes();
  });
  $("theme-reset").addEventListener("click", () => { form.reset(); form.elements.id.value = ""; themeErr(""); });
  $("theme-list").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const id = b.closest(".adm-card").dataset.id;
    const t = themes.find((x) => x.id === id);
    if (!t) return;
    if (b.dataset.act === "edit") {
      form.elements.id.value = t.id; form.elements.name.value = t.name; form.elements.description.value = t.description;
      form.elements.products.value = t.products; form.elements.image.value = t.image; form.elements.shipDate.value = t.shipDate;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (b.dataset.act === "current") {
      currentThemeId = id; await API.themes.setCurrent(id); renderThemes();
    } else if (b.dataset.act === "del" && confirm("Excluir este tema?")) {
      themes = themes.filter((x) => x.id !== id);
      if (currentThemeId === id) { currentThemeId = ""; await API.themes.setCurrent(""); }
      await API.themes.save(themes); renderThemes();
    }
  });

  /* ---------- Passaportes ---------- */
  function renderPassportTable() {
    const rows = customers.filter((c) => c.passportCode);
    $("p-table").innerHTML =
      `<thead><tr><th>Código</th><th>Cliente</th><th>Status</th><th>Selos (registro)</th><th>Último selo</th><th>Regularidade</th><th>Confirmado</th></tr></thead><tbody>` +
      rows.map((c) => `<tr><td class="mono">${esc(c.passportCode)}</td><td>${esc(c.name)}</td><td>${st(c.status)}</td><td>${c.stamps.length} de ${SITE.passport.total}</td><td>${d(c.metrics.lastStamp)}</td><td>${c.metrics.regularity}%</td><td>${c.metrics.confirmed ? "Sim" : "Não"}</td></tr>`).join("") + `</tbody>`;
  }

  $("verify-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const code = f.code.value.trim();
    if (!code) { $("verify-result").innerHTML = `<div class="verify-result verify-result--warn"><p>Digite o código do passaporte.</p></div>`; return; }
    const phys = f.stamps.value === "" ? NaN : parseInt(f.stamps.value, 10);
    const r = await API.passports.verify(code, phys);
    const c = r.customer;
    $("verify-result").innerHTML = `<div class="verify-result verify-result--${r.level}">
      <h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p>
      ${c ? `<p><strong>${esc(c.name)}</strong> · ${esc(plan(c.plan).name)} · ${st(c.status)}<br>
        Selos no registro: ${c.stamps.length} de ${SITE.passport.total}${c.stamps.length ? " (" + c.stamps.map((s) => s.n + "º em " + d(s.date)).join(", ") + ")" : ""}<br>
        Regularidade: ${c.metrics.regularity}% · Pagamento confirmado: ${c.metrics.confirmed ? "sim" : "não"}</p>` : ""}</div>`;
  });

  /* ---------- início ---------- */
  (async function init() {
    customers = await API.customers.list();
    themes = await API.themes.list();
    currentThemeId = await API.themes.currentId();
    renderSummary(); renderCustomers(); renderThemes(); renderPassportTable();
  })();
})();
