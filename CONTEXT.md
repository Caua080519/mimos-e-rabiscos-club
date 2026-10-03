# CONTEXT.md

## Objetivo
Site do Mimos e Rabiscos Club (nome provisório; domínio mimoserabiscosclub.com.br): clube de assinatura de papelaria. A pessoa assina e recebe todo mês uma caixa com produtos de papelaria, tema do mês e surpresas. Deve parecer uma experiência de assinatura ("presente que chega todo mês"), não uma loja simples.

## Tom
Carinho, criatividade, surpresa, exclusividade, organização, colecionismo, comunidade.

## Programa Passaporte dos Mimos
Fidelidade físico: a primeira compra dá direito ao passaporte; cada Box recebida ganha um selo (12 espaços). Ao completar 12, desbloqueia um presente exclusivo (indefinido).

## Estado atual
- [x] Briefing recebido
- [x] Base do projeto e `CLAUDE.md`/`CONTEXT.md`/`MEMORY.md`
- [x] Home v1 (todas as seções, conteúdo placeholder)
- [x] Cabeçalho corrigido para telas pequenas
- [x] `assinar.html` + `js/checkout.js`: escolha da Box e botão "Ir para o pagamento" (Pix e cartão). Os links de pagamento ficam em `SITE.payment.links` (js/data.js); vazios = botão desativado com aviso. A antiga pré-assinatura/lista de espera foi removida.
- [x] Lembretes por e-mail: formulário em `assinar.html` (nome, e-mail, consentimento LGPD, campo-armadilha), enviado a um serviço externo via `SITE.leads` (js/data.js). Escondido enquanto `endpoint` estiver vazio. Textos dos 3 e-mails e passo a passo em `docs/email-lembretes.md`. Pendente: o usuário criar a conta (MailerLite/Brevo) e colar o endpoint.
- [x] Logo do topo volta ao início sem recarregar (home)
- [x] `admin.html`: painel dos donos (protótipo, dados só no localStorage, sem login). Mostra cliente, box, nº da compra, endereço, o que colocar na caixa (passaporte na 1ª, selo nas demais), status e rastreio, mais a lista de espera.
- [ ] Painel real: precisa de banco de dados + login (ex.: Supabase/Firebase) e dos pedidos chegando de verdade
- [x] Home dinâmica: mascote inline que sorri, caixa do hero que abre, frase em Caveat com faixa colorida, cards que crescem no hover (Como funciona, Boxes, Unboxing, Temas futuros, Momentos, FAQ), tema do mês com papel que rasga (hover/toque/teclado), entrada suave ao rolar. Respeita prefers-reduced-motion.
- [x] Revisão geral (2026-10-03): hero com preço e CTA "Escolher minha Box", cards das Boxes com faixa colorida de quantidade, CTA fixo no celular, textos revisados, foco visível, metas OG. Preços, nomes e quantidades dos planos NÃO foram alterados.
- [x] Publicado: repositório Caua080519/mimos-e-rabiscos-club (GitHub Pages), com `admin.html`. Atualizações: commit aqui + "Push origin" no GitHub Desktop.
- [ ] Ajustes de visual com o usuário
- [ ] Checkout simulado em 7 etapas (Box, duração, conta, endereço, pagamento, revisão, confirmação)
- [ ] Área do assinante (plano, próxima cobrança, envio, passaporte, histórico, cupons, cancelamento)
- [ ] Página de sucesso, estados de carregamento e vazios

## Em aberto
- Nomes definitivos dos planos (clima "céu")
- Benefícios por plano, cupons, descontos de 6 e 12 meses
- "Frete grátis*" (em avaliação), presente do passaporte
- Mascote oficial, logo, fotos reais
- Tema do mês e temas futuros

_Última atualização: 2026-10-03_
