/* Imagens interativas do Unboxing (SVG desenhado à mão, no estilo da marca).
   Passar o mouse, tocar ou usar o teclado "abre" cada cena (classe .is-on); as animações ficam no CSS (css/styles.css). */
const UnboxArt = (function () {
  const star = (x, y, s, c) => `<path d="M0-12 3.5-3.5 12 0 3.5 3.5 0 12-3.5 3.5-12 0-3.5-3.5z" fill="${c}" transform="translate(${x} ${y}) scale(${s})"/>`;

  // 1) Abrir: a tampa levanta, o laço se solta e os itens espiam
  const abrir = `<svg viewBox="0 0 300 220" class="ub" aria-hidden="true" focusable="false">
    <ellipse cx="150" cy="199" rx="98" ry="10" fill="#3b3550" opacity=".13"/>
    <g class="ub-peek">
      <rect x="104" y="58" width="14" height="66" rx="7" fill="#8b78c4" transform="rotate(-12 111 124)"/>
      <rect x="150" y="52" width="38" height="50" rx="5" fill="#fff" stroke="#e6dcf6" stroke-width="3" transform="rotate(7 169 102)"/>
      <path d="M170 64h18M170 74h18M170 84h12" stroke="#d9cdf2" stroke-width="3" stroke-linecap="round" transform="rotate(7 169 102)"/>
      <circle cx="214" cy="84" r="16" fill="#c6e4f8"/><circle cx="214" cy="84" r="6" fill="#fbf6ef"/>
    </g>
    <rect x="64" y="106" width="172" height="90" rx="11" fill="#f9c5d7"/>
    <rect x="64" y="106" width="172" height="20" fill="#f4b0c8"/>
    <rect x="140" y="106" width="20" height="90" fill="#e9c97a"/>
    <g class="ub-lid">
      <rect x="54" y="80" width="192" height="34" rx="10" fill="#d9cdf2"/>
      <rect x="140" y="80" width="20" height="34" fill="#e9c97a"/>
      <g class="ub-bow"><ellipse cx="134" cy="74" rx="15" ry="11" fill="#e9c97a"/><ellipse cx="166" cy="74" rx="15" ry="11" fill="#e9c97a"/><circle cx="150" cy="77" r="7" fill="#d4a94a"/></g>
    </g>
    <g class="ub-sp">${star(52, 56, 1, "#c9a45c")}${star(250, 44, 1.2, "#f09ab5")}${star(150, 26, .9, "#8b78c4")}${star(268, 116, .8, "#c9a45c")}${star(34, 128, .8, "#8b78c4")}</g>
  </svg>`;

  // 2) Descobrir: os itens saem da caixa em leque
  const descobrir = `<svg viewBox="0 0 300 220" class="ub" aria-hidden="true" focusable="false">
    <ellipse cx="150" cy="199" rx="98" ry="10" fill="#3b3550" opacity=".13"/>
    <g class="ub-it ub-it1"><rect x="82" y="64" width="54" height="72" rx="6" fill="#fbd0df"/><rect x="82" y="64" width="9" height="72" fill="#f09ab5" opacity=".6"/><path d="M100 84h28M100 96h28M100 108h20" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
    <g class="ub-it ub-it2"><rect x="146" y="38" width="13" height="92" rx="6.5" fill="#8b78c4"/><path d="M146 40l6.5-16 6.5 16z" fill="#f3d9c4"/><path d="M149.5 31l3-7 3 7z" fill="#5b5470"/></g>
    <g class="ub-it ub-it3"><rect x="172" y="66" width="52" height="68" rx="7" fill="#fff" stroke="#e6dcf6" stroke-width="3"/><circle cx="188" cy="86" r="9" fill="#f9c5d7"/><path d="M208 98l5 10 11 1.5-8 8 2 11-10-5.500-10 5.500 2-11-8-8 11-1.500z" fill="#ffd98a" transform="translate(-8 -10) scale(.8)"/><circle cx="196" cy="118" r="7" fill="#c6e4f8"/></g>
    <g class="ub-it ub-it4"><circle cx="118" cy="68" r="21" fill="#c6e4f8"/><circle cx="118" cy="68" r="8" fill="#fbf6ef"/><path d="M104 60q14-10 28 0" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/></g>
    <g class="ub-it ub-it5"><path d="M0 14C-26-6-14-30 0-14 14-30 26-6 0 14z" fill="#f09ab5" transform="translate(212 60) scale(.9)"/></g>
    <rect x="64" y="120" width="172" height="76" rx="11" fill="#e5d8fa"/>
    <rect x="64" y="120" width="172" height="16" fill="#d9cdf2"/>
    <rect x="132" y="150" width="36" height="14" rx="7" fill="#fff" opacity=".75"/>
    <g class="ub-sp">${star(48, 70, 1, "#c9a45c")}${star(256, 56, 1.1, "#f09ab5")}${star(262, 140, .8, "#8b78c4")}</g>
  </svg>`;

  // 3) Rabiscar: os desenhos aparecem na página, riscados por uma canetinha
  const rabiscar = `<svg viewBox="0 0 300 220" class="ub" aria-hidden="true" focusable="false">
    <ellipse cx="150" cy="204" rx="104" ry="9" fill="#3b3550" opacity=".12"/>
    <rect x="44" y="22" width="212" height="170" rx="14" fill="#fff" stroke="#e6dcf6" stroke-width="4"/>
    ${[40, 62, 84, 106, 128, 150, 172].map((y) => `<circle cx="44" cy="${y}" r="4.500" fill="#8b78c4"/>`).join("")}
    <g stroke="#ece4f6" stroke-width="2">${[66, 90, 114, 138, 162].map((y) => `<line x1="64" y1="${y}" x2="240" y2="${y}"/>`).join("")}</g>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4">
      <path class="ub-draw d1" pathLength="100" d="M92 78c-8-14 10-26 16-12 12-10 22 6 10 14 8 12-10 20-16 8-10 6-22-4-10-10z" stroke="#f09ab5"/>
      <path class="ub-draw d2" pathLength="100" d="M104 90v26" stroke="#6fbf8f"/>
      <path class="ub-draw d3" pathLength="100" d="M168 62l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" stroke="#c9a45c"/>
      <path class="ub-draw d4" pathLength="100" d="M70 142q12-16 24 0t24 0 24 0 24 0" stroke="#8b78c4"/>
      <path class="ub-draw d5" pathLength="100" d="M196 130c-18-12-10-26 0-16 10-10 18 4 0 16z" stroke="#f58aa8"/>
      <path class="ub-draw d6" pathLength="100" d="M70 168h96" stroke="#6fa8d6"/>
    </g>
    <g class="ub-pen"><rect x="214" y="128" width="12" height="62" rx="6" fill="#8b78c4" transform="rotate(30 220 160)"/><path d="M206 190l5-12 8 6z" fill="#f3d9c4" transform="rotate(30 220 160)"/><path d="M205 192l2-5 4 3z" fill="#3b3550" transform="rotate(30 220 160)"/></g>
  </svg>`;

  const scenes = [abrir, descobrir, rabiscar];
  const hints = ["Passe o mouse ou toque para abrir", "Passe o mouse ou toque para descobrir", "Passe o mouse ou toque para rabiscar"];
  return { scenes, hints };
})();
