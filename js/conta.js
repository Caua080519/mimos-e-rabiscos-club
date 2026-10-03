/* Área do cliente (PROTÓTIPO). Lê tudo via API (js/services/api.js), com dados fictícios.
   Só abre com uma sessão (a de demonstração, enquanto não há login real). */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const d = (s) => (s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—");
  const monthName = (s) => new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const addMonths = (s, n) => { const x = new Date(s + "T12:00:00"); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
  const plan = (id) => SITE.plans.find((p) => p.id === id) || { name: "", price: 0, items: "" };
  const STEPS = ["A preparar", "Em preparação", "Pronta para envio", "Enviado", "Entregue"];
  const STEP_LABEL = { Enviado: "Enviado (a caminho)" };
  const PAID_BOX = ["A preparar", "Em preparação", "Pronta para envio", "Enviado"];

  $("year").textContent = new Date().getFullYear();

  function proto(title, text) {
    $("modal-title").textContent = title;
    $("modal-text").textContent = text;
    const m = $("modal");
    if (m.showModal) m.showModal(); else alert(title + "\n\n" + text);
  }

  const statusChip = (s) => `<span class="st st--${{ ativo: "ok", cancelado: "off", inadimplente: "bad", "aguardando pagamento": "warn" }[s] || "warn"}">${esc(s)}</span>`;

  let current = null;

  function render(c) {
    current = c;
    const p = plan(c.plan);
    const parts = c.name.split(" ");
    $("acc-hello").textContent = `Olá, ${parts[0]}${parts[1] ? " " + parts[1] : ""}!`;
    const nxt = c.next;
    const stepIdx = nxt ? STEPS.indexOf(nxt.status) : -1;
    const nextBilling = (c.status === "ativo" || c.status === "inadimplente") && c.pay.lastPaidAt ? addMonths(c.pay.lastPaidAt, 1) : "";

    // Caixas pagas = já recebidas + a que está a caminho/ser preparada, se o pagamento dela está em dia
    const paidBoxes = c.delivered + (nxt && c.pay.status === "pago" && PAID_BOX.includes(nxt.status) ? 1 : 0);
    const lastBoxDate = paidBoxes && c.pay.lastPaidAt ? addMonths(c.pay.lastPaidAt, 0) : "";
    const lastBoxMonth = paidBoxes ? addMonths(c.since, paidBoxes - 1) : "";

    // Pagamentos: um por caixa, o último na data do último pagamento (dados de demonstração)
    const payments = Array.from({ length: paidBoxes }, (_, i) => paidBoxes - i).map((n) => ({ n, date: addMonths(c.pay.lastPaidAt, n - paidBoxes) }));
    const shown = payments.slice(0, 6);

    const history = Array.from({ length: c.delivered }, (_, i) => c.delivered - i).slice(0, 12).map((n) =>
      `<li><span class="hist__ok">✓</span><div><strong>Caixa nº ${n}</strong><small>${esc(monthName(addMonths(c.since, n - 1)))} · Tema: <span class="tbd">em definição</span></small></div></li>`).join("");

    const trackMsg = !nxt ? "" :
      nxt.status === "Enviado" ? "Sua caixa já saiu e está a caminho. " + (nxt.tracking ? "Código de rastreio: " + nxt.tracking : "") :
      nxt.status === "Entregue" ? "Sua caixa foi entregue." :
      nxt.status === "Pronta para envio" ? "Sua caixa está pronta e será enviada em breve." :
      "Estamos preparando a sua caixa com carinho.";

    $("acc-grid").innerHTML = `
      <section class="acc-card acc-card--wide acc-summary">
        <h2>Resumo</h2>
        <div class="kpis kpis--acc">
          <div class="kpi"><small>Caixas pagas</small><strong>${paidBoxes}</strong></div>
          <div class="kpi"><small>Caixas recebidas</small><strong>${c.delivered}</strong></div>
          <div class="kpi"><small>Última caixa</small><strong>${paidBoxes ? "nº " + paidBoxes : "—"}</strong></div>
          <div class="kpi"><small>Frequência</small><strong>${c.metrics.regularity}%</strong></div>
        </div>
        <p class="acc-muted">${c.metrics.months ? "Você está no clube há " + c.metrics.months + (c.metrics.months === 1 ? " mês" : " meses") + " e já recebeu " + c.delivered + (c.delivered === 1 ? " caixa." : " caixas.") : "Sua jornada no clube começa quando o primeiro pagamento for confirmado."}</p>
      </section>

      <section class="acc-card acc-card--wide">
        <h2>Minha próxima caixa</h2>
        ${nxt ? `
          <p class="acc-big">Caixa nº ${nxt.n}</p>
          <p class="acc-track">${esc(trackMsg)}</p>
          <dl class="acc-dl">
            <div><dt>Envio previsto</dt><dd>${d(nxt.shipDate)}</dd></div>
            <div><dt>Entrega em</dt><dd>${esc(c.address.line)}, ${esc(c.address.city)}</dd></div>
            <div><dt>Tema</dt><dd><span class="tbd">em definição</span></dd></div>
            <div><dt>Rastreio</dt><dd>${nxt.tracking ? esc(nxt.tracking) : "Ainda não enviado"}</dd></div>
          </dl>
          ${nxt.n === 1 ? `<p class="acc-note">Seu Passaporte dos Mimos vem nesta primeira caixa.</p>` : ""}
          <ol class="steps-line">${STEPS.map((s, i) => `<li class="${i < stepIdx ? "done" : i === stepIdx ? "now" : ""}"><span></span>${esc(STEP_LABEL[s] || s)}</li>`).join("")}</ol>
        ` : `<p class="acc-muted">Não há caixa a caminho no momento.</p>`}
      </section>

      <section class="acc-card">
        <h2>Meu plano</h2>
        ${c.plan ? `<p class="acc-big">${esc(p.name)} <span>${brl(p.price)}/mês</span></p>
        <p class="acc-muted">${esc(p.items)} por caixa (estimativa)</p>` : `<p class="acc-muted">Você ainda não escolheu uma Box.</p><a class="btn btn--small" href="assinar.html">Escolher minha Box</a>`}
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
        <h2>Meu Passaporte dos Mimos</h2>
        ${c.passportCode ? `
          <div class="pass">
            <img class="pass__img" id="pass-img" src="${PassportImage.dataUrl(c, SITE.passport.total)}" alt="Seu Passaporte dos Mimos com ${c.stamps.length} de ${SITE.passport.total} selos" width="360" height="500">
            <div class="pass__info">
              <p class="acc-muted">Este é o registro oficial dos seus selos. A equipe confere o passaporte físico com ele.</p>
              <dl class="acc-dl">
                <div><dt>Código</dt><dd class="mono">${esc(c.passportCode)}</dd></div>
                <div><dt>Selos</dt><dd>${c.stamps.length} de ${SITE.passport.total}</dd></div>
                <div><dt>Último selo</dt><dd>${c.stamps.length ? d(c.stamps[c.stamps.length - 1].date) : "—"}</dd></div>
              </dl>
              <p class="acc-muted tbd">${esc(SITE.passport.gift)}</p>
              <button class="btn btn--small" id="pass-dl" type="button">Baixar imagem do passaporte</button>
            </div>
          </div>
        ` : `<p class="acc-muted">O passaporte é criado quando o primeiro pagamento for confirmado.</p>`}
      </section>

      <section class="acc-card acc-card--wide">
        <h2>Meus pagamentos</h2>
        ${payments.length ? `
          <p class="acc-muted">Caixas pagas até a nº ${paidBoxes}${lastBoxMonth ? " (" + esc(monthName(lastBoxMonth)) + ")" : ""}. Forma de pagamento: ${esc(c.pay.method)}.</p>
          <ul class="hist">${shown.map((x) => `<li><span class="hist__ok">R$</span><div><strong>Caixa nº ${x.n} · ${brl(p.price)}</strong><small>Pago em ${d(x.date)} · ${esc(c.pay.method)}</small></div></li>`).join("")}</ul>
          ${payments.length > shown.length ? `<p class="acc-muted">E mais ${payments.length - shown.length} pagamento(s) anteriores.</p>` : ""}
          ${c.pay.status !== "pago" ? `<p class="acc-note">Pagamento ${esc(c.pay.status)}. Regularize para continuar recebendo as caixas.</p>` : ""}
        ` : `<p class="acc-muted">Você ainda não tem pagamentos confirmados.</p>`}
      </section>

      <section class="acc-card acc-card--wide">
        <h2>Histórico de caixas recebidas</h2>
        ${history ? `<ul class="hist">${history}</ul>` : `<p class="acc-muted">Você ainda não recebeu nenhuma caixa. A primeira está a caminho.</p>`}
      </section>

      <section class="acc-card acc-card--wide" id="addr-card">
        <h2>Endereço de entrega</h2>
        ${c.demo ? `<p>${esc(c.address.line)}<br>${esc(c.address.city)}<br>CEP ${esc(c.address.cep)}</p>
          <button class="btn btn--ghost btn--small" data-proto="Alterar endereço">Alterar endereço</button>` : `
          ${c.address.line ? "" : `<p class="acc-note">Informe seu endereço para a gente saber onde entregar a sua caixa.</p>`}
          <form class="form addr-form" id="addr-form" novalidate>
            <label>CEP <input name="cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" value="${esc(c.address.cep)}" required></label>
            <label class="addr-wide">Rua e número <input name="line" autocomplete="address-line1" value="${esc(c.address.line)}" required></label>
            <label>Complemento <input name="complement" autocomplete="address-line2" value="${esc(c.address.complement)}"></label>
            <label>Bairro <input name="district" value="${esc(c.address.district)}"></label>
            <label>Cidade <input name="city" autocomplete="address-level2" value="${esc(c.address.city)}" required></label>
            <label>UF <input name="state" maxlength="2" autocomplete="address-level1" value="${esc(c.address.state)}" required></label>
            <p class="error" id="addr-msg" role="alert" hidden></p>
            <button class="btn btn--small" type="submit">Salvar endereço</button>
          </form>`}
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
    if (e.target.closest("#pass-dl")) {
      const ok = await PassportImage.downloadPng(current, SITE.passport.total, "passaporte-dos-mimos.png");
      if (!ok) proto("Não foi possível baixar", "Seu navegador não conseguiu gerar a imagem. Tente de novo ou use outro navegador.");
      return;
    }
    const b = e.target.closest("[data-proto]");
    if (!b) return;
    const what = b.dataset.proto;
    const res = what === "Cancelar assinatura" ? await API.subscriptions.cancel()
      : what === "Alterar plano" ? await API.subscriptions.changePlan()
      : what === "Alterar endereço" ? await API.subscriptions.updateAddress()
      : await API.payments.updatePaymentMethod();
    proto(what + " (protótipo)", res.message + " Nenhuma alteração foi feita.");
  });

  $("acc-grid").addEventListener("submit", async (e) => {
    const f = e.target.closest("#addr-form");
    if (!f) return;
    e.preventDefault();
    const msg = (m, ok) => { const el = $("addr-msg"); el.textContent = m; el.hidden = !m; el.style.color = ok ? "#25683b" : ""; };
    const v = (n) => f.elements[n].value.trim();
    if (!/^\d{5}-?\d{3}$/.test(v("cep"))) return msg("Informe um CEP válido (8 números).");
    if (v("line").length < 5) return msg("Informe a rua e o número.");
    if (v("city").length < 2) return msg("Informe a cidade.");
    if (!/^[A-Za-z]{2}$/.test(v("state"))) return msg("Informe a sigla do estado (2 letras), por exemplo SP.");
    const cep = v("cep").replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2");
    const r = await API.subscriptions.saveAddress({ line: v("line"), complement: v("complement"), district: v("district"), city: v("city"), state: v("state").toUpperCase(), cep });
    if (!r.ok) return msg(r.message);
    const user = await API.auth.currentUser();
    render(await API.customers.get(user.id));
    const el = $("addr-msg"); if (el) { el.textContent = "Endereço salvo!"; el.hidden = false; el.style.color = "#25683b"; }
  });

  $("logout").addEventListener("click", async () => { await API.auth.signOut(); location.href = "entrar.html"; });

  (async function init() {
    const user = await API.auth.currentUser();
    if (!user) { location.replace("entrar.html"); return; }
    const c = await API.customers.get(user.id);
    if (!c) { await API.auth.signOut(); location.replace("entrar.html"); return; }
    if (!c.demo) {
      const b = document.querySelector(".proto-banner");
      if (b) b.innerHTML = "<strong>Sua conta.</strong> Aqui você acompanha suas caixas, pagamentos e o seu Passaporte dos Mimos. Alterar plano, endereço ou forma de pagamento e cancelar ainda estão sendo preparados: por enquanto, fale com a gente.";
    }
    render(c);
  })();
})();
