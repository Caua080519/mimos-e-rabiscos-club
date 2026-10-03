/* Área do cliente (PROTÓTIPO). Lê tudo via API (js/services/api.js), com dados fictícios. */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const d = (s) => (s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—");
  const monthName = (s) => new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const addMonths = (s, n) => { const x = new Date(s + "T12:00:00"); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
  const plan = (id) => SITE.plans.find((p) => p.id === id) || { name: id, price: 0, items: "" };
  const STEPS = ["A preparar", "Em preparação", "Pronta para envio", "Enviado", "Entregue"];

  $("year").textContent = new Date().getFullYear();

  function proto(title, text) {
    $("modal-title").textContent = title;
    $("modal-text").textContent = text;
    const m = $("modal");
    if (m.showModal) m.showModal(); else alert(title + "\n\n" + text);
  }

  const statusChip = (st) => {
    const map = { ativo: "ok", cancelado: "off", inadimplente: "bad", "aguardando pagamento": "warn" };
    return `<span class="st st--${map[st] || "warn"}">${esc(st)}</span>`;
  };

  function render(c) {
    const p = plan(c.plan);
    $("acc-hello").textContent = `Olá, ${c.name.split(" ")[0]} ${c.name.split(" ")[1] || ""}!`.trim();
    const nextBilling = c.status === "ativo" || c.status === "inadimplente" ? addMonths(c.pay.lastPaidAt, 1) : "";
    const nxt = c.next;
    const stepIdx = nxt ? STEPS.indexOf(nxt.status) : -1;

    // Passaporte digital: 12 espaços, carimbos do registro oficial
    const stamps = c.stamps;
    let stampsHtml = "";
    for (let i = 1; i <= SITE.passport.total; i++) {
      const s = stamps.find((x) => x.n === i);
      stampsHtml += `<div class="stamp${s ? " stamp--on" : ""}${i === SITE.passport.total ? " stamp--gift" : ""}" title="${s ? "Selo " + i + " em " + d(s.date) : "Selo " + i + " ainda não recebido"}">${i === SITE.passport.total ? "★" : s ? "♥" : i}</div>`;
    }

    const history = Array.from({ length: c.delivered }, (_, i) => i + 1).reverse().map((n) => {
      const date = addMonths(c.since, n - 1);
      return `<li><span class="hist__ok">✓</span><div><strong>Caixa nº ${n}</strong><small>${esc(monthName(date))} · Tema: <span class="tbd">em definição</span></small></div></li>`;
    }).join("");

    $("acc-grid").innerHTML = `
      <section class="acc-card">
        <h2>Meu plano</h2>
        <p class="acc-big">${esc(p.name)} <span>${brl(p.price)}/mês</span></p>
        <p class="acc-muted">${esc(p.items)} por caixa (estimativa)</p>
        <dl class="acc-dl">
          <div><dt>Assinante desde</dt><dd>${d(c.since)}</dd></div>
          <div><dt>Próxima cobrança</dt><dd>${nextBilling ? d(nextBilling) : "—"}</dd></div>
        </dl>
      </section>

      <section class="acc-card">
        <h2>Status da assinatura</h2>
        <p>${statusChip(c.status)}</p>
        <p class="acc-muted">${
          c.status === "ativo" ? "Tudo certo com a sua assinatura."
          : c.status === "inadimplente" ? "Há um pagamento em atraso. Regularize para continuar recebendo as caixas."
          : c.status === "cancelado" ? "Assinatura cancelada em " + d(c.cancelledAt) + "."
          : "Estamos aguardando a confirmação do pagamento."
        }</p>
      </section>

      <section class="acc-card acc-card--wide">
        <h2>Minha próxima caixa</h2>
        ${nxt ? `
          <p class="acc-big">Caixa nº ${nxt.n}</p>
          <dl class="acc-dl">
            <div><dt>Envio previsto</dt><dd>${d(nxt.shipDate)}</dd></div>
            <div><dt>Tema</dt><dd><span class="tbd">em definição</span></dd></div>
            <div><dt>Rastreio</dt><dd>${nxt.tracking ? esc(nxt.tracking) : "Ainda não enviado"}</dd></div>
          </dl>
          ${nxt.n === 1 ? `<p class="acc-note">Seu Passaporte dos Mimos vem nesta primeira caixa.</p>` : ""}
          <ol class="steps-line">${STEPS.map((s, i) => `<li class="${i < stepIdx ? "done" : i === stepIdx ? "now" : ""}"><span></span>${s}</li>`).join("")}</ol>
        ` : `<p class="acc-muted">Não há caixa a caminho no momento.</p>`}
      </section>

      <section class="acc-card acc-card--wide">
        <h2>Passaporte dos Mimos digital</h2>
        ${c.passportCode ? `
          <p class="acc-muted">Este é o registro oficial dos seus selos. A equipe confere o passaporte físico com ele.</p>
          <div class="stamps stamps--acc">${stampsHtml}</div>
          <dl class="acc-dl">
            <div><dt>Código do passaporte</dt><dd class="mono">${esc(c.passportCode)}</dd></div>
            <div><dt>Selos</dt><dd>${stamps.length} de ${SITE.passport.total}</dd></div>
            <div><dt>Último selo</dt><dd>${stamps.length ? d(stamps[stamps.length - 1].date) : "—"}</dd></div>
          </dl>
          <p class="acc-muted tbd">${esc(SITE.passport.gift)}</p>
        ` : `<p class="acc-muted">O passaporte é criado quando o primeiro pagamento for confirmado.</p>`}
      </section>

      <section class="acc-card acc-card--wide">
        <h2>Histórico de caixas</h2>
        ${history ? `<ul class="hist">${history}</ul>` : `<p class="acc-muted">Você ainda não recebeu nenhuma caixa. A primeira está a caminho.</p>`}
      </section>

      <section class="acc-card">
        <h2>Endereço de entrega</h2>
        <p>${esc(c.address.line)}<br>${esc(c.address.city)}<br>CEP ${esc(c.address.cep)}</p>
        <button class="btn btn--ghost btn--small" data-proto="Alterar endereço">Alterar endereço</button>
      </section>

      <section class="acc-card">
        <h2>Forma de pagamento</h2>
        <p>${esc(c.pay.method)} · <span class="st st--${c.pay.status === "pago" ? "ok" : c.pay.status === "atrasado" ? "bad" : "warn"}">${esc(c.pay.status)}</span></p>
        <p class="acc-muted">Último pagamento: ${d(c.pay.lastPaidAt)}</p>
        <button class="btn btn--ghost btn--small" data-proto="Forma de pagamento">Alterar forma de pagamento</button>
      </section>

      <section class="acc-card">
        <h2>Alterar plano</h2>
        <label class="acc-sel">Novo plano
          <select id="acc-newplan">${SITE.plans.map((x) => `<option value="${x.id}"${x.id === c.plan ? " selected" : ""}>${esc(x.name)} · ${brl(x.price)}/mês</option>`).join("")}</select>
        </label>
        <button class="btn btn--small" data-proto="Alterar plano">Solicitar troca de plano</button>
      </section>

      <section class="acc-card">
        <h2>Cancelar assinatura</h2>
        <p class="acc-muted">Regras de cancelamento: <span class="tbd">em definição</span>.</p>
        <button class="btn btn--ghost btn--small btn--danger" data-proto="Cancelar assinatura">Cancelar assinatura</button>
      </section>`;
  }

  $("acc-grid").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-proto]");
    if (!b) return;
    const what = b.dataset.proto;
    const res = what === "Cancelar assinatura" ? await API.subscriptions.cancel()
      : what === "Alterar plano" ? await API.subscriptions.changePlan()
      : what === "Alterar endereço" ? await API.subscriptions.updateAddress()
      : await API.payments.updatePaymentMethod();
    proto(what + " (protótipo)", res.message + " Nenhuma alteração foi feita.");
  });

  (async function init() {
    const list = await API.customers.list();
    $("acc-who").innerHTML = list.map((c) => `<option value="${c.id}">${esc(c.name)} · ${esc(c.status)}</option>`).join("");
    $("acc-who").addEventListener("change", async () => render(await API.customers.get($("acc-who").value)));
    render(list[0]);
  })();
})();
