/* Imagem do Passaporte dos Mimos (SVG gerado). Serve para mostrar na tela e para baixar em PNG.
   Recebe o cliente já com `stamps` (registro oficial). Não usa fontes da web, para o PNG sair igual. */
const PassportImage = (function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const W = 360, H = 500;

  function svg(c, total) {
    const have = new Set((c.stamps || []).map((s) => s.n));
    let stamps = "";
    for (let i = 1; i <= total; i++) {
      const col = (i - 1) % 4, row = Math.floor((i - 1) / 4);
      const cx = 62 + col * 79, cy = 290 + row * 74;
      const on = have.has(i), gift = i === total;
      stamps += `<circle cx="${cx}" cy="${cy}" r="29" fill="${on ? "#f9c5d7" : "#ffffff"}" stroke="${gift ? "#c9a45c" : on ? "#e98fae" : "#cfc3ea"}" stroke-width="3" ${on ? "" : 'stroke-dasharray="6 5"'}/>` +
        `<text x="${cx}" y="${cy + 7}" text-anchor="middle" font-family="Georgia,serif" font-size="${on || gift ? 22 : 18}" fill="${gift ? "#c9a45c" : on ? "#d9558a" : "#a99fbd"}">${gift ? "★" : on ? "♥" : i}</text>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe5fb"/><stop offset="1" stop-color="#fbd9e5"/></linearGradient></defs>
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="28" fill="url(#g)" stroke="#c9a45c" stroke-width="3"/>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="20" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="3 6"/>
  <text x="${W / 2}" y="66" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="#5a3f9a">Passaporte</text>
  <text x="${W / 2}" y="94" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#5a3f9a">dos Mimos</text>
  <g transform="translate(166 108) scale(.45)"><polygon points="40,4 58,28 22,28" fill="#f3d9c4"/><polygon points="40,4 46,13 34,13" fill="#5b5470"/><rect x="22" y="28" width="36" height="12" fill="#e7c98a"/><rect x="22" y="40" width="36" height="62" rx="2" fill="#f6b8cc"/><rect x="22" y="102" width="36" height="12" rx="6" fill="#d9cdf2"/><circle cx="34" cy="66" r="3.2" fill="#3b3550"/><circle cx="46" cy="66" r="3.2" fill="#3b3550"/><path d="M31 74 Q40 92 49 74 Z" fill="#c2456f" stroke="#3b3550" stroke-width="2" stroke-linejoin="round"/></g>
  <text x="${W / 2}" y="190" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" letter-spacing="2" fill="#7a7490">TITULAR</text>
  <text x="${W / 2}" y="214" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#3b3550">${esc(c.name)}</text>
  <text x="${W / 2}" y="240" text-anchor="middle" font-family="Courier New,monospace" font-size="13" letter-spacing="1" fill="#7a7490">${esc(c.passportCode || "—")}</text>
  ${stamps}
  <text x="${W / 2}" y="${H - 34}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#5a3f9a">${have.size} de ${total} selos</text>
  <text x="${W / 2}" y="${H - 18}" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#7a7490">Mimos e Rabiscos Club · demonstração</text>
</svg>`;
  }

  const dataUrl = (c, total) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg(c, total));

  // Baixa o passaporte como imagem PNG
  function downloadPng(c, total, filename) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = W * 2; canvas.height = H * 2;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) return resolve(false);
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = filename || "passaporte-dos-mimos.png";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          resolve(true);
        }, "image/png");
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl(c, total);
    });
  }

  return { svg, dataUrl, downloadPng };
})();
