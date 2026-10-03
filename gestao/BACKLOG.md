# Quadro ágil (To do / Doing / Done)

Este arquivo é o espelho do quadro do GitHub Projects. Regra: no máximo **3 itens em Doing**. Cada item tem critério de aceite e segue a Definição de pronto de `BOAS-PRATICAS.md`.
Prioridade: P0 (bloqueia venda ou segurança), P1 (importante), P2 (desejável).

## Done
- [x] Site institucional, assinatura, login e área do cliente (Supabase Auth)
- [x] Painel dos donos com dados reais, cargos (cliente/admin/dono) e log de cargos
- [x] Passaporte digital anti-falsificação
- [x] Segurança base: CSP, anti-clickjacking, RLS em todas as tabelas, escape de dados (XSS), hook anti-segredos
- [x] Temas do mês com arte própria, temas futuros e biblioteca de arquivos
- [x] Assistente ChatGPT no painel (código pronto, falta a chave)

## Doing
- [ ] (P0) Diagnosticar painel dos donos vazio no site publicado. Aceite: dono vê clientes e temas após login.

## To do

### Sprint 1: Fundação (qualidade e segurança)
- [ ] (P0) Ativar proteção do repositório: `main` só por Pull Request, Dependabot, alerta de segredos. Aceite: push direto na `main` bloqueado.
- [ ] (P0) MFA em GitHub, Supabase e (futuro) Vercel. Aceite: 2FA ativo nas contas dos donos.
- [ ] (P0) Religar "Confirm email" e proteção contra senha vazada no Supabase.
- [ ] (P0) Configurar Site URL e Redirect URLs do Supabase.
- [ ] (P1) Criar `RISCOS.md` e `DECISOES.md`.
- [ ] (P1) Pipeline CI (GitHub Actions): checagem de sintaxe, varredura de segredos e de dependências.
- [ ] (P1) Modelagem de ameaças curta (pagamento, conta, admin).

### Sprint 2: Catálogo e carrinho
- [ ] (P0) Modelo de dados de produtos, estoque e preços (migração versionada + RLS).
- [ ] (P0) Vitrine com busca e filtros. Aceite: Lighthouse acima de 90, acessível por teclado.
- [ ] (P0) Carrinho (persistente por conta) com cálculo de total no servidor.
- [ ] (P1) Painel dos donos: cadastro de produto com imagem e estoque.

### Sprint 3: Checkout e pagamento
- [ ] (P0) Escolher gateway e criar conta de teste (decisão do dono).
- [ ] (P0) Checkout com Pix e cartão em página hospedada; webhook com assinatura verificada.
- [ ] (P0) Pedido só vira "pago" via webhook confirmado. Aceite: teste de webhook falso rejeitado.
- [ ] (P1) Endereço de entrega e cálculo de frete (regra a definir).
- [ ] (P1) Migrar front-end para a Vercel (previews por PR, rollback).

### Sprint 4: Pós-venda e LGPD
- [ ] (P0) E-mails transacionais (Brevo): pedido recebido, pago, enviado.
- [ ] (P0) Política de privacidade, termos de uso, troca e devolução (revisão de advogado).
- [ ] (P1) Pedidos do cliente na área dele e status de envio.
- [ ] (P1) Pedido de exclusão de dados pelo titular.
- [ ] (P1) Log de ações administrativas e alertas de erro.

### Sprint 5: Crescimento
- [ ] (P1) HubSpot: sincronizar contatos e funil.
- [ ] (P1) Recuperação de carrinho abandonado.
- [ ] (P2) Cupons e promoções.
- [ ] (P2) Domínio próprio e e-mail do domínio.
- [ ] (P2) Painel de métricas (vendas, ticket médio, conversão).

## Pendências do dono (não dependem de código)
- Cadastrar `OPENAI_API_KEY` no Supabase (assistente do painel).
- Marcar um tema "do mês" no painel e revisar o "Natal Encantado" duplicado.
- Reenviar a imagem do segundo estilo de arte.
