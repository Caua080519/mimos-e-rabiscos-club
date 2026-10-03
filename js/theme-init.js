/* Aplica o tema (claro/escuro) ANTES da página aparecer, para não piscar.
   A escolha fica salva neste navegador (localStorage "mrc_theme": "light", "dark" ou "auto"). Padrão: claro. */
(function () {
  try {
    var mode = localStorage.getItem("mrc_theme") || "light";
    var dark = mode === "dark" || (mode === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
