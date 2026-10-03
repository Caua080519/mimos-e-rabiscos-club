(function () {
  const $ = (id) => document.getElementById(id);
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  $("year").textContent = new Date().getFullYear();

  // Box vem de ?plano=id (os botões da home mandam isso); padrão = a destacada
  const wanted = new URLSearchParams(location.search).get("plano");
  let current = SITE.plans.find((p) => p.id === wanted) || SITE.plans.find((p) => p.highlight) || SITE.plans[0];

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

  // Links de pagamento (Mercado Pago, InfinitePay etc.) ficam em SITE.payment.links, em js/data.js
  function update() {
    const link = (SITE.payment.links[current.id] || "").trim();
    $("pay-summary").innerHTML = `<span>Você escolheu</span> <strong>${esc(current.name)}</strong> <span>por</span> <strong>${brl(current.price)}/mês</strong>`;
    const go = $("pay-go");
    const notice = $("pay-notice");
    if (link) {
      go.href = link;
      go.classList.remove("is-off");
      go.removeAttribute("aria-disabled");
      notice.hidden = true;
    } else {
      go.href = "#";
      go.classList.add("is-off");
      go.setAttribute("aria-disabled", "true");
      notice.textContent = "O pagamento online ainda não está ativo. Em breve você poderá assinar por aqui.";
      notice.hidden = false;
    }
  }

  $("pay-plans").addEventListener("change", (e) => {
    const p = SITE.plans.find((x) => x.id === e.target.value);
    if (p) { current = p; update(); }
  });
  $("pay-go").addEventListener("click", (e) => { if ($("pay-go").classList.contains("is-off")) e.preventDefault(); });

  update();
})();
