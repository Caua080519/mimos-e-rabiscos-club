# Arquitetura: do protótipo ao site funcional

Hoje o site é **estático** (GitHub Pages). A home, a página de assinatura, a Área do cliente (`conta.html`) e o Painel dos donos (`admin.html`) existem, mas **as duas últimas são protótipos**: usam dados **fictícios** (`js/mock/demo-data.js`) e guardam alterações só no navegador. Nada aqui cobra, cancela ou grava de verdade.

## Como as telas estão ligadas
Todas as telas de dados falam com **`API`** (`js/services/api.js`), nunca direto com os dados.
Para ficar funcional, troca-se a implementação de cada grupo por chamadas a um servidor, sem reescrever as telas.

| Grupo da `API` | Hoje (protótipo) | No site real |
|---|---|---|
| `auth` | sem senha: só uma sessão de DEMONSTRAÇÃO no navegador (`entrar.html` → `conta.html`) | login real de clientes e de donos, com senha verificada no servidor |
| `customers` | dados fictícios | tabela de clientes no banco |
| `subscriptions` | devolve "protótipo" | alterar plano, endereço e cancelar no servidor |
| `payments` | devolve "protótipo" | gateway (Mercado Pago, Stripe ou Asaas) |
| `shipping` | devolve "protótipo" | cotação e rastreio (Correios, Melhor Envio etc.) |
| `themes` | `localStorage` | tabela de temas; a home lê o tema marcado como "do mês" |
| `passports` | verificação sobre dados fictícios | verificação no servidor (ver abaixo) |

## Regras de segurança (valem sempre)
1. **Nada secreto no site.** Senhas, chaves de API, tokens e segredos de webhook ficam **só no servidor** (variáveis de ambiente). O repositório é público.
2. **Esconder a URL não protege.** O `/admin.html` precisa de login real e de regras no servidor. A checagem de "é dono?" nunca pode depender só do navegador.
3. **Cada cliente só vê os próprios dados** (regra no banco, por linha). Donos veem tudo, depois de login.
4. **Pagamento é confirmado pelo servidor**, via webhook assinado do gateway, nunca por um botão no navegador.
5. **LGPD:** pedir só o necessário, guardar com acesso restrito e permitir apagar a conta.

## Modelo de dados sugerido
- `customers`: id, nome, e-mail, telefone, criado em, status.
- `addresses`: cliente, endereço, CEP, cidade, UF.
- `subscriptions`: cliente, plano, status (`aguardando_pagamento`, `ativa`, `em_atraso`, `cancelada`), início, cancelada em, ciclo.
- `payments`: assinatura, valor, método (`pix`, `cartao`, `boleto`), status, id no gateway, pago em.
- `boxes`: assinatura, número da caixa, mês, tema, status (`a_preparar`, `em_preparacao`, `pronta`, `enviada`, `entregue`), data prevista, rastreio.
- `themes`: nome, descrição, produtos, imagem, data de envio, "tema do mês" (apenas um).
- `passports`: cliente, código (único), criado em.
- `stamps`: passaporte, número (1 a 12), caixa, data, **quem carimbou**. Só se cria, nunca se edita.
- `admins`: usuários dos donos e função.

## Passaporte digital (contra falsificação)
Objetivo: provar que um passaporte físico é verdadeiro e saber quem é cliente de verdade.
- O **registro oficial** de selos fica no servidor (`stamps`). Um selo só nasce quando um dono marca a caixa como entregue.
- O **código do passaporte** impresso no físico deve ser **longo e impossível de adivinhar** (gerado no servidor, aleatório ou assinado), para ninguém inventar um código válido. Os códigos `MR-DEMO-000X` são só de demonstração.
- **Verificação:** o dono digita (ou lê por QR) o código e informa quantos selos o físico mostra. Se o físico tem **mais** selos que o registro, é divergência (possível falsificação). Se tem menos, o cliente pode ter perdido ou rasurado.
- Uma **página pública de verificação** (opcional) deve responder só "válido" ou "inválido", **sem mostrar dados pessoais**, e limitar tentativas por IP.
- O presente do 12º selo só é liberado se o registro digital confirmar os 12.
- **Cliente de verdade** = tem pagamento confirmado pelo gateway. **Frequência** (caixas recebidas, regularidade, último selo) vem de `stamps` e `boxes`.

