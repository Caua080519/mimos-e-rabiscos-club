/* ============================================================
   CAMADA DE SERVIÇOS
   Todas as telas (Área do cliente e Painel) falam com `API`, nunca
   direto com o banco. Em modo "live" (SITE.auth.mode) usa o Supabase;
   senão usa dados FICTÍCIOS de demonstração.

   REGRAS:
   - Só a chave "publishable" do Supabase pode aparecer no site. NUNCA a secreta.
   - Quem protege os dados é o banco (regras RLS e funções de dono em
     supabase/*.sql), não este arquivo: o navegador pode ser adulterado.
   - Pagamento automático e frete ainda NÃO estão ligados (devolvem "não disponível").
   ============================================================ */
const API = (function () {
  const CFG = (typeof SITE !== "undefined" && SITE.auth) || {};
  const sb = CFG.mode === "live" && window.supabase && CFG.supabase
    ? window.supabase.createClient(CFG.supabase.url, CFG.supabase.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    : null;
  const LIVE = !!sb;
  const PROTOTYPE = !LIVE;
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const TODAY = () => (LIVE ? todayIso() : DEMO_TODAY);
  const baseUrl = (page) => new URL(page, location.href).href;
  const notReady = (what) => ({ ok: false, prototype: true, message: `${what}: ainda não está disponível. Nada foi alterado.` });
  const friendly = (err) => {
    if (err && err.code === "P0001" && err.message) return err.message; // mensagens das regras do banco, já em português
    const m = String((err && (err.code || err.message)) || "").toLowerCase();
    if (m.includes("invalid_credentials") || m.includes("invalid login")) return "E-mail ou senha incorretos.";
    if (m.includes("email_not_confirmed") || m.includes("not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
    if (m.includes("rate") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
    if (m.includes("same_password")) return "A nova senha precisa ser diferente da atual.";
    if (m.includes("weak") || m.includes("password")) return "Escolha uma senha mais forte (pelo menos 8 caracteres).";
    if (m.includes("42501") || m.includes("acesso negado") || m.includes("permission")) return "Você não tem permissão para fazer isso.";
    if (m.includes("23505") || m.includes("duplicate")) return "Isso já foi registrado.";
    return "Não foi possível concluir agora. Tente novamente em instantes.";
  };
  const fail = (err) => ({ ok: false, message: friendly(err) });

  /* ---------- datas ---------- */
  const toDate = (s) => new Date(s + "T12:00:00");
  const iso = (d) => d.toISOString().slice(0, 10);
  const addMonths = (s, n) => { const d = toDate(s); d.setMonth(d.getMonth() + n); return iso(d); };
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
  const monthsBetween = (a, b) => (toDate(b).getFullYear() - toDate(a).getFullYear()) * 12 + toDate(b).getMonth() - toDate(a).getMonth();

  /* ---------- selos do Passaporte (registro oficial) ----------
     Live: vêm da tabela `stamps` (criada só por donos). Demonstração: derivados de `delivered`. */
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
  const withMetrics = (c) => ({ ...c, metrics: metrics(c), stamps: stampsOf(c) });

  /* ---------- monta um cliente a partir das linhas do banco ---------- */
  function buildCustomer(id, rows) {
    const { prof, sub, addr, boxes, stamps, pass } = rows;
    const nextBox = (boxes || []).find((b) => b.status !== "Entregue");
    const a = addr || {};
    return {
      id, demo: false,
      name: (prof && prof.name) || (prof && prof.email) || "Cliente",
      displayName: (prof && prof.display_name) || "",
      email: (prof && prof.email) || "",
      phone: (prof && prof.phone) || "",
      role: (prof && prof.role) || "customer",
      plan: sub ? sub.plan : "",
      status: sub ? sub.status : "aguardando pagamento",
      since: sub && sub.started_at ? sub.started_at : "",
      cancelledAt: sub && sub.cancelled_at ? sub.cancelled_at : undefined,
      delivered: (boxes || []).filter((b) => b.status === "Entregue").length,
      address: { line: a.line || "", complement: a.complement || "", district: a.district || "", city: a.city || "", state: a.state || "", cep: a.cep || "" },
      pay: { method: (sub && sub.pay_method) || "—", status: sub ? sub.pay_status : "pendente", lastPaidAt: (sub && sub.last_paid_at) || "" },
      passportCode: (pass && pass.code) || "",
      next: nextBox ? { id: nextBox.id, n: nextBox.n, status: nextBox.status, shipDate: nextBox.ship_date || "", tracking: nextBox.tracking || "" } : null,
      _stamps: (stamps || []).map((s) => ({ n: s.n, date: s.stamped_on })),
    };
  }

  const group = (arr, key) => (arr || []).reduce((m, r) => { (m[r[key]] = m[r[key]] || []).push(r); return m; }, {});

  /* ---------- tema (banco <-> tela) ---------- */
  const themeFromDb = (t) => ({ id: t.id, name: t.name, description: t.description || "", products: (t.products || []).join("\n"), image: t.image_url || "", shipDate: t.ship_date || "", isCurrent: !!t.is_current, showOnSite: !!t.show_on_site });
  const themeToDb = (t) => ({ name: t.name, description: t.description || null, products: String(t.products || "").split("\n").map((x) => x.trim()).filter(Boolean), image_url: t.image || null, ship_date: t.shipDate || null });
  const dashless = (s) => String(s || "").replace(/^\s*[-–•*]\s*/, "").trim();
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  /* ---------- julgamento do passaporte (igual em demonstração e live) ---------- */
  function judge(c, physical) {
    const m = c.metrics, st = c.stamps;
    const phys = Number.isFinite(physical) ? physical : null;
    let level = "ok", title = "Passaporte válido", detail = `${st.length} selo(s) registrado(s).`;
    if (!m.confirmed) { level = "warn"; title = "Cliente sem pagamento confirmado"; detail = "O código existe, mas o pagamento não está confirmado."; }
    if (phys !== null && phys > st.length) { level = "bad"; title = "Divergência: selos a mais no físico"; detail = `O passaporte físico mostra ${phys} selo(s), mas o registro oficial tem ${st.length}. Possível falsificação.`; }
    else if (phys !== null && phys < st.length && level === "ok") { level = "warn"; title = "Faltam selos no físico"; detail = `O registro tem ${st.length} selo(s) e o físico mostra ${phys}. Confira se o cliente perdeu ou rasurou o passaporte.`; }
    return { found: true, level, title, detail, customer: c };
  }
  const notFound = () => ({ found: false, level: "bad", title: "Passaporte não reconhecido", detail: "Este código não existe no registro. Pode ser digitação errada ou passaporte falso." });

  return {
    mode: PROTOTYPE ? "prototype" : "live",

    auth: {
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
      async list() { return DEMO_CUSTOMERS.map((c) => withMetrics({ ...c, demo: true })); },
      async get(id) {
        const demo = typeof DEMO_CUSTOMERS !== "undefined" && DEMO_CUSTOMERS.find((x) => x.id === id);
        if (demo) return withMetrics({ ...demo, demo: true });
        if (!LIVE) return null;
        // Dados REAIS do cliente logado. As regras (RLS) do banco só devolvem as linhas dele.
        const [prof, subs, addr, boxes, stamps, pass] = await Promise.all([
          sb.from("profiles").select("name,display_name,email,phone,role").eq("id", id).maybeSingle(),
          sb.from("subscriptions").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(1),
          sb.from("addresses").select("line,complement,district,city,state,cep").eq("user_id", id).maybeSingle(),
          sb.from("boxes").select("id,n,ship_date,status,tracking").eq("user_id", id).order("n"),
          sb.from("stamps").select("n,stamped_on").eq("user_id", id).order("n"),
          sb.from("passports").select("code").eq("user_id", id).maybeSingle(),
        ]);
        return withMetrics(buildCustomer(id, { prof: prof.data, sub: subs.data && subs.data[0], addr: addr.data, boxes: boxes.data, stamps: stamps.data, pass: pass.data }));
      },
    },

    /* ---------- Minha conta (apelido, foto, telefone, senha) ---------- */
    profile: {
      async me() {
        if (!LIVE) return null;
        const { data: s } = await sb.auth.getSession();
        const u = s.session && s.session.user;
        if (!u) return null;
        const { data } = await sb.from("profiles").select("name,display_name,phone,role,avatar_path").eq("id", u.id).maybeSingle();
        const p = data || {};
        const avatarUrl = p.avatar_path ? sb.storage.from("avatars").getPublicUrl(p.avatar_path).data.publicUrl : "";
        return { id: u.id, email: u.email, name: p.name || "", displayName: p.display_name || "", phone: p.phone || "", role: p.role || "customer", avatarPath: p.avatar_path || "", avatarUrl };
      },
      async update({ name, displayName, phone }) {
        if (!LIVE) return notReady("Salvar perfil");
        const { data: s } = await sb.auth.getSession();
        const uid = s.session && s.session.user.id;
        if (!uid) return { ok: false, message: "Entre na sua conta." };
        const row = { name: String(name || "").trim(), display_name: String(displayName || "").trim() || null, phone: String(phone || "").trim() || null };
        const { error } = await sb.from("profiles").update(row).eq("id", uid);
        return error ? fail(error) : { ok: true };
      },
      // `blob` já vem reduzido (JPEG) pela tela; o banco só aceita imagem até 1 MB na pasta do próprio usuário
      async uploadAvatar(blob) {
        if (!LIVE) return notReady("Enviar foto");
        const { data: s } = await sb.auth.getSession();
        const uid = s.session && s.session.user.id;
        if (!uid) return { ok: false, message: "Entre na sua conta." };
        const { data: prev } = await sb.from("profiles").select("avatar_path").eq("id", uid).maybeSingle();
        const path = `${uid}/avatar-${Date.now()}.jpg`;
        const up = await sb.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (up.error) return fail(up.error);
        const { error } = await sb.from("profiles").update({ avatar_path: path }).eq("id", uid);
        if (error) return fail(error);
        if (prev && prev.avatar_path) await sb.storage.from("avatars").remove([prev.avatar_path]);
        return { ok: true };
      },
      async removeAvatar() {
        if (!LIVE) return notReady("Remover foto");
        const { data: s } = await sb.auth.getSession();
        const uid = s.session && s.session.user.id;
        if (!uid) return { ok: false, message: "Entre na sua conta." };
        const { data: prev } = await sb.from("profiles").select("avatar_path").eq("id", uid).maybeSingle();
        const { error } = await sb.from("profiles").update({ avatar_path: null }).eq("id", uid);
        if (error) return fail(error);
        if (prev && prev.avatar_path) await sb.storage.from("avatars").remove([prev.avatar_path]);
        return { ok: true };
      },
    },
    subscriptions: {
      // O cliente registra a Box que escolheu (sempre "aguardando pagamento"; quem ativa é o dono ou, no futuro, o pagamento)
      async choosePlan(plan) {
        if (!LIVE) return notReady("Escolher Box");
        const { data: u } = await sb.auth.getSession();
        const uid = u.session && u.session.user.id;
        if (!uid) return { ok: false, message: "Entre na sua conta para escolher a Box." };
        const { data: open } = await sb.from("subscriptions").select("id,status,plan").eq("user_id", uid).neq("status", "cancelado").limit(1);
        if (open && open[0]) {
          if (open[0].status !== "aguardando pagamento") return { ok: false, message: "Você já tem uma assinatura. Para trocar de Box, fale com a gente." };
          const { error } = await sb.from("subscriptions").update({ plan }).eq("id", open[0].id);
          return error ? fail(error) : { ok: true };
        }
        const { error } = await sb.from("subscriptions").insert({ user_id: uid, plan });
        return error ? fail(error) : { ok: true };
      },
      async saveAddress(a) {
        if (!LIVE) return notReady("Salvar endereço");
        const { data: u } = await sb.auth.getSession();
        const uid = u.session && u.session.user.id;
        if (!uid) return { ok: false, message: "Entre na sua conta." };
        const row = { user_id: uid, line: a.line, complement: a.complement || null, district: a.district || null, city: a.city, state: a.state, cep: a.cep, updated_at: new Date().toISOString() };
        const { error } = await sb.from("addresses").upsert(row, { onConflict: "user_id" });
        return error ? fail(error) : { ok: true };
      },
      async changePlan() { return notReady("Alterar plano"); },
      async cancel() { return notReady("Cancelar assinatura"); },
      async updateAddress() { return notReady("Alterar endereço"); },
    },

    payments: {
      async createCheckout() { return notReady("Pagamento"); },
      async updatePaymentMethod() { return notReady("Forma de pagamento"); },
    },

    shipping: {
      async quote() { return notReady("Cálculo de frete"); },
      async track() { return notReady("Rastreio"); },
    },

    /* ---------- tema do mês que aparece na home (leitura pública) ---------- */
    site: {
      async currentTheme() {
        if (!LIVE) return null;
        const { data } = await sb.from("themes").select("name,description,products,image_url,ship_date").eq("is_current", true).maybeSingle();
        return data ? themeFromDb({ ...data, id: "", is_current: true }) : null;
      },
    },

    /* ---------- PAINEL DOS DONOS ----------
       Em modo live, TUDO aqui só funciona para quem tem cargo "admin" no banco (RLS + funções). */
    admin: {
      async isAdmin() {
        if (!LIVE) return true;
        const { data: u } = await sb.auth.getSession();
        const uid = u.session && u.session.user.id;
        if (!uid) return false;
        const { data } = await sb.from("profiles").select("role").eq("id", uid).maybeSingle();
        return !!data && (data.role === "admin" || data.role === "owner");
      },
      async customers() {
        if (!LIVE) return DEMO_CUSTOMERS.map((c) => withMetrics({ ...c, demo: true }));
        const [p, s, a, b, st, ps] = await Promise.all([
          sb.from("profiles").select("id,name,display_name,email,phone,role"),
          sb.from("subscriptions").select("*").order("created_at", { ascending: false }),
          sb.from("addresses").select("*"),
          sb.from("boxes").select("id,user_id,n,ship_date,status,tracking").order("n"),
          sb.from("stamps").select("user_id,n,stamped_on").order("n"),
          sb.from("passports").select("user_id,code"),
        ]);
        const err = [p, s, a, b, st, ps].find((x) => x.error);
        if (err) throw err.error;
        const sg = group(s.data, "user_id"), ag = group(a.data, "user_id"), bg = group(b.data, "user_id"), tg = group(st.data, "user_id"), pg = group(ps.data, "user_id");
        return (p.data || []).map((prof) => withMetrics(buildCustomer(prof.id, {
          prof, sub: (sg[prof.id] || []).find((x) => x.status !== "cancelado") || (sg[prof.id] || [])[0], addr: (ag[prof.id] || [])[0],
          boxes: bg[prof.id], stamps: tg[prof.id], pass: (pg[prof.id] || [])[0],
        })));
      },
      async registerPayment(userId, plan, method) {
        if (!LIVE) return notReady("Registrar pagamento");
        const { error } = await sb.rpc("admin_register_payment", { p_user: userId, p_plan: plan || null, p_method: method || null });
        return error ? fail(error) : { ok: true };
      },
      async setBoxStatus(boxId, status, tracking, shipDate) {
        if (!LIVE) return notReady("Mudar status da caixa");
        const { error } = await sb.rpc("admin_set_box_status", { p_box: boxId, p_status: status, p_tracking: tracking || null, p_ship_date: shipDate || null });
        return error ? fail(error) : { ok: true };
      },
      async setSubscriptionStatus(userId, status) {
        if (!LIVE) return notReady("Mudar status da assinatura");
        const { error } = await sb.rpc("admin_set_subscription_status", { p_user: userId, p_status: status });
        return error ? fail(error) : { ok: true };
      },
      async verifyPassport(code, physical) {
        const clean = String(code || "").trim().toUpperCase();
        if (!LIVE) {
          const c = DEMO_CUSTOMERS.find((x) => x.passportCode && x.passportCode.toUpperCase() === clean);
          return c ? judge(withMetrics({ ...c, demo: true }), physical) : notFound();
        }
        const { data: pass } = await sb.from("passports").select("user_id").eq("code", clean).maybeSingle();
        if (!pass) return notFound();
        const list = await this.customers();
        const c = list.find((x) => x.id === pass.user_id);
        return c ? judge(c, physical) : notFound();
      },
      themes: {
        async list() {
          if (!LIVE) return lsGet("mrc_themes", []);
          const { data, error } = await sb.from("themes").select("*").order("created_at", { ascending: false });
          if (error) throw error;
          return (data || []).map(themeFromDb);
        },
        async save(t) {
          if (!LIVE) { const l = lsGet("mrc_themes", []); const i = l.findIndex((x) => x.id === t.id); if (i >= 0) l[i] = t; else l.push(t); lsSet("mrc_themes", l); return { ok: true }; }
          const row = themeToDb(t);
          const { error } = t.id ? await sb.from("themes").update(row).eq("id", t.id) : await sb.from("themes").insert(row);
          return error ? fail(error) : { ok: true };
        },
        async remove(id) {
          if (!LIVE) { lsSet("mrc_themes", lsGet("mrc_themes", []).filter((x) => x.id !== id)); return { ok: true }; }
          const { error } = await sb.from("themes").delete().eq("id", id);
          return error ? fail(error) : { ok: true };
        },
        async setCurrent(id) {
          if (!LIVE) { lsSet("mrc_theme_current", id); return { ok: true }; }
          const { error } = await sb.rpc("admin_set_current_theme", { p_id: id });
          return error ? fail(error) : { ok: true };
        },
        // Quais temas aparecem na seção "Temas futuros" do site (máximo 4; o banco recusa o 5º)
        async setVisible(id, visible) {
          if (!LIVE) { const l = lsGet("mrc_themes", []); const x = l.find((y) => y.id === id); if (x) { x.showOnSite = !!visible; lsSet("mrc_themes", l); } return { ok: true }; }
          const { error } = await sb.rpc("admin_set_theme_visible", { p_id: id, p_visible: !!visible });
          return error ? fail(error) : { ok: true };
        },
        async draw() {
          if (!LIVE) return notReady("Sortear temas");
          const { data, error } = await sb.rpc("admin_draw_themes");
          return error ? fail(error) : { ok: true, count: data };
        },
        // Envia a imagem do tema (arte criada pelo painel ou foto do dono) e devolve o endereço público dela
        async uploadArt(blob, ext) {
          if (!LIVE) return notReady("Enviar imagem");
          const mime = { svg: "image/svg+xml", jpg: "image/jpeg" }[ext];
          if (!mime) return { ok: false, message: "Formato de imagem não aceito." };
          const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const up = await sb.storage.from("theme-art").upload(path, blob, { contentType: mime, upsert: false });
          if (up.error) return fail(up.error);
          return { ok: true, url: sb.storage.from("theme-art").getPublicUrl(path).data.publicUrl };
        },
        async currentId() {
          if (!LIVE) return lsGet("mrc_theme_current", "");
          const { data } = await sb.from("themes").select("id").eq("is_current", true).maybeSingle();
          return data ? data.id : "";
        },
      },
    },

    /* ---------- BIBLIOTECA DE ARQUIVOS (imagens do site) — só donos ---------- */
    media: {
      publicUrl(path) { return LIVE ? sb.storage.from("site-media").getPublicUrl(path).data.publicUrl : ""; },
      async list() {
        if (!LIVE) return [];
        const { data, error } = await sb.storage.from("site-media").list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
        if (error) throw error;
        return (data || []).filter((f) => f.name && f.id).map((f) => ({ name: f.name, size: (f.metadata && f.metadata.size) || 0, createdAt: f.created_at, url: sb.storage.from("site-media").getPublicUrl(f.name).data.publicUrl }));
      },
      async upload(blob, originalName) {
        if (!LIVE) return notReady("Enviar arquivo");
        const base = String(originalName || "arquivo").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "arquivo";
        const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[blob.type];
        if (!ext) return { ok: false, message: "Use imagens JPG, PNG, WEBP ou GIF." };
        const path = `${Date.now().toString(36)}-${base}.${ext}`;
        const up = await sb.storage.from("site-media").upload(path, blob, { contentType: blob.type, upsert: false });
        return up.error ? fail(up.error) : { ok: true, name: path, url: sb.storage.from("site-media").getPublicUrl(path).data.publicUrl };
      },
      async remove(name) {
        if (!LIVE) return notReady("Apagar arquivo");
        const { error } = await sb.storage.from("site-media").remove([name]);
        return error ? fail(error) : { ok: true };
      },
    },

    /* ---------- CONFIGURAÇÕES DO SITE (somente chaves "public.*" são lidas pelo público) ---------- */
    settings: {
      async get(key) {
        if (!LIVE) return lsGet("mrc_setting_" + key, "");
        const { data } = await sb.from("site_settings").select("value").eq("key", key).maybeSingle();
        return data ? data.value || "" : "";
      },
      async set(key, value) {
        if (!LIVE) { lsSet("mrc_setting_" + key, value); return { ok: true }; }
        const { error } = value
          ? await sb.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
          : await sb.from("site_settings").delete().eq("key", key);
        return error ? fail(error) : { ok: true };
      },
    },

    /* ---------- ASSISTENTE (ChatGPT/OpenAI) para os donos ----------
       A chave da OpenAI fica só no servidor (função "assistant" do Supabase). Aqui só mandamos as mensagens. */
    assistant: {
      async ask(messages) {
        if (!LIVE) return { ok: false, code: "prototype", message: "O assistente só funciona com o login real." };
        const { data, error } = await sb.functions.invoke("assistant", { body: { messages } });
        if (error) {
          let code = "error";
          try { const body = await error.context.json(); code = body.error || code; if (code === "upstream") code = "upstream" + (body.status || ""); } catch (e) {}
          const msg = {
            not_configured: "O assistente ainda não foi ligado: falta cadastrar a chave da OpenAI no Supabase (veja as instruções acima).",
            rate_limited: "Você atingiu o limite de mensagens desta hora. Tente de novo daqui a pouco.",
            forbidden: "Só donos podem usar o assistente.",
            unauthorized: "Sua sessão expirou. Entre de novo.",
            upstream401: "A chave da OpenAI cadastrada não é válida. Confira no Supabase.",
            upstream429: "A conta da OpenAI está sem créditos ou no limite de uso.",
          }[code] || "Não consegui responder agora. Tente novamente em instantes.";
          return { ok: false, code, message: msg };
        }
        return { ok: true, reply: String((data && data.reply) || "") };
      },
    },
    /* ---------- DONOS PRINCIPAIS: quem pode ser dono ----------
       Só quem tem cargo "owner" (dono principal) consegue. O banco recusa os outros e impõe: no máximo 3 donos principais, sempre pelo menos 1. */
    owner: {
      async accounts() {
        if (!LIVE) return [];
        const { data, error } = await sb.from("profiles").select("id,name,display_name,email,role,created_at").order("created_at");
        if (error) throw error;
        return data || [];
      },
      async setRole(userId, role) {
        if (!LIVE) return notReady("Mudar cargo");
        const { error } = await sb.rpc("owner_set_role", { p_user: userId, p_role: role });
        return error ? fail(error) : { ok: true };
      },
      async log() {
        if (!LIVE) return [];
        const { data, error } = await sb.from("role_log").select("changed_by,target,old_role,new_role,changed_at").order("changed_at", { ascending: false }).limit(20);
        if (error) throw error;
        return data || [];
      },
    },
    passports: { stampsOf },
  };
})();
