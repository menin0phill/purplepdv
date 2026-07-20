// Banco de dados simulado em LocalStorage para o PDV Purple

const KEY_PRODUCTS = 'purple_pdv_products';
const KEY_SALES = 'purple_pdv_sales';
const KEY_CASH_SESSIONS = 'purple_pdv_cash_sessions';
const KEY_CLIENTS = 'purple_pdv_clients';
const KEY_CONFIG = 'purple_pdv_config';

// Clientes iniciais mockados (com senha, débito e aniversário)
const DEFAULT_CLIENTS = [
  {
    id: 'c1',
    name: 'Ana Silva',
    phone: '(11) 99999-1111',
    email: 'ana.silva@email.com',
    password: '123456',
    birthday: '1995-04-12',
    debt: 0.00,
    notes: 'Prefere bases de tom claro e batom matte.'
  },
  {
    id: 'c2',
    name: 'Mariana Costa',
    phone: '(11) 99999-2222',
    email: 'mariana.costa@email.com',
    password: '123456',
    birthday: '1992-07-22',
    debt: 34.90,
    notes: 'Cliente VIP. Compra sombras vibrantes.'
  },
  {
    id: 'c3',
    name: 'Bruna Oliveira',
    phone: '(11) 99999-3333',
    email: 'bruna.oliveira@email.com',
    password: '123456',
    birthday: '1998-11-05',
    debt: 0.00,
    notes: 'Ama cosméticos de skincare natural.'
  }
];

