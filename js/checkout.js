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

  // ===== Lembretes por e-mail =====
  const L = SITE.leads || {};
  if (L.endpoint) {
    $("lead").hidden = false;
    const err = (m) => { $("lead-error").textContent = m; $("lead-error").hidden = !m; };
    $("lead-form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = ev.target;
      if (f.website.value) return; // campo-armadilha para robôs
      if (!f.name.value.trim()) return err("Informe seu nome.");
      if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) return err("Informe um e-mail válido.");
      if (!f.consent.checked) return err("Marque a caixa para receber os e-mails.");
      err("");

      const fd = new FormData();
      fd.append(L.fields.email, f.email.value.trim());
      fd.append(L.fields.name, f.name.value.trim());
      Object.entries(L.extra || {}).forEach(([k, v]) => fd.append(k, v));

      const btn = $("lead-btn");
      btn.disabled = true;
      btn.textContent = "Enviando...";
      try {
        // no-cors: o serviço não devolve resposta legível para o navegador, mas recebe o cadastro
        await fetch(L.endpoint, { method: "POST", body: fd, mode: "no-cors" });
        $("lead-form-view").hidden = true;
        $("lead-done-view").hidden = false;
      } catch (e) {
        err("Não conseguimos enviar agora. Confira sua conexão e tente de novo.");
        btn.disabled = false;
        btn.textContent = "Quero receber o lembrete";
      }
    });
  }
})();
