# Lembretes por e-mail: como ligar

O site já tem o formulário pronto (na página `assinar.html`). Ele fica **escondido** até você colar o endereço do formulário do serviço de e-mail em `js/data.js` (`SITE.leads.endpoint`).

## 1. Escolha o serviço (conta gratuita)
Qualquer um funciona. Sugestões: **MailerLite** ou **Brevo**. Confira, no plano gratuito de cada um, o limite de contatos e se a automação de e-mails está incluída antes de decidir.

## 2. Crie o formulário no serviço
1. Crie uma lista/grupo, por exemplo "Quer assinar".
2. Crie um **formulário incorporado** (embed) para essa lista, só com nome e e-mail.
3. No código HTML que o serviço gera, copie:
   - o endereço do `action="..."` do formulário;
   - o nome dos campos (`name="..."`) de e-mail e de nome;
   - qualquer campo escondido (`type="hidden"`) que o serviço exija.

## 3. Cole em `js/data.js`
```js
leads: {
  endpoint: "COLE_AQUI_O_ACTION",
  fields: { email: "NOME_DO_CAMPO_EMAIL", name: "NOME_DO_CAMPO_NOME" },
  extra: { /* campos escondidos exigidos, se houver */ },
},
```
Exemplos de nomes de campo: Brevo costuma usar `EMAIL` e `FIRSTNAME`; MailerLite costuma usar `fields[email]` e `fields[name]`.

## 4. Monte a automação (os lembretes)
No serviço, crie uma automação que começa quando alguém entra na lista e envia os 3 e-mails abaixo (por exemplo, no mesmo dia, depois de 2 dias e depois de 5 dias). Quem **assinar** deve sair da lista de lembretes (tire a pessoa da lista manualmente quando confirmar o pagamento, ou pare a automação para ela).

O link de **descadastro** é adicionado pelo próprio serviço no rodapé. Não retire.
Troque `[nome]` pela variável de nome do serviço e `[link]` pelo endereço do site: `https://caua080519.github.io/mimos-e-rabiscos-club/assinar.html`

---

### E-mail 1 (assim que entrar na lista)
**Assunto:** Que bom ter você por aqui

Oi, [nome]!

Obrigada por querer conhecer o Mimos e Rabiscos Club. Todo mês, uma caixa de papelaria com tema, produtos escolhidos com carinho e surpresas chega até você.

Quando quiser, é só escolher sua Box. Sem pressa.

[Escolher minha Box]([link])

Com carinho,
Mimos e Rabiscos

---

### E-mail 2 (2 dias depois)
**Assunto:** O que tem dentro da caixa?

Oi, [nome]!

Passando para contar um pouquinho do que torna o clube especial: cada mês tem um tema novo, e a caixa é pensada como um presente que chega para você. Tem ainda o Passaporte dos Mimos: a cada caixa recebida, um selo novo.

São três Boxes, para você escolher a que combina mais com o seu momento.

[Ver as Boxes]([link])

Com carinho,
Mimos e Rabiscos

---

### E-mail 3 (5 dias depois)
**Assunto:** Sua caixa de mimos está te esperando

Oi, [nome]!

Este é o nosso último lembrete, prometemos. Se ainda estiver pensando, tudo bem: o clube continua aqui quando você quiser.

Se já decidiu, é só escolher sua Box.

[Quero minha Box]([link])

Um abraço,
Mimos e Rabiscos

---

> Os textos não citam descontos, prazos de frete nem condições, porque isso ainda está em definição. Só inclua esses detalhes depois de decididos.