// Produtos iniciais de cosméticos e maquiagem (com descrição e variações)
const DEFAULT_PRODUCTS = [
  {
    id: 'p1',
    code: '7891000000011',
    name: 'Batom Líquido Matte Purple',
    category: 'Batons',
    costPrice: 12.00,
    price: 34.90,
    stock: 50,
    color: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&auto=format&fit=crop&q=60',
    description: 'Batom líquido de alta pigmentação com acabamento matte aveludado. Não resseca os lábios, possui fórmula confortável de longa duração (até 12 horas) e aplicador preciso para contorno impecável.',
    variations: []
  },
  {
    id: 'p2',
    code: '7891000000028',
    name: 'Base Líquida Velvet Skin 30ml',
    category: 'Rosto',
    costPrice: 25.00,
    price: 69.90,
    stock: 30, // Soma das variações (10+12+8)
    color: '#e5c2a3',
    image: 'https://images.unsplash.com/photo-1631730359575-38e4755d772b?w=300&auto=format&fit=crop&q=60',
    description: 'Base de alta cobertura com efeito matte e textura velvet. Uniformiza o tom da pele, reduz a aparência de poros e linhas de expressão, e resiste à água e ao suor com acabamento natural confortável.',
    variations: [
      { id: 'v1', name: 'Cor 01 (Nude Claro)', stock: 10, colorCode: '#f3d3b6', image: 'https://images.tcdn.com.br/img/img_prod/1216635/base_liquida_matte_fix_all_cor_5_a_8_de_30g_alleva_27914_variacao_18882_1_5d9bc80331a67dada5af9976398221f8.jpg' },
      { id: 'v2', name: 'Cor 02 (Bege Médio)', stock: 12, colorCode: '#e6b48a', image: 'https://images.tcdn.com.br/img/img_prod/1216635/base_liquida_matte_fix_all_cor_5_a_8_de_30g_alleva_27914_variacao_18888_1_9fbd603040b8f8728320feaeb14e59a6.jpg' },
      { id: 'v3', name: 'Cor 03 (Bronze Escuro)', stock: 8, colorCode: '#c68f59', image: 'https://images.unsplash.com/photo-1631730359575-38e4755d772b?w=300&auto=format&fit=crop&q=60' }
    ]
  },
  {
    id: 'p3',
    code: '7891000000035',
    name: 'Corretivo Hidratante Skin Silk',
    category: 'Rosto',
    costPrice: 15.00,
    price: 45.00,
    stock: 40, // Soma das variações (20+15+5)
    color: '#f0d3bc',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=60',
    description: 'Corretivo líquido hidratante enriquecido com ácido hialurônico. Camufla olheiras e imperfeições perfeitamente sem craquelar ou acumular nas linhas, garantindo um olhar luminoso e descansado por até 8 horas.',
    variations: [
      { id: 'v4', name: 'Tom Claro', stock: 20, colorCode: '#f5dcc6', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=60' },
      { id: 'v5', name: 'Tom Médio', stock: 15, colorCode: '#e8be99', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=60' },
      { id: 'v6', name: 'Tom Escuro', stock: 5, colorCode: '#ca9e79', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=60' }
    ]
  },
  {
    id: 'p4',
    code: '7891000000042',
    name: 'Máscara de Cílios Volume Extremo',
    category: 'Olhos',
    costPrice: 14.00,
    price: 39.90,
    stock: 60,
    color: '#1a1a1a',
    image: 'https://images.unsplash.com/photo-1631214500115-598fc2cb8d2d?w=300&auto=format&fit=crop&q=60',
    description: 'Máscara para cílios com fórmula super black. Define, alonga e confere volume extremo desde a primeira camada. Aplicador exclusivo de cerdas multidimensionais que agarra até os menores cílios.',
    variations: []
  },
  {
    id: 'p5',
    code: '7891000000059',
    name: 'Paleta de Sombras Purple Dream',
    category: 'Olhos',
    costPrice: 30.00,
    price: 89.90,
    stock: 20,
    color: '#4c1d95',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&auto=format&fit=crop&q=60',
    description: 'Paleta de sombras de alta pigmentação com 12 cores de acabamentos matte aveludados e cintilantes metalizados. Cores fáceis de esfumar em tons quentes, rosados e roxos para maquiagens casuais e dramáticas.',
    variations: []
  },
  {
    id: 'p6',
    code: '7891000000066',
    name: 'Iluminador Compacto Glow Aura',
    category: 'Rosto',
    costPrice: 18.00,
    price: 49.90,
    stock: 25,
    color: '#fef08a',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&auto=format&fit=crop&q=60',
    description: 'Iluminador em pó compacto com micropartículas de brilho que refletem a luz perfeitamente. Textura ultra fina que se funde à pele, conferindo um glow natural com intensidade regulável.',
    variations: []
  },
  {
    id: 'p7',
    code: '7891000000073',
    name: 'Sérum Facial Ácido Hialurônico 30ml',
    category: 'Skincare',
    costPrice: 28.00,
    price: 79.90,
    stock: 15,
    color: '#67e8f9',
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300&auto=format&fit=crop&q=60',
    description: 'Sérum facial de hidratação profunda. Combina ácido hialurônico puro de baixo e alto peso molecular para preencher rugas finas, melhorar a firmeza da pele e reter a hidratação natural por até 24 horas.',
    variations: []
  },
  {
    id: 'p8',
    code: '7891000000080',
    name: 'Blush Cremoso Radiant Rose',
    category: 'Rosto',
    costPrice: 15.00,
    price: 42.00,
    stock: 35,
    color: '#f43f5e',
    image: 'https://images.unsplash.com/photo-1631730359575-38e4755d772b?w=300&auto=format&fit=crop&q=60',
    description: 'Blush com textura cremosa de acabamento natural "soft glow". Fácil de aplicar e esfumar, se mistura perfeitamente com a pele ou base de maquiagem para um aspecto saudável de viço rosado de longa duração.',
    variations: []
  },
  {
    id: 'p9',
    code: '7891000000097',
    name: 'Delineador Líquido Carbon Black',
    category: 'Olhos',
    costPrice: 10.00,
    price: 29.90,
    stock: 45,
    color: '#000000',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=60',
    description: 'Delineador líquido preto ultra intenso de acabamento vinílico. Fórmula à prova d\'água de secagem rápida com pincel de ponta fina flexível ideal para traços finos ou delineados gatinho marcantes.',
    variations: []
  },
  {
    id: 'p10',
    code: '7891000000103',
    name: 'Kit de Pincéis Profissionais Purple (12un)',
    category: 'Acessórios',
    costPrice: 45.00,
    price: 119.90,
    stock: 12,
    color: '#a78bfa',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=60',
    description: 'Kit contendo 12 pincéis profissionais de maquiagem com cerdas sintéticas premium ultra macias. Acompanha pincéis de pó, blush, base, sombras e esfumadores ideais para uma maquiagem completa e profissional.',
    variations: []
  }
];

// Inicialização segura
function initDB() {
  // Limpar histórico de vendas e sessões de caixa apenas uma vez para preparar o deploy limpo
  if (!localStorage.getItem('purple_pdv_db_reset_v9')) {
    localStorage.setItem(KEY_SALES, JSON.stringify([]));
    localStorage.setItem(KEY_CASH_SESSIONS, JSON.stringify([]));
    localStorage.setItem('purple_pdv_db_reset_v9', 'true');
  }

  // MIGRAR IDs DUPLICADOS (causados por importações em massa na mesma milissegundo)
  const rawProds = localStorage.getItem(KEY_PRODUCTS);
  if (rawProds) {
    try {
      let prods = JSON.parse(rawProds);
      let idsSeen = new Set();
      let modified = false;
      
      prods = prods.map((p, idx) => {
        // Se o ID for duplicado, vazio ou nulo, gera um único
        if (!p.id || idsSeen.has(p.id)) {
          p.id = 'p_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5);
          modified = true;
        }
        idsSeen.add(p.id);
        
        // Também garantir variações com IDs únicos
        if (p.variations && p.variations.length > 0) {
          let varIdsSeen = new Set();
          p.variations = p.variations.map((v, vidx) => {
            if (!v.id || varIdsSeen.has(v.id)) {
              v.id = 'v_' + Date.now() + '_' + vidx + '_' + Math.random().toString(36).substr(2, 5);
              modified = true;
            }
            varIdsSeen.add(v.id);
            return v;
          });
        }
        return p;
      });
      
      if (modified) {
        localStorage.setItem(KEY_PRODUCTS, JSON.stringify(prods));
        console.log("Database Migration: Fixed duplicate product IDs!");
      }
    } catch(e) {
      console.error("Migration error:", e);
    }
  }

  const currentProds = localStorage.getItem(KEY_PRODUCTS);
  let needsReset = false;
  if (currentProds) {
    try {
      const parsed = JSON.parse(currentProds);
      const baseProd = parsed.find(p => p.id === 'p2');
      if (baseProd && baseProd.variations && baseProd.variations[0] && !baseProd.variations[0].colorCode) {
        needsReset = true;
      }
    } catch(e) {
      needsReset = true;
    }
  } else {
    needsReset = true;
  }

  if (needsReset) {
    localStorage.setItem(KEY_PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem(KEY_SALES)) {
    localStorage.setItem(KEY_SALES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEY_CASH_SESSIONS)) {
    localStorage.setItem(KEY_CASH_SESSIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEY_CLIENTS)) {
    localStorage.setItem(KEY_CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
  }
  if (!localStorage.getItem(KEY_CONFIG)) {
    localStorage.setItem(KEY_CONFIG, JSON.stringify({ requireClientCheckout: true }));
  }
}

// Executa initDB ao importar
initDB();

// --- CONFIGURAÇÕES ---
export function getConfig() {
  return JSON.parse(localStorage.getItem(KEY_CONFIG)) || { requireClientCheckout: true };
}

export function saveConfig(config) {
  localStorage.setItem(KEY_CONFIG, JSON.stringify(config));
}

// --- PRODUTOS ---
export function getProducts() {
  const prods = JSON.parse(localStorage.getItem(KEY_PRODUCTS)) || [];
  return prods.map(p => {
    const variations = (p.variations || []).map(v => ({
      ...v,
      stock: Number(v.stock) || 0
    }));
    
    // Se o produto tiver variações cadastradas, o estoque global é a soma delas
    const stock = variations.length > 0
      ? variations.reduce((sum, v) => sum + v.stock, 0)
      : Number(p.stock) || 0;

    return {
      ...p,
      costPrice: Number(p.costPrice) || 0,
      price: Number(p.price) || 0,
      stock: stock,
      variations: variations
    };
  });
}

export function saveProducts(products) {
  localStorage.setItem(KEY_PRODUCTS, JSON.stringify(products));
}

export function addProduct(product) {
  const products = getProducts();
  const newProduct = {
    ...product,
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    costPrice: parseFloat(product.costPrice) || 0,
    price: parseFloat(product.price) || 0,
    stock: parseInt(product.stock) || 0,
    description: product.description || '',
    variations: (product.variations || []).map((v, idx) => ({
      ...v,
      id: v.id || ('v_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5))
    }))
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id, updatedData) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = {
      ...products[index],
      ...updatedData,
      costPrice: parseFloat(updatedData.costPrice) || 0,
      price: parseFloat(updatedData.price) || 0,
      stock: parseInt(updatedData.stock) || 0,
      description: updatedData.description || '',
      variations: updatedData.variations || []
    };
    saveProducts(products);
    return products[index];
  }
  return null;
}

export function deleteProduct(id) {
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
}

// --- VENDAS ---
export function getSales() {
  const sales = JSON.parse(localStorage.getItem(KEY_SALES)) || [];
  return sales.map(s => ({
    ...s,
    subtotal: Number(s.subtotal) || 0,
    discount: Number(s.discount) || 0,
    total: Number(s.total) || 0,
    amountPaid: Number(s.amountPaid) || 0,
    shippingFee: Number(s.shippingFee) || 0,
    items: (s.items || []).map(i => ({
      ...i,
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 0
    }))
  }));
}

export function saveSales(sales) {
  localStorage.setItem(KEY_SALES, JSON.stringify(sales));
}

export function addSale(sale) {
  const sales = getSales();
  const products = getProducts();
  
  // Deduz estoque (geral ou de variações)
  sale.items.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) {
      if (item.variationId && product.variations && product.variations.length > 0) {
        const variation = product.variations.find(v => v.id === item.variationId);
        if (variation) {
          variation.stock = Math.max(0, variation.stock - item.quantity);
        }
        // Atualiza a soma do estoque global
        product.stock = product.variations.reduce((sum, v) => sum + v.stock, 0);
      } else {
        product.stock = Math.max(0, product.stock - item.quantity);
      }
    }
  });
  saveProducts(products);

  // Se a venda foi no fiado, incrementa o débito do cliente
  if (sale.clientId && sale.paymentMethod === 'fiado') {
    const clients = getClients();
    const client = clients.find(c => c.id === sale.clientId);
    if (client) {
      client.debt = (client.debt || 0) + sale.total;
      saveClients(clients);
    }
  }

  const newSale = {
    ...sale,
    origin: sale.origin || 'pos',
    status: sale.status || (sale.origin === 'e-commerce' ? 'Preparando' : 'Finalizada'),
    id: 's_' + Date.now(),
    timestamp: new Date().toISOString()
  };
  sales.push(newSale);
  saveSales(sales);
  return newSale;
}

export function updateSaleStatus(saleId, newStatus) {
  const sales = getSales();
  const index = sales.findIndex(s => s.id === saleId);
  if (index !== -1) {
    sales[index].status = newStatus;
    saveSales(sales);
    return sales[index];
  }
  return null;
}

// --- CLIENTES ---
export function getClients() {
  const clients = JSON.parse(localStorage.getItem(KEY_CLIENTS)) || [];
  return clients.map(c => ({
    ...c,
    debt: Number(c.debt) || 0
  }));
}

export function saveClients(clients) {
  localStorage.setItem(KEY_CLIENTS, JSON.stringify(clients));
}

export function addClient(client) {
  const clients = getClients();
  const newClient = {
    ...client,
    id: 'c_' + Date.now(),
    debt: parseFloat(client.debt) || 0,
    birthday: client.birthday || ''
  };
  clients.push(newClient);
  saveClients(clients);
  return newClient;
}

export function updateClient(id, updatedData) {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === id);
  if (index !== -1) {
    clients[index] = {
      ...clients[index],
      ...updatedData,
      debt: parseFloat(updatedData.debt) || 0,
      birthday: updatedData.birthday || ''
    };
    saveClients(clients);
    return clients[index];
  }
  return null;
}

export function deleteClient(id) {
  let clients = getClients();
  clients = clients.filter(c => c.id !== id);
  saveClients(clients);
}

export function payClientDebt(clientId, amount, paymentMethod) {
  const clients = getClients();
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    throw new Error('Cliente não encontrado!');
  }

  const payAmount = parseFloat(amount);
  if (payAmount <= 0) {
    throw new Error('Valor de pagamento inválido!');
  }

  client.debt = Math.max(0, client.debt - payAmount);
  saveClients(clients);

  // Registrar a entrada no caixa
  addCashTransaction('suprimento', payAmount, `Recebimento Débito (Fiado) - ${client.name} via ${translatePaymentMethod(paymentMethod)}`);
  
  return client;
}

