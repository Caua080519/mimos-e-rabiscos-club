(function () {
  const $ = (id) => document.getElementById(id);
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Marca como "em definição" qualquer texto que contenha o TBD
  const tbd = (s) => (String(s).includes(TBD) ? `<span class="tbd">${esc(s)}</span>` : esc(s));

  const S = SITE;

  // Header / nav
  $("nav").innerHTML = S.nav.map((n) => `<a href="${n.href}">${esc(n.label)}</a>`).join("");
  const burger = $("burger");
  burger.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
  });
  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
  };
  burger.setAttribute("aria-controls", "nav");
  burger.addEventListener("click", () => burger.setAttribute("aria-label", document.body.classList.contains("menu-open") ? "Fechar menu" : "Abrir menu"));
  $("nav").addEventListener("click", closeMenu);
  // Fecha o menu ao tocar fora dele, ao apertar Esc ou ao voltar para a tela larga
  document.addEventListener("click", (e) => { if (!e.target.closest(".header")) closeMenu(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMenu(); burger.focus(); } });
  window.matchMedia("(min-width: 880px)").addEventListener("change", closeMenu);

  // Logo: volta ao topo sem recarregar (o header é sticky, então #top não rola até o início)
  document.querySelector(".logo").addEventListener("click", (e) => {
    e.preventDefault();
    document.body.classList.remove("menu-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Hero + posicionamento
  $("hero-title").textContent = S.brand.tagline;
  $("hero-lead").textContent = S.brand.heroLead;
  $("statement").textContent = S.brand.positioning;

  // Passos
  $("steps").innerHTML = S.steps
    .map((s, i) => `<li class="step"><span class="step__n">${i + 1}</span><h3>${esc(s.title)}</h3><p>${tbd(s.text)}</p></li>`)
    .join("");

  // Planos
  $("plans").innerHTML = S.plans
    .map(
      (p) => `
    <article class="plan${p.highlight ? " plan--hl" : ""}">
      ${p.badge ? `<span class="plan__badge">${esc(p.badge)}</span>` : ""}
      <div class="plan__art plan__art--${p.id}" aria-hidden="true">
        <strong>${(p.items.match(/\d+/g) || []).join("–")}</strong><span>produtos</span>
      </div>
      <h3>${esc(p.name)}</h3>
      <p class="plan__blurb">${esc(p.blurb)}</p>
      <p class="plan__price"><strong>${brl(p.price)}</strong><span>/mês</span></p>
      <ul>${p.benefits.map((b) => `<li>${tbd(b)}</li>`).join("")}</ul>
      <a class="btn${p.highlight ? "" : " btn--ghost"}" href="assinar.html?plano=${p.id}">Assinar ${esc(p.name)}</a>
    </article>`
    )
    .join("");
$("shipping-note").textContent = S.itemsNote + " " + S.freeShippingNote;

  // Comparação
  const cell = (v, i) => {
    if (v === "items") return esc(S.plans[i].items);
    if (v === "price") return `<strong>${brl(S.plans[i].price)}</strong>`;
    if (v === true) return `<span class="yes" aria-label="Incluso">✓</span>`;
    if (v === false) return `<span class="no" aria-label="Não incluso">—</span>`;
    return tbd(v);
  };
  $("compare").innerHTML =
    `<thead><tr><th></th>${S.plans.map((p) => `<th>${esc(p.name)}</th>`).join("")}</tr></thead><tbody>` +
    S.comparison
      .map((r) => `<tr><th scope="row">${esc(r.label)}</th>${r.values.map((v, i) => `<td>${cell(v, i)}</td>`).join("")}</tr>`)
      .join("") +
    `</tbody>`;

  // Tema do mês
  $("theme-name").textContent = S.currentTheme.name;
  $("theme-text").textContent = S.currentTheme.text;
  $("theme-month").textContent = "Tema: " + S.currentTheme.month;

  // Unboxing
  $("unbox").innerHTML = S.unboxing
    .map((u, i) => `<div class="unbox__item"><div class="unbox__ph" aria-hidden="true">${i + 1}</div><h3>${esc(u.title)}</h3><p>${esc(u.text)}</p></div>`)
    .join("");

  // Passaporte
  $("passport-text").textContent = S.passport.text;
  let stamps = "";
  for (let i = 1; i <= S.passport.total; i++) {
    const done = i <= S.passport.demoStamped;
    const last = i === S.passport.total;
    stamps += `<div class="stamp${done ? " stamp--on" : ""}${last ? " stamp--gift" : ""}">${last ? "★" : done ? "♥" : i}</div>`;
  }
  $("stamps").innerHTML = stamps;
  $("passport-gift").textContent = S.passport.gift;

  // Temas futuros
  $("future").innerHTML = S.futureThemes
    .map((t) => `<div class="future__card"><span class="future__lock">✦</span><h3>${esc(t.name)}</h3><p class="tbd">${esc(t.note)}</p></div>`)
    .join("");

  // Momentos Mimo
  $("moments").innerHTML = S.moments
    .map((m) => `<figure class="moment">${m.img ? `<img class="moment__img" src="${esc(m.img)}" alt="${esc(m.alt || "")}" width="400" height="400" loading="lazy" decoding="async">` : `<div class="moment__ph" aria-hidden="true"></div>`}<figcaption><strong>${esc(m.name)}</strong><p>${esc(m.text)}</p></figcaption></figure>`)
    .join("");

  // FAQ
  $("faq-list").innerHTML = S.faq
    .map((f) => `<details><summary>${esc(f.q)}</summary><p>${tbd(f.a)}</p></details>`)
    .join("");

  // Footer
  $("f-brand").textContent = S.brand.club;
  $("f-contact").innerHTML = tbd(S.footer.contact);
  $("f-social").innerHTML = S.footer.social.map((s) => `<a href="${s.href}">${esc(s.label)}</a>`).join("");
  $("year").textContent = new Date().getFullYear();

  // Mascote inline (para poder animar o rosto). Placeholder: trocar junto com assets/lapis.svg
  const MASCOT = `
  <svg class="mascot" viewBox="0 0 80 120" role="img" aria-label="Lapisinho, mascote do clube">
    <g class="mascot__body">
      <polygon points="40,4 58,28 22,28" fill="#f3d9c4"/>
      <polygon points="40,4 46,13 34,13" fill="#5b5470"/>
      <rect x="22" y="28" width="36" height="12" fill="#e7c98a"/>
      <rect x="22" y="40" width="36" height="62" rx="2" fill="#f6b8cc"/>
      <rect x="22" y="40" width="9" height="62" fill="#f09ab5" opacity=".55"/>
      <rect x="22" y="102" width="36" height="12" rx="6" fill="#d9cdf2"/>
      <g class="mascot__eyes"><circle cx="34" cy="66" r="3.2" fill="#3b3550"/><circle cx="46" cy="66" r="3.2" fill="#3b3550"/></g>
      <path class="mascot__smile" d="M35 76 Q40 82 45 76" fill="none" stroke="#3b3550" stroke-width="2.4" stroke-linecap="round"/>
      <g class="mascot__grin"><path d="M31 74 Q40 92 49 74 Z" fill="#c2456f" stroke="#3b3550" stroke-width="2" stroke-linejoin="round"/><path d="M35 82 Q40 88 45 82 Q40 79 35 82Z" fill="#f58aa8"/></g>
      <circle class="mascot__cheek" cx="30" cy="74" r="3.4" fill="#f58aa8" opacity=".55"/>
      <circle class="mascot__cheek" cx="50" cy="74" r="3.4" fill="#f58aa8" opacity=".55"/>
    </g>
  </svg>`;
  document.querySelectorAll("[data-mascot]").forEach((el) => (el.innerHTML = MASCOT));

  // Glitter que sai do lapisinho quando o papel rasga (posição/atraso aleatórios, definidos uma vez)
  const art = document.querySelector(".tear__art");
  if (art) {
    const colors = ["#c9a45c", "#f09ab5", "#ffffff", "#8b78c4", "#6fa8d6"];
    for (let i = 0; i < 16; i++) {
      const g = document.createElement("i");
      g.className = "glit";
      const ang = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const dist = 70 + Math.random() * 70;
      g.style.cssText =
        `--dx:${Math.round(Math.cos(ang) * dist)}px;--dy:${Math.round(Math.sin(ang) * dist - 20)}px;` +
        `--d:${(Math.random() * 1.6).toFixed(2)}s;--s:${6 + Math.round(Math.random() * 9)}px;--c:${colors[i % colors.length]}`;
      art.appendChild(g);
    }
  }

  // Tema do mês vindo do Painel dos donos (Supabase). Leitura pública, só do tema marcado "do mês".
  // Se não houver tema ou der erro, a seção continua com o texto padrão.
  (async function loadTheme() {
    const a = S.auth;
    if (!a || a.mode !== "live" || !a.supabase) return;
    try {
      const r = await fetch(`${a.supabase.url}/rest/v1/themes?is_current=eq.true&select=name,description,products,image_url,ship_date&limit=1`, { headers: { apikey: a.supabase.key } });
      if (!r.ok) return;
      const t = (await r.json())[0];
      if (!t || !t.name) return;
      $("theme-name").textContent = "Tema do mês: " + t.name;
      if (t.description) $("theme-text").textContent = t.description;
      const tag = $("theme-month");
      tag.classList.remove("tbd");
      tag.textContent = t.ship_date ? "Envio em " + new Date(t.ship_date + "T12:00:00").toLocaleDateString("pt-BR") : "Tema: " + t.name;
      if (t.products && t.products.length) {
        const ul = document.createElement("ul");
        ul.className = "theme__products";
        t.products.forEach((p) => { const li = document.createElement("li"); li.textContent = p; ul.appendChild(li); });
        tag.before(ul);
      }
      const art = document.querySelector(".tear__art");
      if (art) {
        art.querySelector("strong").textContent = t.name;
        const small = art.querySelector("small");
        small.classList.remove("tbd");
        small.textContent = t.ship_date ? "chega em " + new Date(t.ship_date + "T12:00:00").toLocaleDateString("pt-BR") : "";
        if (/^(https?:\/\/|assets\/)/.test(t.image_url || "")) {
          art.classList.add("tear__art--img");
          art.style.backgroundImage = `url("${encodeURI(t.image_url)}")`;
          art.style.backgroundSize = "cover";
          art.style.backgroundPosition = "center";
        }
      }
    } catch (e) { /* mantém o texto padrão */ }
  })();

  // Papel que rasga: faixas horizontais com borda irregular no meio; cada faixa sai com um pequeno atraso,
  // então o rasgo "corre" de cima para baixo
  const paper = document.querySelector(".tear__paper");
  if (paper) {
    const ROWS = 10;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const xs = Array.from({ length: ROWS + 1 }, (_, k) => 50 + (k % 2 ? 1 : -1) * rnd(3, 8));
    let html = "";
    for (let i = 0; i < ROWS; i++) {
      const y0 = Math.max(0, (i * 100) / ROWS - 0.3);
      const y1 = Math.min(100, ((i + 1) * 100) / ROWS + 0.3);
      const ym = (y0 + y1) / 2;
      const xm = 50 + rnd(-6, 6);
      const delay = (i * 0.085).toFixed(3);
      const rot = rnd(-26, -8).toFixed(1);
      const content = `<span>Revelação</span><small>passe o mouse ou toque</small>`;
      html +=
        `<div class="tear__piece tear__piece--l" style="--delay:${delay}s;--rot:${rot}deg;transform-origin:0 ${ym}%;` +
        `clip-path:polygon(0 ${y0}%,${xs[i]}% ${y0}%,${xm}% ${ym}%,${xs[i + 1]}% ${y1}%,0 ${y1}%)">${content}</div>` +
        `<div class="tear__piece tear__piece--r" style="--delay:${delay}s;--rot:${rot}deg;transform-origin:100% ${ym}%;` +
        `clip-path:polygon(${xs[i]}% ${y0}%,100% ${y0}%,100% ${y1}%,${xs[i + 1]}% ${y1}%,${xm}% ${ym}%)">${content}</div>`;
    }
    paper.innerHTML = html;
  }

  // Tema do mês: toque/teclado também revelam (no mouse é só passar por cima)
  const tear = document.querySelector(".tear");
  if (tear) {
    tear.addEventListener("click", () => tear.classList.toggle("is-open"));
    tear.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tear.classList.toggle("is-open"); }
    });
  }

  // CTA fixo no celular: aparece depois do topo e some quando as Boxes estão na tela
  const sticky = $("sticky-cta");
  const boxesEl = $("boxes");
  const updateSticky = () => {
    const past = window.scrollY > 520;
    const r = boxesEl.getBoundingClientRect();
    const onBoxes = r.top < window.innerHeight * 0.7 && r.bottom > 0;
    const show = past && !onBoxes;
    sticky.classList.toggle("is-on", show);
    sticky.setAttribute("aria-hidden", show ? "false" : "true");
    sticky.tabIndex = show ? 0 : -1;

    // Destaca no menu a seção que está na tela
    let activeHref = "";
    S.nav.forEach((n) => {
      const sec = document.querySelector(n.href);
      if (sec && sec.getBoundingClientRect().top <= 140) activeHref = n.href;
    });
    document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === activeHref));
  };
  window.addEventListener("scroll", updateSticky, { passive: true });
  updateSticky();

  // Entrada suave das seções ao rolar
  document.documentElement.classList.add("js");
  const targets = document.querySelectorAll(".section__head, .step, .plan, .table-wrap, .theme > *, .unbox__item, .passport > *, .future__card, .moment, .faq details, .statement__text");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("in");
        io.unobserve(el);
        // Depois da entrada, devolve o elemento ao CSS normal para o efeito de hover funcionar
        setTimeout(() => { el.classList.remove("reveal", "in"); el.style.transitionDelay = ""; }, 1100);
      }),
      { threshold: 0.12 }
    );
    targets.forEach((t, i) => { t.classList.add("reveal"); t.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(t); });
  }
})();