## Fluxo de assinatura (alvo)
1. Visitante escolhe a Box e cria conta.
2. O servidor cria a assinatura como `aguardando_pagamento` e uma cobrança no gateway.
3. Cliente paga (Pix/cartão). O gateway chama o **webhook**; o servidor confirma, ativa a assinatura e cria o passaporte e a 1ª caixa.
4. Todo mês o gateway cobra (recorrência) e o servidor cria a próxima `box`.
5. Donos preparam, enviam (rastreio) e marcam entregue, o que gera o selo.
6. Cancelar e trocar de plano mudam a assinatura no servidor e no gateway.

## Possíveis caminhos de implementação
- **Mais simples:** um serviço de banco + login pronto (por exemplo Supabase ou Firebase) e funções no servidor para webhooks. O site continua estático.
- **Gateway:** Mercado Pago, Stripe ou Asaas têm assinatura recorrente e webhooks. A escolha depende de taxas, Pix e cartão.
- **Frete:** integração com Correios ou Melhor Envio para cotar e rastrear.

## O que ainda é protótipo
- `conta.html` inteiro (sem login, dados fictícios, botões sem efeito).
- `admin.html`: Resumo, Clientes, Temas e Passaportes (dados fictícios); Envios (localStorage).
- O tema salvo no painel **não** altera a home.
- A página de assinatura leva ao pagamento só quando houver link em `SITE.payment.links`; hoje fica desativada.

## Login dos clientes (entrar.html)
- **Hoje:** entrar.html tem os formulários de Entrar, Criar conta e Esqueci a senha, mas em SITE.auth.mode = "prototype" eles apenas avisam que o login real não está ativo (a senha digitada é apagada e nunca é guardada). A área conta.html só abre com a sessão de demonstração e redireciona para entrar.html sem ela.
- **Para ligar o login real:** (1) escolher o provedor (ex.: Supabase Auth ou Firebase Auth); (2) implementar API.auth.signIn/signUp/resetPassword/currentUser/signOut com ele (a chave pública do provedor pode ficar no site; a chave secreta nunca); (3) criar no banco a regra "cada cliente só lê as próprias linhas"; (4) trocar SITE.auth.mode para "live", o que esconde a conta de demonstração.
- A tela e a área do cliente não precisam ser reescritas: só a implementação de API.
## Supabase: o que já está ligado (2026-10-03)
- Projeto **mimos-e-rabiscos-club** (região São Paulo, plano gratuito). O site usa a chave **publishable** (pública por design). A chave secreta (service_role / sb_secret_...) **nunca** vai para o site nem para o GitHub.
- **Login real** de clientes pelo Supabase Auth (SITE.auth.mode = "live"): criar conta (com e-mail de confirmação), entrar, sair e recuperar a senha. Biblioteca supabase-js fixada na versão 2.117.2, com verificação de integridade (SRI).
- **Banco** com RLS em todas as tabelas (script em supabase/001_init_schema.sql): cada cliente só lê os próprios dados; só donos escrevem assinaturas, caixas, selos e passaportes; o cliente nunca consegue se promover a dono. Visitantes sem login não leem nada pessoal (testado: leitura e escrita anônimas negadas).
- **Ainda é protótipo:** o painel dos donos (dmin.html) continua com dados fictícios e sem login. Pagamento, troca de plano, cancelamento e edição de endereço não estão ligados.
- Para tornar alguém dono: no Supabase, atualizar profiles.role para dmin (feito pelo SQL do projeto, nunca pelo site).