function translatePaymentMethod(method) {
  const methods = {
    'money': 'Dinheiro',
    'pix': 'Pix',
    'credit': 'C. Crédito',
    'debit': 'C. Débito'
  };
  return methods[method] || method;
}

// --- CAIXA (SESSÕES E TRANSAÇÕES) ---
export function getCashSessions() {
  const sessions = JSON.parse(localStorage.getItem(KEY_CASH_SESSIONS)) || [];
  return sessions.map(s => ({
    ...s,
    initialAmount: Number(s.initialAmount) || 0,
    expectedAmount: Number(s.expectedAmount) || 0,
    actualAmount: Number(s.actualAmount) || 0,
    difference: Number(s.difference) || 0,
    transactions: (s.transactions || []).map(t => ({
      ...t,
      amount: Number(t.amount) || 0
    }))
  }));
}

export function saveCashSessions(sessions) {
  localStorage.setItem(KEY_CASH_SESSIONS, JSON.stringify(sessions));
}

export function getCurrentCashSession() {
  const sessions = getCashSessions();
  return sessions.find(s => s.status === 'open') || null;
}

export function openCash(initialAmount, operatorName = 'Operador Purple') {
  const sessions = getCashSessions();
  const current = getCurrentCashSession();
  if (current) {
    throw new Error('Já existe um caixa aberto!');
  }

  const newSession = {
    id: 'c_' + Date.now(),
    status: 'open',
    operator: operatorName,
    openedAt: new Date().toISOString(),
    closedAt: null,
    initialAmount: parseFloat(initialAmount) || 0,
    expectedAmount: parseFloat(initialAmount) || 0,
    actualAmount: 0,
    difference: 0,
    transactions: [],
    notes: ''
  };

  sessions.push(newSession);
  saveCashSessions(sessions);
  return newSession;
}

