/* Página de assinatura: escolhe a Box, registra a escolha na conta do cliente e leva ao pagamento.
   - Sem login: o botão leva para entrar.html e volta para cá.
   - Com login: "Reservar" grava a Box como "aguardando pagamento" (quem ativa é o pagamento confirmado).
   - Pagamento automático ainda não está ligado: usa link de pagamento (SITE.payment.links) ou Pix manual (SITE.payment.pix), se configurados. */
(function () {
  const $ = (id) => document.getElementById(id);
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  $("year").textContent = new Date().getFullYear();

  const wanted = new URLSearchParams(location.search).get("plano");
  let current = SITE.plans.find((p) => p.id === wanted) || SITE.plans.find((p) => p.highlight) || SITE.plans[0];
  let user = null;
  let busy = false;

  $("pay-plans").insertAdjacentHTML(
    "beforeend",
    SITE.plans
      .map(
        (p) => `
      <label class="pay__opt">
        <input type="radio" name="plan" value="${p.id}"${p.id === current.id ? " checked" : ""}>
        <span class="pay__card">
          <strong>${esc(p.name)}</strong>
          <small>${esc(p.items)}</small>
          <em>${brl(p.price)}/mês</em>
        </span>
      </label>`
      )
      .join("")
  );

  const payLink = () => ((SITE.payment.links || {})[current.id] || "").trim();
  const pix = () => SITE.payment.pix || {};

  function update() {
    $("pay-summary").innerHTML = `<span>Você escolheu</span> <strong>${esc(current.name)}</strong> <span>por</span> <strong>${brl(current.price)}/mês</strong>`;
    const go = $("pay-go");
    const next = encodeURIComponent("assinar.html?plano=" + current.id);
    go.classList.remove("is-off");
    go.removeAttribute("aria-disabled");
    $("pay-done").hidden = true;
    $("pay-notice").hidden = true;
    if (!user) {
      go.textContent = "Entrar para assinar";
      go.href = "entrar.html?next=" + next;
      $("pay-fine").textContent = "Você precisa de uma conta para acompanhar suas caixas e o seu Passaporte dos Mimos.";
    } else {
      go.textContent = payLink() ? "Reservar e ir para o pagamento" : "Reservar minha Box";
      go.href = "#";
      $("pay-fine").textContent = "Reservar não cobra nada. A assinatura só começa quando o pagamento for confirmado.";
    }
  }

  function showDone() {
    const done = $("pay-done");
    const px = pix();
    done.innerHTML = `<h2>Box reservada!</h2>
      <p>Você reservou a <strong>${esc(current.name)}</strong> (${brl(current.price)}/mês). Falta confirmar o pagamento.</p>
      ${px.key
        ? `<p><strong>Pague por Pix</strong> ${px.receiver ? "para " + esc(px.receiver) : ""}:<br><span class="mono pix-key">${esc(px.key)}</span></p>
           <p class="acc-muted">Depois de pagar, a gente confirma por aqui e libera a sua caixa e o seu passaporte.</p>`
        : `<p class="acc-muted">O pagamento online ainda não está ativo. Assim que estiver, a gente avisa por e-mail.</p>`}
      <a class="btn btn--small" href="conta.html">Ir para a minha conta</a>`;
    done.hidden = false;
    $("pay-go").classList.add("is-off");
    $("pay-go").setAttribute("aria-disabled", "true");
  }

  $("pay-plans").addEventListener("change", (e) => {
    const p = SITE.plans.find((x) => x.id === e.target.value);
    if (p) { current = p; update(); }
  });

  $("pay-go").addEventListener("click", async (e) => {
    if (!user) return; // segue o link para entrar.html
    e.preventDefault();
    if (busy || $("pay-go").classList.contains("is-off")) return;
    busy = true;
    const r = await API.subscriptions.choosePlan(current.id);
    busy = false;
    if (!r.ok) { $("pay-notice").textContent = r.message; $("pay-notice").hidden = false; return; }
    if (payLink()) { location.href = payLink(); return; }
    showDone();
  });

  API.auth.currentUser().then((u) => { user = u; update(); });
  update();
})();
