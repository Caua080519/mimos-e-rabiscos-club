# MEMORY.md

## Decisões
- 2026-10-03 — Stack: HTML/CSS/JS puros, sem build. Dados em `js/data.js` (global `SITE`) para funcionar em file://.
- 2026-10-03 — Checkout e área do assinante: fluxo simulado, sem cobrança real.
- 2026-10-03 — Usuário colou um briefing novo e escolheu: nome "Mimos e Rabiscos Club", domínio mimoserabiscosclub.com.br, planos Mimobox / Encantobox / Dream Box com 4-6 / 8-10 / 12-15 produtos (estimativa a validar). Substitui "Mimo & Rabiscos" e os placeholders "Box 1/2/3".
- 2026-10-03 — Projeto em `Documentos/mimo-e-rabiscos-club`.

- 2026-10-03 — Caminho enxuto aprovado: pré-assinatura (lista de espera) no lugar do checkout de 7 etapas por enquanto. Os botões dos planos levam a `pre-assinatura.html?plano=id`. Cadastros ficam só no localStorage até existir destino real (e-mail, planilha ou WhatsApp em `SITE.footer.whatsappNumber`).

- 2026-10-03 — Painel dos donos (usuário + pais) pedido: ver quem comprou, endereço, box, nº da compra (1ª, 2ª...) e o que colocar na caixa. Feito como protótipo em `admin.html`/`js/admin.js` com dados de exemplo. Não expor dados reais de clientes sem login e banco de dados.

- 2026-10-03 — Usuário quer o site "todo dinâmico": hover que faz crescer, mascote sorrindo (o mascote ainda não é definitivo), tema do mês que "rasga" e revela, caixa que abre. O mascote inline está em `js/app.js` (const MASCOT); trocar junto com `assets/lapis.svg`.
- Armadilha: o painel do navegador do app fica "hidden" e não dispara IntersectionObserver nem hover; efeitos de entrada/hover não dá para ver ali, só conferir por código.

- 2026-10-03 — Frase de posicionamento: faixa de ponta a ponta com degradê (rosa/lilás/azul) e fonte Porky's (usuário escolheu). Porky's não está no Google Fonts; fallback Chewy. Para usar a real: arquivo em `assets/fonts/Porkys.ttf` (conferir licença comercial). Hover mais suave (escala ~1.03, 0.7s, sem overshoot). Todos os lapisinhos riem o tempo todo. Tema do mês rasga com glitter saindo do lapisinho. Momentos Mimo usa ilustrações SVG de exemplo em `assets/momento-*.svg` (trocar por fotos reais).
- O navegador do painel do app emula prefers-reduced-motion: animações ficam desligadas lá; é só o teste, não bug.

## Preferências do usuário
- Fala português. Quer ver o resultado ao lado e ajustar aos poucos, então iterar em passos curtos.
- Arquivos de memória do Code são separados dos do Cowork.

## Armadilhas
- Não inventar números, prazos, produtos nem políticas; usar "em definição".
- "Rabiscos" é com B.

## Pendências
- Ver Em aberto em `CONTEXT.md`.
