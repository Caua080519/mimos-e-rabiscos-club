/* Gerador de arte para o tema do mês (SVG, 800x600).
   Lê o NOME e a DESCRIÇÃO do tema, procura palavras-chave (jardim, noite, mar, outono, natal, escola, doce...)
   e monta uma ilustração fofa no estilo da marca, com o lapisinho. Não usa internet nem IA externa:
   é um desenho montado por regras, então o resultado é sempre o mesmo para o mesmo texto.
   Para uma arte feita por IA ou fotos de verdade, use o botão "Enviar minha imagem" no painel. */
const ThemeArt = (function () {
  const strip = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ---------- peças (cada uma é desenhada em torno de 0,0) ---------- */
  const P = {
    flower: (c) => `<path d="M0 0V70" stroke="#6fbf8f" stroke-width="5" stroke-linecap="round"/><path d="M0 48q18-6 24-22-20 2-24 22z" fill="#8ed1a5"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cy="-15" rx="9" ry="15" fill="${c}" transform="rotate(${a})"/>`).join("")}<circle r="8" fill="#ffd98a"/>`,
    star: (c) => `<path d="M0-12 3.5-3.5 12 0 3.5 3.5 0 12-3.5 3.5-12 0-3.5-3.5z" fill="${c}"/>`,
    heart: (c) => `<path d="M0 8C-18-4-10-18 0-8 10-18 18-4 0 8z" fill="${c}"/>`,
    cloud: () => `<g fill="#fff" opacity=".92"><ellipse cx="0" cy="0" rx="34" ry="16"/><ellipse cx="-18" cy="-8" rx="18" ry="14"/><ellipse cx="12" cy="-12" rx="20" ry="16"/></g>`,
    moon: () => `<path d="M0-30a30 30 0 1 0 22 52 24 24 0 1 1-22-52z" fill="#fff3c4"/>`,
    sun: () => `<g stroke="#ffd98a" stroke-width="5" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="0" y1="-40" x2="0" y2="-54" transform="rotate(${a})"/>`).join("")}</g><circle r="30" fill="#ffe7a0"/>`,
    butterfly: (c) => `<ellipse cx="-11" cy="-5" rx="12" ry="9" fill="${c}" transform="rotate(-20 -11 -5)"/><ellipse cx="11" cy="-5" rx="12" ry="9" fill="${c}" transform="rotate(20 11 -5)"/><ellipse cx="-8" cy="8" rx="8" ry="6" fill="#fff" opacity=".8"/><ellipse cx="8" cy="8" rx="8" ry="6" fill="#fff" opacity=".8"/><rect x="-1.5" y="-8" width="3" height="20" rx="1.5" fill="#5b5470"/>`,
    mushroom: (c) => `<rect x="-6" y="0" width="12" height="22" rx="5" fill="#f6e9dc"/><path d="M-26 2a26 22 0 0 1 52 0z" fill="${c}"/><circle cx="-10" cy="-8" r="3.5" fill="#fff"/><circle cx="8" cy="-12" r="4" fill="#fff"/><circle cx="14" cy="-2" r="2.5" fill="#fff"/>`,
    leaf: (c) => `<path d="M0 0C22-24 46-4 0 44-46-4-22-24 0 0z" fill="${c}"/><path d="M0 4V38" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>`,
    snow: () => `<g stroke="#fff" stroke-width="3.5" stroke-linecap="round">${[0, 60, 120].map((a) => `<line x1="0" y1="-14" x2="0" y2="14" transform="rotate(${a})"/>`).join("")}</g>`,
    tree: () => `<rect x="-5" y="30" width="10" height="14" fill="#a97b55"/><path d="M0-34 22-6H-22z" fill="#5fb58a"/><path d="M0-18 28 14H-28z" fill="#4da57a"/><path d="M0-2 34 34H-34z" fill="#3f956c"/><path d="M0-44l3.5 8 8.5 1-6.5 6 2 8.5-7.5-4.5-7.5 4.5 2-8.5-6.5-6 8.5-1z" fill="#ffd98a" transform="translate(0 8) scale(.7)"/>`,
    shell: (c) => `<path d="M-22 12a22 22 0 0 1 44 0z" fill="${c}"/>${[-14, -5, 5, 14].map((x) => `<line x1="0" y1="12" x2="${x}" y2="-6" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`).join("")}`,
    note: (c) => `<rect x="-24" y="-30" width="48" height="60" rx="6" fill="${c}"/><rect x="-18" y="-24" width="36" height="48" rx="3" fill="#fff"/>${[-18, -8, 2, 12].map((y) => `<line x1="-12" y1="${y}" x2="12" y2="${y}" stroke="#d9cdf2" stroke-width="2"/>`).join("")}${[-22, -10, 2, 14].map((y) => `<circle cx="-24" cy="${y}" r="2.5" fill="#8b78c4"/>`).join("")}`,
    candy: (c) => `<circle r="16" fill="${c}"/><path d="M-11-11 11 11M-3-15 15 3M-15-3 3 15" stroke="#fff" stroke-width="3" opacity=".8"/><path d="M-16 0-30-8v16zM16 0 30-8v16z" fill="${c}"/>`,
    rainbow: () => `<g fill="none" stroke-width="9" stroke-linecap="round">${["#ff9bb8", "#ffcf8a", "#fff0a0", "#a8e2b8", "#9bd0f5", "#c3b1f0"].map((c, i) => `<path d="M${-70 + i * 8} 0a${70 - i * 8} ${70 - i * 8} 0 0 1 ${(70 - i * 8) * 2} 0" stroke="${c}"/>`).join("")}</g>`,
  };

  /* ---------- assuntos: palavras-chave -> cores e peças ---------- */
  const TOPICS = [
    { keys: ["jardim", "flor", "primavera", "natureza", "encantad", "borboleta", "campo", "bosque", "floresta"], sky: ["#dff3ea", "#fde6ef"], ground: ["#a8dfb7", "#8ed1a5"], acc: ["#f8a8c4", "#c3b1f0", "#ffd0a0", "#fff"], up: ["butterfly", "cloud", "star"], down: ["flower", "flower", "mushroom"], sun: "sun" },
    { keys: ["noite", "estrela", "lua", "sonho", "galax", "ceu", "espaco", "cosmo", "magic"], sky: ["#2f2a5c", "#6a4f9c"], ground: ["#5a4c8f", "#47397a"], acc: ["#ffe9a8", "#f8a8c4", "#b8d8ff", "#fff"], up: ["star", "star", "cloud", "heart"], down: ["mushroom", "star"], sun: "moon", dark: true },
    { keys: ["mar", "praia", "verao", "oceano", "sereia", "concha", "ferias", "ilha", "tropical"], sky: ["#cdeefc", "#fff1d6"], ground: ["#f6dfae", "#efd093"], acc: ["#ff9bb8", "#7fc8f0", "#ffd98a", "#fff"], up: ["cloud", "cloud", "star"], down: ["shell", "shell", "star"], sun: "sun", waves: true },
    { keys: ["outono", "folha", "cafe", "acolhedor", "aconchego", "laranja"], sky: ["#fde8d2", "#f9d4c0"], ground: ["#e9b98a", "#d9a06c"], acc: ["#e8894f", "#d9a06c", "#f2c14e", "#c96b5a"], up: ["leaf", "leaf", "leaf", "cloud"], down: ["mushroom", "leaf"], sun: "sun" },
    { keys: ["natal", "inverno", "neve", "festa", "fim de ano", "ano novo"], sky: ["#d9ecff", "#eef6ff"], ground: ["#ffffff", "#e5eef9"], acc: ["#ff8fa8", "#8fd0a8", "#ffd98a", "#fff"], up: ["snow", "snow", "star", "cloud"], down: ["tree", "tree", "heart"], sun: "moon" },
    { keys: ["escola", "estudo", "aula", "volta as aulas", "caderno", "planner", "organiza", "criativ", "rabisc"], sky: ["#e6defa", "#dff0fb"], ground: ["#f6e9dc", "#efd9c4"], acc: ["#f8a8c4", "#9bd0f5", "#ffd98a", "#c3b1f0"], up: ["star", "heart", "cloud"], down: ["note", "note", "star"], sun: "sun" },
    { keys: ["doce", "cute", "fofo", "bolo", "confeitaria", "algodao", "pastel", "carinho", "amor", "coracao"], sky: ["#ffe3ee", "#f0e6ff"], ground: ["#fbc9dc", "#f6b3cb"], acc: ["#ff8fb0", "#c3b1f0", "#ffd98a", "#9bd0f5"], up: ["heart", "heart", "cloud", "star"], down: ["candy", "candy", "heart"], sun: "sun" },
    { keys: ["arco", "iris", "rainbow", "alegria", "colorid", "festival"], sky: ["#dff0fb", "#fff3d6"], ground: ["#bfe8c8", "#a8dfb7"], acc: ["#ff9bb8", "#ffcf8a", "#9bd0f5", "#c3b1f0"], up: ["cloud", "star", "heart"], down: ["flower", "flower"], sun: "rainbow" },
  ];
  const DEFAULT = { sky: ["#dcefFb", "#f6e3ef"], ground: ["#cbe7d2", "#b5dcc0"], acc: ["#f8a8c4", "#c3b1f0", "#ffd98a", "#9bd0f5"], up: ["star", "heart", "cloud"], down: ["flower", "star"], sun: "sun" };

  function pick(text) {
    const t = strip(text);
    let best = null, score = 0;
    for (const tp of TOPICS) { const s = tp.keys.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0); if (s > score) { best = tp; score = s; } }
    return best || DEFAULT;
  }

  const place = (name, x, y, s, rot, c) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rot.toFixed(0)}) scale(${s.toFixed(2)})">${P[name](c)}</g>`;

  /* O lapisinho da marca (rindo) */
  const MASCOT = `<g transform="translate(-40 -118)"><polygon points="40,4 58,28 22,28" fill="#f3d9c4"/><polygon points="40,4 46,13 34,13" fill="#5b5470"/><rect x="22" y="28" width="36" height="12" fill="#e7c98a"/><rect x="22" y="40" width="36" height="62" rx="2" fill="#f6b8cc"/><rect x="22" y="40" width="9" height="62" fill="#f09ab5" opacity=".55"/><rect x="22" y="102" width="36" height="12" rx="6" fill="#d9cdf2"/><circle cx="34" cy="66" r="3.2" fill="#3b3550"/><circle cx="46" cy="66" r="3.2" fill="#3b3550"/><path d="M31 74Q40 92 49 74Z" fill="#c2456f" stroke="#3b3550" stroke-width="2" stroke-linejoin="round"/><circle cx="30" cy="74" r="3.4" fill="#f58aa8" opacity=".6"/><circle cx="50" cy="74" r="3.4" fill="#f58aa8" opacity=".6"/></g>`;

  function svg(name, description) {
    const title = String(name || "Tema do mês").trim().slice(0, 40) || "Tema do mês";
    const text = `${name} ${description}`;
    const tp = pick(text);
    const rand = rng(hash(strip(text)) || 1);
    const R = (a, b) => a + rand() * (b - a);
    const acc = () => tp.acc[Math.floor(rand() * tp.acc.length)];
    const W = 800, H = 600;
    let out = "";

    // céu
    out += `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tp.sky[0]}"/><stop offset="1" stop-color="${tp.sky[1]}"/></linearGradient>
      <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tp.ground[0]}"/><stop offset="1" stop-color="${tp.ground[1]}"/></linearGradient></defs>`;
    out += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;

    // sol / lua / arco-íris
    const sunX = R(580, 700), sunY = tp.sun === "rainbow" ? 380 : R(120, 170);
    out += place(tp.sun, sunX, sunY, tp.sun === "rainbow" ? 1.9 : 1.15, 0, "#fff");

    // elementos do céu
    const nUp = 9 + Math.floor(rand() * 4);
    for (let i = 0; i < nUp; i++) {
      const n = tp.up[Math.floor(rand() * tp.up.length)];
      const x = R(40, 760), y = R(150, 330);
      if (Math.abs(x - 400) < 280 && y > 220 && y < 380) continue; // deixa a faixa do meio livre para o título
      out += place(n, x, y, n === "cloud" ? R(.8, 1.5) : R(.7, 1.3), n === "leaf" || n === "snow" ? R(-60, 60) : R(-20, 20), acc());
    }

    // ondas (mar) ou colinas
    if (tp.waves) out += `<path d="M0 400q50-26 100 0t100 0 100 0 100 0 100 0 100 0 100 0 100 0V600H0z" fill="#9bd7f2" opacity=".8"/>`;
    out += `<path d="M0 450Q200 380 400 440T800 420V600H0z" fill="url(#gr)"/>`;
    out += `<path d="M0 500Q220 450 440 500T800 480V600H0z" fill="${tp.ground[1]}" opacity=".85"/>`;

    // elementos do chão
    const nDown = 8 + Math.floor(rand() * 4);
    for (let i = 0; i < nDown; i++) {
      const n = tp.down[Math.floor(rand() * tp.down.length)];
      const x = R(40, 760), y = R(455, 505);
      if (Math.abs(x - 400) < 80 && y < 480) continue;
      out += place(n, x, y, R(.8, 1.3), n === "star" || n === "heart" ? R(-15, 15) : R(-8, 8), acc());
    }

    // título SEMPRE no centro da imagem
    const fs = title.length <= 14 ? 76 : title.length <= 22 ? 62 : 46;
    const ink = tp.dark ? "#ffffff" : "#4d3585";
    out += `<rect x="70" y="${300 - fs * 0.85}" width="660" height="${fs * 1.45}" rx="${fs * 0.72}" fill="#ffffff" opacity="${tp.dark ? ".14" : ".72"}"/>`;
    out += `<text x="400" y="${300 + fs * 0.3}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fs}" font-weight="700" fill="${ink}">${esc(title)}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc("Arte do tema " + title)}">${out}</svg>`;
  }

  /* ---------- Sugestões de descrição e produtos (por assunto) ---------- */
  const IDEAS = {
    jardim: { d: "Um cantinho mágico onde a criatividade floresce.\n\nFlores, luz dourada e pequenos segredos esperam por você neste mês.", p: ["Caderneta com capa floral", "Adesivos de flores e borboletas", "Canetas em tons pastel", "Marca-textos suaves", "Washi tape botânica", "Cartão com mensagem de carinho"] },
    noite: { d: "Uma caixa para sonhar de olhos abertos.\n\nLua, estrelas e uma pitada de magia para os seus planos do mês.", p: ["Caderneta de capa azul-noite", "Adesivos de lua e estrelas", "Caneta com tinta prateada ou dourada", "Marca-textos pastel", "Washi tape estrelado", "Cartão com frase para sonhar"] },
    mar: { d: "Brisa, sol e areia dentro de uma caixa.\n\nUm mês leve, com cara de férias, para anotar tudo que você quer viver.", p: ["Bloquinho tema praia", "Adesivos de conchas e ondas", "Canetas em tons de mar", "Marca-textos coloridos", "Washi tape ondas", "Cartão com mensagem de verão"] },
    outono: { d: "Tons quentes e um clima aconchegante.\n\nUma caixa para planejar o mês com café, folhas douradas e muito carinho.", p: ["Caderneta em tons terrosos", "Adesivos de folhas e xícaras", "Canetas em cores quentes", "Marca-textos suaves", "Washi tape folhas", "Cartão com mensagem acolhedora"] },
    natal: { d: "O clima de festa chegando na sua mesa de estudos.\n\nBrilho, carinho e pequenos presentes para fechar o ano.", p: ["Agenda ou caderneta de fim de ano", "Adesivos natalinos", "Canetas vermelhas e verdes", "Marca-textos pastel", "Washi tape festivo", "Cartão para presentear"] },
    escola: { d: "Organização com personalidade para o seu ano.\n\nPlanejar, estudar e criar ficam muito mais gostosos com a papelaria certa.", p: ["Planner ou caderno de estudos", "Adesivos de organização", "Canetas coloridas", "Marca-textos", "Post-its decorados", "Régua ou marcador de páginas"] },
    doce: { d: "Uma caixa tão fofa que dá vontade de guardar.\n\nCoraçõezinhos, cores doces e muito carinho em cada detalhe.", p: ["Caderneta fofa", "Adesivos de doces e corações", "Canetas coloridas", "Marca-textos pastel", "Washi tape doce", "Cartão com recado carinhoso"] },
    arco: { d: "Um mês cheio de cor e alegria.\n\nCada item combina com o próximo para colorir o seu caderno.", p: ["Caderneta colorida", "Adesivos arco-íris", "Conjunto de canetas coloridas", "Marca-textos", "Washi tape colorida", "Cartão com mensagem alegre"] },
  };
  const GENERIC = (name) => ({ d: `Uma caixa pensada com carinho em torno do tema “${name}”.\n\nProdutos de papelaria que combinam entre si, para você descobrir mês a mês.`, p: ["Caderneta ou bloquinho do tema", "Adesivos exclusivos", "Canetas em tons que combinam", "Lápis ou marca-texto", "Item surpresa do mês", "Cartão com mensagem"] });
  function suggest(name, description) {
    const tp = pick(`${name} ${description}`);
    const key = Object.keys(IDEAS).find((k) => (tp.keys || []).some((w) => strip(w).startsWith(k))) || null;
    const r = key ? IDEAS[key] : GENERIC(String(name || "").trim() || "do mês");
    return { description: r.d, products: r.p.join("\n") };
  }
  return { svg, suggest, topic: (text) => pick(text) };
})();
if (typeof module !== "undefined") module.exports = ThemeArt;
