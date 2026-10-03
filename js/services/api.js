/* ============================================================
   CAMADA DE SERVIÇOS (PROTÓTIPO)
   Todas as telas (Área do cliente e Painel) falam com `API`, nunca
   direto com dados. Hoje `API` usa dados FICTÍCIOS e o localStorage
   do navegador. Para o site real, troque a implementação de cada
   grupo abaixo por chamadas a um servidor/banco (veja
   docs/arquitetura.md) sem mexer nas telas.

   REGRAS:
   - Nenhuma senha, chave ou token pode ficar neste arquivo (é público).
   - Pagamento, login e verificação de passaporte DE VERDADE precisam
     rodar em servidor. Aqui tudo é simulado e marcado como protótipo.
   ============================================================ */
const API = (function () {
  const PROTOTYPE = true;
  const notReady = (what) => ({ ok: false, prototype: true, message: `${what}: protótipo. Ainda não existe servidor, então nada foi feito de verdade.` });

  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  /* ---------- datas ---------- */
  const toDate = (s) => new Date(s + "T12:00:00");
  const iso = (d) => d.toISOString().slice(0, 10);
  const addMonths = (s, n) => { const d = toDate(s); d.setMonth(d.getMonth() + n); return iso(d); };
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
  const monthsBetween = (a, b) => (toDate(b).getFullYear() - toDate(a).getFullYear()) * 12 + toDate(b).getMonth() - toDate(a).getMonth();

  /* ---------- selos do Passaporte (registro oficial) ----------
     Prototype: derivado de `delivered`. No sistema real, cada selo é um registro
     criado por um dono ao marcar a caixa como entregue (com data e quem marcou). */
  function stampsOf(c) {
    return Array.from({ length: Math.min(c.delivered, 12) }, (_, i) => ({ n: i + 1, date: addDays(addMonths(c.since, i), 15) }));
  }

  /* ---------- métricas de frequência ---------- */
  function metrics(c) {
    const months = c.since ? Math.max(1, monthsBetween(c.since, c.cancelledAt || DEMO_TODAY) + 1) : 0;
    const st = stampsOf(c);
    return {
      delivered: c.delivered,
      months,
      regularity: months ? Math.min(100, Math.round((c.delivered / months) * 100)) : 0,
      lastStamp: st.length ? st[st.length - 1].date : "",
      confirmed: c.pay.status === "pago" && !!c.pay.lastPaidAt && c.status !== "aguardando pagamento",
    };
  }

  return {
    mode: PROTOTYPE ? "prototype" : "live",

    auth: {
      // Real: sessão vinda do servidor (ex.: Supabase Auth, Firebase Auth). Aqui não há login.
      async currentUser() { return null; },
      async signIn() { return notReady("Login"); },
      async signOut() { return notReady("Sair"); },
    },

    customers: {
      async list() { return DEMO_CUSTOMERS.map((c) => ({ ...c, metrics: metrics(c), stamps: stampsOf(c) })); },
      async get(id) { const c = DEMO_CUSTOMERS.find((x) => x.id === id); return c ? { ...c, metrics: metrics(c), stamps: stampsOf(c) } : null; },
    },

    subscriptions: {
      async changePlan() { return notReady("Alterar plano"); },
      async cancel() { return notReady("Cancelar assinatura"); },
      async updateAddress() { return notReady("Alterar endereço"); },
    },

    payments: {
      // Real: criar a cobrança no servidor com Mercado Pago/Stripe/Asaas e receber a confirmação por webhook.
      async createCheckout() { return notReady("Pagamento"); },
      async updatePaymentMethod() { return notReady("Forma de pagamento"); },
    },

    shipping: {
      async quote() { return notReady("Cálculo de frete"); },
      async track() { return notReady("Rastreio"); },
    },

    themes: {
      // Protótipo: guardado só neste navegador; a página principal ainda NÃO lê isto.
      async list() { return load("mrc_themes", []); },
      async save(list) { return save("mrc_themes", list); },
      async currentId() { return load("mrc_theme_current", ""); },
      async setCurrent(id) { return save("mrc_theme_current", id); },
    },

    passports: {
      stampsOf,
      // Real: a verificação consulta o registro oficial no servidor; o código deve ser assinado
      // (impossível de adivinhar) e a contagem de selos nunca vem do navegador do cliente.
      async verify(code, physicalStamps) {
        const c = DEMO_CUSTOMERS.find((x) => x.passportCode && x.passportCode.toLowerCase() === String(code).trim().toLowerCase());
        if (!c) return { found: false, level: "bad", title: "Passaporte não reconhecido", detail: "Este código não existe no registro. Pode ser digitação errada ou passaporte falso." };
        const m = metrics(c);
        const st = stampsOf(c);
        const phys = Number.isFinite(physicalStamps) ? physicalStamps : null;
        let level = "ok", title = "Passaporte válido", detail = `${st.length} selo(s) registrado(s).`;
        if (!m.confirmed) { level = "warn"; title = "Cliente sem pagamento confirmado"; detail = "O código existe, mas o pagamento não está confirmado."; }
        if (phys !== null && phys > st.length) { level = "bad"; title = "Divergência: selos a mais no físico"; detail = `O passaporte físico mostra ${phys} selo(s), mas o registro oficial tem ${st.length}. Possível falsificação.`; }
        else if (phys !== null && phys < st.length && level === "ok") { level = "warn"; title = "Faltam selos no físico"; detail = `O registro tem ${st.length} selo(s) e o físico mostra ${phys}. Confira se o cliente perdeu ou rasurou o passaporte.`; }
        return { found: true, level, title, detail, customer: { ...c, metrics: m, stamps: st } };
      },
    },
  };
})();
