(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const KEY = "mrc_orders";
  const STATUS = ["A preparar", "Em preparação", "Pronta para envio", "Enviado", "Entregue"];
  const ordinal = (n) => `${n}ª caixa`;

  const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // O que colocar na caixa conforme a ordem da compra (regras do Passaporte dos Mimos)
  const insertFor = (n) =>
    n === 1
      ? "Passaporte dos Mimos (novo) + carimbar selo 1"
      : n === SITE.passport.total
      ? `Carimbar selo ${n} e entregar o presente exclusivo (${SITE.passport.gift.replace("Presente exclusivo: ", "")})`
      : `Carimbar selo ${n} no passaporte`;

  // Exemplos vêm dos dados FICTÍCIOS compartilhados (js/mock/demo-data.js): um envio por cliente que tem caixa a caminho
  const DEMO = DEMO_CUSTOMERS.filter((c) => c.next).map((c, i) => ({
    id: i + 1, name: c.name, email: c.email, phone: c.phone, plan: c.plan, boxNumber: c.next.n, month: "Envio previsto " + new Date(c.next.shipDate + "T12:00:00").toLocaleDateString("pt-BR"),
    address: c.address.line, city: c.address.city, cep: c.address.cep, status: c.next.status, tracking: c.next.tracking, pay: c.pay.method,
  }));
  const planName = (id) => (SITE.plans.find((p) => p.id === id) || {}).name || id;
  const planPrice = (id) => (SITE.plans.find((p) => p.id === id) || {}).price || 0;

  let orders = load(KEY);
  const state = { tab: "orders" };

  // Filtros
  STATUS.forEach((s) => ($("f-status").innerHTML += `<option>${s}</option>`));
  SITE.plans.forEach((p) => ($("f-plan").innerHTML += `<option value="${p.id}">${p.name}</option>`));
  ["f-status", "f-plan", "f-q"].forEach((id) => $(id).addEventListener("input", render));

  function render() {
    const q = $("f-q").value.trim().toLowerCase();
    const list = orders.filter(
      (o) =>
        (!$("f-status").value || o.status === $("f-status").value) &&
        (!$("f-plan").value || o.plan === $("f-plan").value) &&
        (!q || (o.name + " " + o.city).toLowerCase().includes(q))
    );

    $("stats").innerHTML = [
      ["Envios", orders.length],
      ["A preparar", orders.filter((o) => o.status === "A preparar").length],
      ["Enviados", orders.filter((o) => o.status === "Enviado").length],
      ["Receita mensal (estim.)", brl(orders.reduce((s, o) => s + planPrice(o.plan), 0))],
    ].map(([l, v]) => `<div class="stat"><small>${l}</small><strong>${v}</strong></div>`).join("");

    $("demo-note").textContent = orders.some((o) => o.name.startsWith("Cliente Exemplo")) ? "Os clientes mostrados são exemplos fictícios." : "";

    $("orders").innerHTML = list.length
      ? list.map(card).join("")
      : `<p class="adm-empty">Nenhum envio por aqui ainda. Use "Carregar exemplos" para ver como fica.</p>`;
  }

  function card(o) {
    return `
    <article class="adm-card" data-id="${o.id}">
      <div class="adm-card__top">
        <div><h3>${esc(o.name)}</h3><p>${esc(o.email)} · ${esc(o.phone)}</p></div>
        <span class="chip chip--box">${esc(planName(o.plan))}</span>
      </div>
      <div class="adm-grid">
        <p><small>Compra nº</small><strong>${ordinal(o.boxNumber)}</strong></p>
        <p><small>Referência</small>${esc(o.month)}</p>
        <p><small>Pagamento</small>${esc(o.pay)}</p>
        <p class="adm-wide"><small>Enviar para</small>${esc(o.address)}<br>${esc(o.city)} · CEP ${esc(o.cep)}</p>
        <p class="adm-wide adm-insert"><small>O que colocar nesta caixa</small>${esc(insertFor(o.boxNumber))}</p>
      </div>
      <div class="adm-actions">
        <label>Status
          <select data-act="status">${STATUS.map((s) => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}</select>
        </label>
        <label>Rastreio
          <input data-act="tracking" value="${esc(o.tracking)}" placeholder="Código dos Correios">
        </label>
      </div>
    </article>`;
  }

  $("orders").addEventListener("change", (e) => {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const o = orders.find((x) => String(x.id) === t.closest(".adm-card").dataset.id);
    if (!o) return;
    if (t.dataset.act === "status") o.status = t.value;
    if (t.dataset.act === "tracking") o.tracking = t.value.trim();
    save(KEY, orders);
    render();
  });

  $("btn-demo").addEventListener("click", () => { orders = DEMO.map((d) => ({ ...d })); save(KEY, orders); render(); });
  $("btn-clear").addEventListener("click", () => {
    if (confirm("Apagar todos os envios guardados neste navegador?")) { orders = []; save(KEY, orders); render(); }
  });


  // Clicar em "Painel dos donos" atualiza o painel (relê os dados) e volta ao topo, sem sair da página
  $("logo").addEventListener("click", (e) => {
    e.preventDefault();
    orders = load(KEY);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  render();
})();
