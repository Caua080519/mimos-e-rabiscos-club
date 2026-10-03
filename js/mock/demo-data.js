/* ============================================================
   DADOS DE DEMONSTRAÇÃO (FICTÍCIOS)
   Nada aqui é cliente, pagamento ou pedido real. Serve só para
   o protótipo da Área do cliente e do Painel dos donos.
   Quando existir banco de dados, este arquivo deixa de ser usado
   (veja js/services/api.js e docs/arquitetura.md).
   Data de referência do protótipo: 03/10/2026.
   ============================================================ */
const DEMO_TODAY = "2026-10-03";

const DEMO_CUSTOMERS = [
  { id: "c1", name: "Cliente Exemplo A", email: "exemplo.a@teste.invalid", phone: "(00) 00000-0001",
    plan: "encantobox", status: "ativo", since: "2026-01-08", delivered: 9,
    address: { line: "Rua Exemplo, 100", city: "Cidade Exemplo - UF", cep: "00000-000" },
    pay: { method: "Cartão", status: "pago", lastPaidAt: "2026-09-08" }, passportCode: "MR-DEMO-0001",
    next: { n: 10, status: "Em preparação", shipDate: "2026-10-08", tracking: "" } },
  { id: "c2", name: "Cliente Exemplo B", email: "exemplo.b@teste.invalid", phone: "(00) 00000-0002",
    plan: "mimobox", status: "ativo", since: "2026-06-02", delivered: 4,
    address: { line: "Av. Exemplo, 250", city: "Cidade Exemplo - UF", cep: "00000-000" },
    pay: { method: "Pix", status: "pago", lastPaidAt: "2026-10-02" }, passportCode: "MR-DEMO-0002",
    next: { n: 5, status: "A preparar", shipDate: "2026-10-08", tracking: "" } },
  { id: "c3", name: "Cliente Exemplo C", email: "exemplo.c@teste.invalid", phone: "(00) 00000-0003",
    plan: "dream-box", status: "ativo", since: "2026-03-15", delivered: 7,
    address: { line: "Travessa Exemplo, 33", city: "Outra Cidade - UF", cep: "00000-000" },
    pay: { method: "Cartão", status: "pago", lastPaidAt: "2026-09-15" }, passportCode: "MR-DEMO-0003",
    next: { n: 8, status: "Pronta para envio", shipDate: "2026-10-06", tracking: "" } },
  { id: "c4", name: "Cliente Exemplo D", email: "exemplo.d@teste.invalid", phone: "(00) 00000-0004",
    plan: "encantobox", status: "ativo", since: "2025-11-20", delivered: 11,
    address: { line: "Rua Exemplo, 7", city: "Cidade Exemplo - UF", cep: "00000-000" },
    pay: { method: "Boleto", status: "pago", lastPaidAt: "2026-09-20" }, passportCode: "MR-DEMO-0004",
    next: { n: 12, status: "A preparar", shipDate: "2026-10-08", tracking: "" } },
  { id: "c5", name: "Cliente Exemplo E", email: "exemplo.e@teste.invalid", phone: "(00) 00000-0005",
    plan: "mimobox", status: "ativo", since: "2026-08-01", delivered: 2,
    address: { line: "Rua Exemplo, 88", city: "Cidade Exemplo - UF", cep: "00000-000" },
    pay: { method: "Pix", status: "pago", lastPaidAt: "2026-10-01" }, passportCode: "MR-DEMO-0005",
    next: { n: 3, status: "Enviado", shipDate: "2026-10-01", tracking: "AB123456789BR" } },
  { id: "c6", name: "Cliente Exemplo F", email: "exemplo.f@teste.invalid", phone: "(00) 00000-0006",
    plan: "mimobox", status: "cancelado", since: "2026-02-10", cancelledAt: "2026-07-05", delivered: 5,
    address: { line: "Rua Exemplo, 12", city: "Cidade Exemplo - UF", cep: "00000-000" },
    pay: { method: "Cartão", status: "pago", lastPaidAt: "2026-06-10" }, passportCode: "MR-DEMO-0006", next: null },
  { id: "c7", name: "Cliente Exemplo G", email: "exemplo.g@teste.invalid", phone: "(00) 00000-0007",
    plan: "encantobox", status: "inadimplente", since: "2026-04-18", delivered: 5,
    address: { line: "Rua Exemplo, 64", city: "Cidade Exemplo - UF", cep: "00000-000" },
    pay: { method: "Boleto", status: "atrasado", lastPaidAt: "2026-08-18" }, passportCode: "MR-DEMO-0007",
    next: { n: 6, status: "Em preparação", shipDate: "2026-09-28", tracking: "" } },
  { id: "c8", name: "Cliente Exemplo H", email: "exemplo.h@teste.invalid", phone: "(00) 00000-0008",
    plan: "mimobox", status: "ativo", since: "2026-09-20", delivered: 0,
    address: { line: "Rua Exemplo, 5", city: "Cidade Exemplo - UF", cep: "00000-000" },
    pay: { method: "Pix", status: "pago", lastPaidAt: "2026-09-20" }, passportCode: "MR-DEMO-0008",
    next: { n: 1, status: "A preparar", shipDate: "2026-10-08", tracking: "" } },
  { id: "c9", name: "Cliente Exemplo I", email: "exemplo.i@teste.invalid", phone: "(00) 00000-0009",
    plan: "dream-box", status: "aguardando pagamento", since: "", delivered: 0,
    address: { line: "Rua Exemplo, 21", city: "Cidade Exemplo - UF", cep: "00000-000" },
    pay: { method: "Pix", status: "pendente", lastPaidAt: "" }, passportCode: "", next: null },
];
