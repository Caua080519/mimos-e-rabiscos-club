(function () {
  const $ = (id) => document.getElementById(id);
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const KEY = "mrc_waitlist";

  $("year").textContent = new Date().getFullYear();

  // Planos vêm de SITE.plans; plano pré-selecionado via ?plano=id
  const wanted = new URLSearchParams(location.search).get("plano");
  $("plan").innerHTML = SITE.plans
    .map((p) => `<option value="${p.id}"${p.id === wanted ? " selected" : ""}>${p.name} - ${brl(p.price)}/mês</option>`)
    .join("");

  const showError = (msg) => {
    const e = $("error");
    e.textContent = msg;
    e.hidden = !msg;
  };

  $("form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const data = Object.fromEntries(new FormData(f));
    if (data.name.trim().split(/\s+/).length < 2) return showError("Informe seu nome completo (nome e sobrenome).");
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return showError("Informe um e-mail válido.");
    if (!f.consent.checked) return showError("Marque a caixa para continuar.");
    showError("");

    const plan = SITE.plans.find((p) => p.id === data.plan);
    const entry = {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: (data.phone || "").trim(),
      plan: plan.name,
      duration: data.duration,
      at: new Date().toISOString(),
    };

    // Sem backend ainda: guarda só neste navegador. Trocar por envio real quando houver destino.
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || "[]");
      list.push(entry);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}

    $("done-name").textContent = entry.name.split(" ")[0];
    $("done-plan").textContent = plan.name;

    // Se houver WhatsApp configurado em data.js, oferece enviar a mensagem
    const wa = SITE.footer.whatsappNumber;
    $("done-actions").innerHTML = wa
      ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(
          `Olá! Quero entrar na lista do clube. Box: ${plan.name}, duração: ${entry.duration}. Nome: ${entry.name}.`
        )}">Confirmar pelo WhatsApp</a>`
      : "";

    $("form-view").hidden = true;
    $("done-view").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Pedir outra Box: volta ao formulário mantendo os dados da pessoa
  $("another").addEventListener("click", () => {
    const f = $("form");
    const used = f.plan.value;
    const next = SITE.plans.find((p) => p.id !== used);
    if (next) f.plan.value = next.id;
    $("done-view").hidden = true;
    $("form-view").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    f.plan.focus();
  });
})();
