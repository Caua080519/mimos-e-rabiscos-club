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
- [x] `pre-assinatura.html` (lista de espera, sem cobrança; salva só no navegador via localStorage)
- [x] Logo do topo volta ao início sem recarregar (home)
- [x] `admin.html`: painel dos donos (protótipo, dados só no localStorage, sem login). Mostra cliente, box, nº da compra, endereço, o que colocar na caixa (passaporte na 1ª, selo nas demais), status e rastreio, mais a lista de espera.
- [ ] Painel real: precisa de banco de dados + login (ex.: Supabase/Firebase) e dos pedidos chegando de verdade
- [x] Home dinâmica: mascote inline que sorri, caixa do hero que abre, frase em Caveat com faixa colorida, cards que crescem no hover (Como funciona, Boxes, Unboxing, Temas futuros, Momentos, FAQ), tema do mês com papel que rasga (hover/toque/teclado), entrada suave ao rolar. Respeita prefers-reduced-motion.
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
