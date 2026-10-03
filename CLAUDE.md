# CLAUDE.md

Instruções para o Claude Code neste projeto. Leia também `CONTEXT.md` (estado do projeto) e `MEMORY.md` (decisões). Este conjunto é só do Claude Code; não reaproveitar nada do Cowork.

## Projeto
Site do **Mimos e Rabiscos Club** (nome provisório, ainda a confirmar), clube de assinatura mensal de papelaria ligado à papelaria da família. Domínio planejado: mimoserabiscosclub.com.br. No site usar só "Mimos e Rabiscos" (nunca "RTech"). O briefing mais recente do usuário prevalece sobre o anterior.

## Stack
HTML, CSS e JS puros. Sem build, sem framework, sem backend. Deve abrir direto no navegador (file://), então nada de módulos ES nem fetch de JSON local: dados em `js/data.js` como objeto global `SITE`.

## Estrutura
- `index.html`: home
- `css/styles.css`: estilos e tokens de cor
- `js/data.js`: TODO conteúdo editável (marca, planos, temas, FAQ, passaporte)
- `js/app.js`: renderiza seções a partir de `SITE`
- `assets/`: mascote e imagens

## Regras de conteúdo (importante)
- Nunca inventar descontos, prazos de frete, produtos específicos ou políticas. Usar "em definição" com a classe `.tbd`.
- Planos: R$ 39,90 / R$ 69,90 / R$ 99,90 por mês. Nomes: **Mimobox** (4 a 6 produtos), **Encantobox** (8 a 10), **Dream Box** (12 a 15, sempre em inglês, nunca "Sonhobox"). Quantidades e preços são estrutura inicial a validar; mostrar como estimativa.
- Plano do meio: etiqueta "MAIS ESCOLHIDA". Plano caro: "EXPERIÊNCIA PREMIUM" e "Frete grátis*" (asterisco, em avaliação).
- Frete grátis NÃO é decisão final (alternativas: só no plano maior, por região, reduzido, incluso no preço, promoções).
- Público: estudantes, universitários, quem curte planners, organização, papelaria fofa e colecionar. Estética jovem e delicada, nunca exclusivamente infantil.
- Estratégia: começar enxuto, validar com poucos assinantes.
- Pagamento: PIX, cartão e boleto. Sem integração real; checkout e área do assinante são simulados.
- Preços, planos, temas e textos devem ser editáveis só em `js/data.js`.

## Design
- Paleta: branco dominante, bege claro, rosa pastel, lilás discreto, azul céu, dourado só em detalhes.
- Cantos arredondados, sombras suaves, muito espaço em branco. Delicado, moderno, premium e acessível; nada infantil nem "menininha".
- Mascote: lapisinho minimalista (placeholder em `assets/lapis.svg`), usado só em pequenos momentos.
- Mobile first, 100% responsivo.
- Referência de nível: Clube UniBox (só o padrão de apresentação, nunca copiar layout, textos ou identidade).

## Fluxo de trabalho
- O usuário acompanha o resultado ao lado e ajusta aos poucos: mudanças pequenas e focadas.
- Comunicação em português; código e nomes de arquivo em inglês quando fizer sentido.
- Ao fim de cada sessão, atualizar `MEMORY.md` e `CONTEXT.md`.
