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
  // Login real (Supabase) quando SITE.auth.mode === "live" e a biblioteca carregou; senão, protótipo.
  const CFG = (typeof SITE !== "undefined" && SITE.auth) || {};
  const sb = CFG.mode === "live" && window.supabase && CFG.supabase
    ? window.supabase.createClient(CFG.supabase.url, CFG.supabase.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    : null;
  const LIVE = !!sb;
  const PROTOTYPE = !LIVE;
  const TODAY = () => (LIVE ? new Date().toISOString().slice(0, 10) : DEMO_TODAY);
  const baseUrl = (page) => new URL(page, location.href).href;
  const friendly = (err) => {
    const m = String((err && (err.code || err.message)) || "").toLowerCase();
    if (m.includes("invalid_credentials") || m.includes("invalid login")) return "E-mail ou senha incorretos.";
    if (m.includes("email_not_confirmed") || m.includes("not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
    if (m.includes("rate") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
    if (m.includes("weak") || m.includes("password")) return "Escolha uma senha mais forte (pelo menos 8 caracteres).";
    if (m.includes("same_password")) return "A nova senha precisa ser diferente da atual.";
    return "Não foi possível concluir agora. Tente novamente em instantes.";
  };
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
    if (c._stamps) return c._stamps;
    return Array.from({ length: Math.min(c.delivered, 12) }, (_, i) => ({ n: i + 1, date: addDays(addMonths(c.since, i), 15) }));
  }

  /* ---------- métricas de frequência ---------- */
  function metrics(c) {
    const months = c.since ? Math.max(1, monthsBetween(c.since, c.cancelledAt || TODAY()) + 1) : 0;
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
      // Real (modo "live"): sessão e senha ficam no Supabase; o navegador nunca guarda a senha.
      // Protótipo: NÃO existe senha. Só há uma "sessão de demonstração" no navegador para ver a Área do cliente.
      async currentUser() {
        if (LIVE) { const { data } = await sb.auth.getSession(); const u = data && data.session && data.session.user; return u ? { id: u.id, email: u.email, demo: false } : null; }
        try { const id = sessionStorage.getItem("mrc_demo_user"); return id ? { id, demo: true } : null; } catch (e) { return null; }
      },
      async signIn(email, password) {
        if (!LIVE) return notReady("Login");
        const { error } = await sb.auth.signInWithPassword({ email, password });
        return error ? { ok: false, message: friendly(error) } : { ok: true };
      },
      async signUp({ name, email, password }) {
        if (!LIVE) return notReady("Criar conta");
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: baseUrl("conta.html") } });
        if (error) return { ok: false, message: friendly(error) };
        if (data.session) return { ok: true };
        return { ok: true, confirm: true, message: "Quase lá! Enviamos um e-mail de confirmação. Clique no link dele para ativar sua conta e depois entre." };
      },
      async resetPassword(email) {
        if (!LIVE) return notReady("Recuperar senha");
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: baseUrl("entrar.html") });
        return error ? { ok: false, message: friendly(error) } : { ok: true, message: "Se esse e-mail tiver conta, enviamos um link para criar uma nova senha." };
      },
      // Chama `cb` quando o cliente abre o link de recuperação de senha
      onPasswordRecovery(cb) { if (LIVE) sb.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") cb(); }); },
      async updatePassword(password) {
        if (!LIVE) return notReady("Trocar senha");
        const { error } = await sb.auth.updateUser({ password });
        return error ? { ok: false, message: friendly(error) } : { ok: true };
      },
      async signInDemo(id) { try { sessionStorage.setItem("mrc_demo_user", id); return { ok: true }; } catch (e) { return { ok: false }; } },
      async signOut() {
        if (LIVE) await sb.auth.signOut();
        try { sessionStorage.removeItem("mrc_demo_user"); } catch (e) {}
        return { ok: true };
      },
    },

    customers: {
      async list() { return DEMO_CUSTOMERS.map((c) => ({ ...c, demo: true, metrics: metrics(c), stamps: stampsOf(c) })); },
      async get(id) {
        const demo = DEMO_CUSTOMERS.find((x) => x.id === id);
        if (demo) return { ...demo, demo: true, metrics: metrics(demo), stamps: stampsOf(demo) };
        if (!LIVE) return null;
        // Dados REAIS do cliente logado. As regras (RLS) do banco só devolvem as linhas dele.
        const [prof, subs, addr, boxes, stamps, pass] = await Promise.all([
          sb.from("profiles").select("name").eq("id", id).maybeSingle(),
          sb.from("subscriptions").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(1),
          sb.from("addresses").select("line,city,cep").eq("user_id", id).maybeSingle(),
          sb.from("boxes").select("n,ship_date,status,tracking").eq("user_id", id).order("n"),
          sb.from("stamps").select("n,stamped_on").eq("user_id", id).order("n"),
          sb.from("passports").select("code").eq("user_id", id).maybeSingle(),
        ]);
        const sub = subs.data && subs.data[0];
        const bx = boxes.data || [];
        const nextBox = bx.find((b) => b.status !== "Entregue");
        const { data: sess } = await sb.auth.getSession();
        const c = {
          id, demo: false,
          name: (prof.data && prof.data.name) || (sess.session && sess.session.user.email) || "Cliente",
          email: sess.session ? sess.session.user.email : "",
          plan: sub ? sub.plan : "mimobox",
          status: sub ? sub.status : "aguardando pagamento",
          since: sub && sub.started_at ? sub.started_at : "",
          cancelledAt: sub && sub.cancelled_at ? sub.cancelled_at : undefined,
          delivered: bx.filter((b) => b.status === "Entregue").length,
          address: addr.data || { line: "—", city: "—", cep: "—" },
          pay: { method: (sub && sub.pay_method) || "—", status: sub ? sub.pay_status : "pendente", lastPaidAt: (sub && sub.last_paid_at) || "" },
          passportCode: (pass.data && pass.data.code) || "",
          next: nextBox ? { n: nextBox.n, status: nextBox.status, shipDate: nextBox.ship_date || "", tracking: nextBox.tracking || "" } : null,
          _stamps: (stamps.data || []).map((s) => ({ n: s.n, date: s.stamped_on })),
        };
        return { ...c, metrics: metrics(c), stamps: stampsOf(c) };
      },
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
