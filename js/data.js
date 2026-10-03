/* Todo o conteúdo editável do site fica aqui.
   Valor "em definição" = ainda não decidido; não inventar. */
const TBD = "em definição";

const SITE = {
  brand: {
    name: "Mimos e Rabiscos",
    club: "Mimos e Rabiscos Club",
    tagline: "Todo mês, um mimo novo para rabiscar.",
    positioning:
      "Uma caixa de papelaria que chega todo mês, com tema, carinho e surpresas. Um presente que você dá para si.",
    heroLead: "Assine e receba todo mês, na sua porta, uma caixa com produtos de papelaria escolhidos a dedo, um tema novo e surpresas.",
    domain: "mimoserabiscosclub.com.br",
  },

  nav: [
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Boxes", href: "#boxes" },
    { label: "Tema do mês", href: "#tema" },
    { label: "Passaporte", href: "#passaporte" },
    { label: "FAQ", href: "#faq" },
  ],

  steps: [
    { title: "Escolha sua Box", text: "Mimobox, Encantobox ou Dream Box: veja qual combina com você." },
    { title: "Escolha a duração", text: "Mês a mês ou por mais tempo (condições em definição)." },
    { title: "Receba em casa", text: "Todo mês chega uma caixa com tema, produtos de papelaria e surpresas." },
    { title: "Colecione selos", text: "Cada Box recebida ganha um selo no seu Passaporte dos Mimos." },
  ],

  /* Nomes e quantidades são uma estrutura inicial, ainda a validar (custos, margem, frete). */
  plans: [
    {
      id: "mimobox",
      name: "Mimobox",        items: "4 a 6 produtos",
      price: 39.9,
      badge: "",
      highlight: false,
      blurb: "Plano de entrada, ideal para experimentar o clube.",
      benefits: [
        "Produtos de papelaria do tema do mês",
        "Surpresas na caixa",
        "Selo no Passaporte dos Mimos",
      ],
      freeShipping: false,
    },
    {
      id: "encantobox",
      name: "Encantobox",        items: "8 a 10 produtos",
      price: 69.9,
      badge: "MAIS ESCOLHIDA",
      highlight: true,
      blurb: "Mais variedade e mais experiência.",
      benefits: [
        "Produtos de papelaria do tema do mês",
        "Surpresas na caixa",
        "Selo no Passaporte dos Mimos",
        "Benefícios extras: " + TBD,
      ],
      freeShipping: false,
    },
    {
      id: "dream-box",
      name: "Dream Box",        items: "12 a 15 produtos",
      price: 99.9,
      badge: "EXPERIÊNCIA PREMIUM",
      highlight: false,
      blurb: "Produtos e experiência de maior valor.",
      benefits: [
        "Produtos de papelaria do tema do mês",
        "Surpresas na caixa",
        "Selo no Passaporte dos Mimos",
        "Frete grátis*",
        "Benefícios extras: " + TBD,
      ],
      freeShipping: true,
    },
  ],

  itemsNote: "Quantidade de produtos é uma estimativa inicial, ainda em validação.",
  /* Pagamento: cole aqui o link de pagamento de cada Box (Mercado Pago, InfinitePay etc.).
     Vazio = o botão fica desativado e a página avisa que o pagamento ainda não está ativo. */
  payment: {
    links: {
      mimobox: "",
      encantobox: "",
      "dream-box": "",
    },
  },

  freeShippingNote: "*Frete grátis em avaliação. Condições em definição.",

  /* Linhas da tabela comparativa. Use true/false, texto ou TBD */
  comparison: [
    { label: "Preço por mês", values: ["price", "price", "price"] },
    { label: "Tema do mês", values: [true, true, true] },
    { label: "Surpresas na caixa", values: [true, true, true] },
    { label: "Selo no Passaporte dos Mimos", values: [true, true, true] },
    { label: "Produtos por caixa (estimativa)", values: ["items", "items", "items"] },
    { label: "Frete grátis*", values: [false, false, true] },
    { label: "Desconto assinatura de 6 meses", values: [TBD, TBD, TBD] },
    { label: "Desconto assinatura de 12 meses", values: [TBD, TBD, TBD] },
  ],

  currentTheme: {
    name: "Tema do mês",
    month: TBD,
    text: "Todo mês a caixa ganha um tema novo. O próximo será revelado em breve.",
  },

  unboxing: [
    { title: "Abrir", text: "O laço, o papel, a expectativa." },
    { title: "Descobrir", text: "Cada item do mês e a surpresa guardada no fundo." },
    { title: "Rabiscar", text: "Hora de usar, organizar e criar." },
  ],

  passport: {
    total: 12,
    demoStamped: 3, // só para ilustrar na home
    gift: "Presente exclusivo: " + TBD,
    text: "Na primeira compra você ganha o passaporte. A cada Box recebida, um selo. Ao completar os 12, um presente exclusivo.",
  },

  futureThemes: [
    { name: "Tema em breve", note: TBD },
    { name: "Tema em breve", note: TBD },
    { name: "Tema em breve", note: TBD },
    { name: "Tema em breve", note: TBD },
  ],

  moments: [
    { name: "Seu nome aqui", img: "assets/momento-1.svg", alt: "Exemplo: planner com adesivos", text: "Aqui vão aparecer os momentos Mimo das nossas assinantes." },
    { name: "Seu nome aqui", img: "assets/momento-2.svg", alt: "Exemplo: canetas e lápis coloridos", text: "Fotos, rabiscos e planners compartilhados com a comunidade." },
    { name: "Seu nome aqui", img: "assets/momento-3.svg", alt: "Exemplo: caderno com rabiscos", text: "Marque a gente para aparecer no mural." },
  ],

  faq: [
    {
      q: "Como funciona o clube?",
      a: "Você escolhe uma box de papelaria, assina e recebe todo mês uma caixa com produtos ligados ao tema do mês e algumas surpresas.",
    },
    {
      q: "Quais formas de pagamento?",
      a: "PIX, cartão e boleto.",
    },
    {
      q: "Qual o prazo e o valor do frete?",
      a: "Prazos e valores de frete: " + TBD + ".",
    },
    {
      q: "Posso cancelar quando quiser?",
      a: "A política de cancelamento está " + TBD + ".",
    },
    {
      q: "O que vem dentro da caixa?",
      a: "Produtos de papelaria alinhados ao tema do mês e algumas surpresas. Os itens de cada mês são revelados perto do envio.",
    },
    {
      q: "Como funciona o Passaporte dos Mimos?",
      a: "É um passaporte físico: cada Box recebida ganha um selo, são 12 espaços, e ao completar você desbloqueia um presente exclusivo.",
    },
  ],

  footer: {
    contact: "Contato: " + TBD,
    whatsappNumber: "", // só dígitos com DDI e DDD, ex.: 5511999999999. Vazio = botão não aparece
    social: [
      { label: "Instagram", href: "#" },
      { label: "WhatsApp", href: "#" },
    ],
  },
};



