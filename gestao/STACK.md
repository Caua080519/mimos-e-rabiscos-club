# Stack recomendada

Princípio: **começar enxuto**, trocar peças só quando houver necessidade medida.

## Recomendação
| Camada | Escolha | Papel | Observação |
|---|---|---|---|
| Código e orquestração | **GitHub** (repo, Projects, Actions, Dependabot) | Versão, quadro ágil, CI | Quadro To do / Doing / Done |
| Desenvolvimento assistido | **Claude Code** (Sonnet por padrão) | Implementar e revisar | Opus/Fable só quando necessário |
| Front-end | **Vercel** | Hospedagem, previews por PR, rollback rápido | Hoje o site é estático no GitHub Pages; migrar para a Vercel quando o checkout precisar de funções de servidor |
| Banco, login, arquivos | **Supabase** (Postgres + Auth + Storage + RLS) | Já em uso no projeto | Mantém tudo no mesmo lugar, sem custo extra de integração |
| Banco alternativo | **Neon** (Postgres serverless) | Só se precisarmos de branches de banco por PR ou sair do Supabase | **Não usar os dois bancos ao mesmo tempo** no início: duplica custo e complexidade |
| CRM e marketing | **HubSpot** (plano gratuito) | Contatos, funil, campanhas | Integrar depois de ter clientes reais |
| E-mail transacional | **Brevo** (suposição: "Brivo" = Brevo, confirmar) | Confirmação de pedido, recuperação de carrinho | Se for outra ferramenta, avise |
| Pagamento | Gateway com checkout hospedado (ex.: Mercado Pago, Stripe) | Pix, cartão, boleto | Webhook assinado; nada de cartão em nosso servidor |

## Por que esta combinação
- **Supabase** já tem Auth, RLS e Storage funcionando; trocar custaria tempo sem ganho agora.
- **Vercel** entra quando houver backend de checkout (funções serverless), com previews por Pull Request (facilita revisão e CMMI de garantia de qualidade).
- **Neon** fica como plano B: bom para branches de banco, mas redundante com o Supabase hoje.
- **HubSpot** e **Brevo** são integrações de crescimento; entram depois do fluxo de compra estar seguro.

## Decisões em aberto (preciso de você)
1. Confirmar se "Brivo" é **Brevo** (e-mail).
2. Escolher o gateway de pagamento.
3. Confirmar se o e-commerce é esta mesma loja (Mimos e Rabiscos) ou um projeto separado.