export function addCashTransaction(type, amount, description = '') {
  const sessions = getCashSessions();
  const current = sessions.find(s => s.status === 'open');
  if (!current) {
    throw new Error('Nenhum caixa aberto para realizar movimentações!');
  }

  const txAmount = parseFloat(amount);
  const transaction = {
    id: 't_' + Date.now(),
    type,
    amount: txAmount,
    time: new Date().toISOString(),
    description
  };

  current.transactions.push(transaction);

  if (type === 'suprimento' || type === 'venda') {
    current.expectedAmount += txAmount;
  } else if (type === 'sangria') {
    current.expectedAmount -= txAmount;
  }

  saveCashSessions(sessions);
  return current;
}

export function closeCash(actualAmount, notes = '') {
  const sessions = getCashSessions();
  const index = sessions.findIndex(s => s.status === 'open');
  if (index === -1) {
    throw new Error('Nenhum caixa aberto para fechar!');
  }

  const current = sessions[index];
  current.status = 'closed';
  current.closedAt = new Date().toISOString();
  current.actualAmount = parseFloat(actualAmount) || 0;
  current.difference = current.actualAmount - current.expectedAmount;
  current.notes = notes;

  saveCashSessions(sessions);
  return current;
}

export function updateCashOperator(newOperatorName) {
  const sessions = getCashSessions();
  const current = sessions.find(s => s.status === 'open');
  if (!current) {
    throw new Error('Nenhum caixa aberto para alterar o operador!');
  }
  current.operator = newOperatorName;
  saveCashSessions(sessions);
  return current;
}
