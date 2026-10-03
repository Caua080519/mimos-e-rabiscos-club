# MEMORY.md

## Decisões
- 2026-10-03 — Stack: HTML/CSS/JS puros, sem build. Dados em `js/data.js` (global `SITE`) para funcionar em file://.
- 2026-10-03 — Checkout e área do assinante: fluxo simulado, sem cobrança real.
- 2026-10-03 — Usuário colou um briefing novo e escolheu: nome "Mimos e Rabiscos Club", domínio mimoserabiscosclub.com.br, planos Mimobox / Encantobox / Dream Box com 4-6 / 8-10 / 12-15 produtos (estimativa a validar). Substitui "Mimo & Rabiscos" e os placeholders "Box 1/2/3".
- 2026-10-03 — Projeto em `Documentos/mimo-e-rabiscos-club`.

- 2026-10-03 — Pré-assinatura/lista de espera REMOVIDA a pedido do usuário. Agora os botões das Boxes levam a `assinar.html?plano=id` (pagamento por Pix e cartão via link de pagamento, ex. Mercado Pago, em `SITE.payment.links`). Só deve entrar no painel quem pagou, o que exige banco de dados + login (ainda não existe). Não prometer cobrança real antes disso.
- 2026-10-03 — Lembretes por e-mail: o usuário desistiu e mandou apagar tudo (feito). Não oferecer de novo.
- Armadilha: nomes de classe genéricos (ex.: `.lead`) já existem no CSS; um estilo novo com o mesmo nome pintou de bege todos os textos `.lead`. Usar nomes específicos e conferir o impacto em outros elementos.
- O usuário quer a revelação do tema como animação visível de papel rasgando (não troca instantânea). Não consegui ver animações no navegador do painel (hidden + reduced-motion); validar por código e pedir que ele confirme no navegador dele.

- 2026-10-03 — Painel dos donos (usuário + pais) pedido: ver quem comprou, endereço, box, nº da compra (1ª, 2ª...) e o que colocar na caixa. Feito como protótipo em `admin.html`/`js/admin.js` com dados de exemplo. Não expor dados reais de clientes sem login e banco de dados.

- 2026-10-03 — Usuário quer o site "todo dinâmico": hover que faz crescer, mascote sorrindo (o mascote ainda não é definitivo), tema do mês que "rasga" e revela, caixa que abre. O mascote inline está em `js/app.js` (const MASCOT); trocar junto com `assets/lapis.svg`.
- Armadilha: o painel do navegador do app fica "hidden" e não dispara IntersectionObserver nem hover; efeitos de entrada/hover não dá para ver ali, só conferir por código.

- 2026-10-03 — Frase de posicionamento: faixa de ponta a ponta com degradê (rosa/lilás/azul) e fonte Porky's (usuário escolheu). Porky's não está no Google Fonts; fallback Chewy. Para usar a real: arquivo em `assets/fonts/Porkys.ttf` (conferir licença comercial). Hover mais suave (escala ~1.03, 0.7s, sem overshoot). Todos os lapisinhos riem o tempo todo. Tema do mês rasga com glitter saindo do lapisinho. Momentos Mimo usa ilustrações SVG de exemplo em `assets/momento-*.svg` (trocar por fotos reais).
- O navegador do painel do app emula prefers-reduced-motion: animações ficam desligadas lá; é só o teste, não bug.

- 2026-10-03 — Usuário aprovou as etapas 1-3 e pediu área do cliente + painel melhorado + PASSAPORTE DIGITAL, porque teme passaportes físicos falsificados e quer saber quem é cliente de verdade e a frequência. Feito como protótipo (dados fictícios): verificação compara código + nº de selos físicos com o registro; "cliente de verdade" = pagamento confirmado. Implementação real exige servidor.
- Regra: telas de dados usam `API` (js/services/api.js), nunca dados direto; nunca pôr segredos no front (repo público).

- 2026-10-03 — Usuário disse que a ÁREA DE LOGIN é super importante: cliente entra e vê suas caixas, pagamentos, entrega, frequência e imagem do passaporte. Front-end pronto (entrar.html + conta.html); login REAL depende de servidor (Supabase/Firebase). Nunca simular login que aceite qualquer senha; `SITE.auth.mode` controla a demo.

- 2026-10-03 — Usuário criou conta no Supabase; criei o projeto (id qrhpahmgcgimmrmlfdcj, org gomtbwmdgfnwtotpkuet) e o schema com RLS. Só a chave publishable está no site. NUNCA pôr a chave secreta no repo. Não criar contas de teste no Auth (regra: sem criar contas fora de localhost); quem testa o cadastro é o usuário.

- 2026-10-03 — Fluxo operacional sem pagamento automático: cliente cria conta, informa endereço, reserva Box (aguardando pagamento); dono confirma o pagamento no painel (Clientes > Registrar pagamento), que cria passaporte e a 1ª caixa; "Entregue" gera o selo oficial. Só promover alguém a admin com confirmação do usuário sobre o e-mail.
- Dados de cliente no painel vêm de cadastro público: SEMPRE escapar HTML (esc) antes de renderizar (XSS).
- O servidor local (python http.server) tem limite de 2h; quando cair o aviso diz para não reiniciar se já estava no máximo. Verificar JS com `node --check` e testar RLS por SQL com rollback.

## Preferências do usuário
- Fala português. Quer ver o resultado ao lado e ajustar aos poucos, então iterar em passos curtos.
- Arquivos de memória do Code são separados dos do Cowork.

## Armadilhas
- Não inventar números, prazos, produtos nem políticas; usar "em definição".
- "Rabiscos" é com B.

## Pendências
- Ver Em aberto em `CONTEXT.md`.
