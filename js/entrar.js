/* Tela de login / criar conta. Tudo passa por API.auth (js/services/api.js).
   Em modo "prototype" os formulários só avisam que o login real ainda não está ativo. */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  $("year").textContent = new Date().getFullYear();

  const msg = (t, good) => { const m = $("login-msg"); m.textContent = t; m.hidden = !t; m.style.color = good ? "#25683b" : ""; };

  // Já está logado (sessão de demonstração)? Vai direto para a área.
  API.auth.currentUser().then((u) => { if (u) location.replace("conta.html"); });

  $("login-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-pane]");
    if (!b) return;
    document.querySelectorAll("#login-tabs button").forEach((x) => x.classList.toggle("is-on", x === b));
    $("form-in").hidden = b.dataset.pane !== "in";
    $("form-up").hidden = b.dataset.pane !== "up";
    msg("");
  });

  const okEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());

  $("form-in").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    if (!okEmail(f.email.value)) return msg("Informe um e-mail válido.");
    if (!f.password.value) return msg("Informe sua senha.");
    const r = await API.auth.signIn(f.email.value.trim(), f.password.value);
    f.password.value = "";
    if (r.ok) location.href = "conta.html"; else msg(r.message);
  });

  $("form-up").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.name.value.trim().split(/\s+/).length < 2) return msg("Informe seu nome completo (nome e sobrenome).");
    if (!okEmail(f.email.value)) return msg("Informe um e-mail válido.");
    if (f.password.value.length < 8) return msg("A senha precisa ter pelo menos 8 caracteres.");
    if (!f.consent.checked) return msg("Marque a caixa para continuar.");
    const r = await API.auth.signUp({ name: f.name.value.trim(), email: f.email.value.trim(), password: f.password.value });
    f.password.value = "";
    if (r.ok) location.href = "conta.html"; else msg(r.message);
  });

  $("btn-forgot").addEventListener("click", async () => {
    const email = $("form-in").email.value;
    if (!okEmail(email)) return msg("Digite seu e-mail no campo acima para recuperar a senha.");
    const r = await API.auth.resetPassword(email.trim());
    msg(r.message, r.ok);
  });

  // Conta de demonstração (só no protótipo)
  if (SITE.auth && SITE.auth.mode === "prototype") {
    $("demo-login").hidden = false;
    API.customers.list().then((list) => {
      $("demo-who").innerHTML = list.map((c) => `<option value="${esc(c.id)}">${esc(c.name)} · ${esc(c.status)}</option>`).join("");
    });
    $("demo-go").addEventListener("click", async () => {
      await API.auth.signInDemo($("demo-who").value);
      location.href = "conta.html";
    });
  }
})();
