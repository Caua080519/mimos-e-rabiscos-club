# Boas práticas do projeto

Este documento é o "contrato de qualidade" do e-commerce. Tudo aqui vira critério de aceite nas tarefas (veja `BACKLOG.md`).
Referências usadas como guia, não como certificação: **CMMI** (maturidade de processo), **Microsoft Cloud Adoption Framework (CAF)** (governança e operação em nuvem) e **OWASP Top 10** (segurança de aplicação).

## 1. Processo (CMMI, níveis 2 e 3 como meta)
| Prática | Como fazemos aqui |
|---|---|
| Gestão de requisitos | Todo pedido vira um item no backlog com critério de aceite. Nada é feito "de cabeça". |
| Planejamento do projeto | Sprints curtas (1 a 2 semanas) e meta clara por sprint. |
| Monitoramento e controle | Quadro To do / Doing / Done; limite de 3 itens em Doing. |
| Gestão de configuração | Git; `main` protegida; mudanças por Pull Request; commits pequenos e descritivos. |
| Garantia de qualidade | Checklist de PR (`.github/pull_request_template.md`), revisão antes de ir ao ar. |
| Gestão de riscos | Registro em `RISCOS.md`, revisado a cada sprint. |
| Medição | Medir: tempo de entrega, defeitos por sprint, cobertura de testes, vulnerabilidades abertas. |
| Definição de pronto (DoD) | Ver seção 5. |

## 2. Segurança (OWASP Top 10, 2021)
| Risco | Controle exigido |
|---|---|
| A01 Controle de acesso quebrado | Regras no banco (RLS no Supabase/Postgres), nunca só na tela; teste de acesso negado para cada papel. |
| A02 Falhas criptográficas | HTTPS sempre; senhas só no provedor de autenticação; nada sensível em log nem em URL. |
| A03 Injeção (inclui XSS) | Consultas parametrizadas; escapar todo dado de usuário na tela; CSP restritiva. |
| A04 Design inseguro | Modelagem de ameaças curta antes de cada funcionalidade de pagamento, conta ou admin. |
| A05 Configuração incorreta | Cabeçalhos de segurança, sem painéis abertos, ambientes separados (dev/homologação/produção). |
| A06 Componentes vulneráveis | Dependências fixadas, Dependabot ligado, SRI em scripts de CDN. |
| A07 Falhas de autenticação | MFA para donos/administração, proteção contra senha vazada, limite de tentativas. |
| A08 Integridade de software/dados | Revisão de PR, verificação de assinatura de webhooks (pagamento), sem scripts não revisados. |
| A09 Falhas de log e monitoramento | Log de ações administrativas, alertas de erro e de falha de pagamento. |
| A10 SSRF | Servidor nunca busca URL informada pelo usuário sem lista de permitidos. |

Regras fixas: **segredos nunca no repositório** (hook anti-segredos + `.gitignore`); chaves secretas só em variáveis de ambiente do provedor; **dados de cartão nunca passam por nós** (usar gateway com página/campos hospedados). LGPD: coletar só o necessário, política de privacidade, canal para o titular pedir exclusão.

## 3. Nuvem (CAF, versão enxuta)
- **Estratégia e plano:** começar enxuto, custo mensal conhecido, revisar a cada sprint.
- **Governança:** um dono para cada serviço; contas com MFA; acesso mínimo necessário.
- **Segurança:** ver seção 2; backups e teste de restauração do banco.
- **Operação:** ambientes separados, deploy repetível pelo Git, plano de reversão (rollback) em cada deploy.
- **Custos:** alerta de gasto em cada serviço pago.

## 4. Engenharia
- Código simples e legível; uma responsabilidade por arquivo/função.
- Testes: unitários para regra de negócio (preço, frete, estoque), testes de ponta a ponta para o fluxo de compra.
- Acessibilidade (WCAG AA) e desempenho (Lighthouse acima de 90) medidos em cada release.
- Mudanças de banco sempre por migração versionada.
- Documentar decisões importantes em `DECISOES.md` (o quê, por quê, alternativas).

## 5. Definição de pronto (Done)
Um item só vai para **Done** quando:
1. Critérios de aceite cumpridos e demonstrados.
2. Revisado por Pull Request e sem alerta de segurança aberto.
3. Testes passando; sem segredo no código.
4. Documentação/decisão atualizada, se mudou algo relevante.
5. Publicado em homologação e validado.

## 6. Uso de modelos de IA (Claude Code)
- **Padrão: Sonnet** para quase tudo (implementar, ajustar, documentar, revisar).
- **Opus** só quando necessário: arquitetura, segurança crítica, bugs difíceis que o Sonnet não resolveu.
- **Fable** só em decisões de alto impacto ou revisões finais muito complexas.
- Regra de bolso: começar no Sonnet; subir de modelo apenas depois de uma tentativa que falhou ou quando o risco justificar o custo.
