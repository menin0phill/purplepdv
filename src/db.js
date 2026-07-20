import { createClient } from '@supabase/supabase-js';

// LocalStorage Fallback for Supabase config (allows setting credentials directly in Admin UI)
const localDbConfig = JSON.parse(localStorage.getItem('purple_pdv_supabase_config')) || {};

const supabaseUrl = localDbConfig.url || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = localDbConfig.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Banco de dados simulado em LocalStorage para o PDV Purple

const KEY_PRODUCTS = 'purple_pdv_products';
const KEY_SALES = 'purple_pdv_sales';
const KEY_CASH_SESSIONS = 'purple_pdv_cash_sessions';
const KEY_CLIENTS = 'purple_pdv_clients';
const KEY_CONFIG = 'purple_pdv_config';
const KEY_OPERATORS = 'purple_pdv_operators';

const DEFAULT_OPERATORS = [
  {
    id: 'op1',
    name: 'Henrique',
    email: 'henriqueelsilva@gmail.com',
    password: 'Vida191023!',
    role: 'admin'
  }
];

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
  if (!localStorage.getItem(KEY_OPERATORS)) {
    localStorage.setItem(KEY_OPERATORS, JSON.stringify(DEFAULT_OPERATORS));
  }
}

// Executa initDB ao importar
initDB();

// --- OPERADORES ---
export function getOperators() {
  return JSON.parse(localStorage.getItem(KEY_OPERATORS)) || DEFAULT_OPERATORS;
}

export function saveOperators(operators) {
  localStorage.setItem(KEY_OPERATORS, JSON.stringify(operators));
}

export function addOperator(operator) {
  const operators = getOperators();
  const newOp = {
    id: 'op_' + Date.now(),
    name: operator.name,
    email: operator.email,
    password: operator.password,
    role: operator.role || 'operator',
    synced: false
  };
  operators.push(newOp);
  saveOperators(operators);
  syncWithSupabase();
  return newOp;
}

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
    })),
    synced: false
  };
  products.push(newProduct);
  saveProducts(products);
  syncWithSupabase();
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
      variations: updatedData.variations || [],
      synced: false
    };
    saveProducts(products);
    syncWithSupabase();
    return products[index];
  }
  return null;
}

export function deleteProduct(id) {
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  if (supabase) {
    supabase.from('products').delete().eq('id', id).then(({error}) => {
      if (error) console.error("Error deleting product from Supabase:", error);
    });
  }
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
      product.synced = false;
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
      client.synced = false;
      saveClients(clients);
    }
  }

  const newSale = {
    ...sale,
    origin: sale.origin || 'pos',
    status: sale.status || (sale.origin === 'e-commerce' ? 'Preparando' : 'Finalizada'),
    id: 's_' + Date.now(),
    timestamp: new Date().toISOString(),
    synced: false
  };
  sales.push(newSale);
  saveSales(sales);
  syncWithSupabase();
  return newSale;
}

export function updateSaleStatus(saleId, newStatus) {
  const sales = getSales();
  const index = sales.findIndex(s => s.id === saleId);
  if (index !== -1) {
    sales[index].status = newStatus;
    sales[index].synced = false;
    saveSales(sales);
    syncWithSupabase();
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
    birthday: client.birthday || '',
    synced: false
  };
  clients.push(newClient);
  saveClients(clients);
  syncWithSupabase();
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
      birthday: updatedData.birthday || '',
      synced: false
    };
    saveClients(clients);
    syncWithSupabase();
    return clients[index];
  }
  return null;
}

export function deleteClient(id) {
  let clients = getClients();
  clients = clients.filter(c => c.id !== id);
  saveClients(clients);
  if (supabase) {
    supabase.from('clients').delete().eq('id', id).then(({error}) => {
      if (error) console.error("Error deleting client from Supabase:", error);
    });
  }
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
  client.synced = false;
  saveClients(clients);
  syncWithSupabase();

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
    notes: '',
    synced: false
  };

  sessions.push(newSession);
  saveCashSessions(sessions);
  syncWithSupabase();
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
  current.synced = false;

  if (type === 'suprimento' || type === 'venda') {
    current.expectedAmount += txAmount;
  } else if (type === 'sangria') {
    current.expectedAmount -= txAmount;
  }

  saveCashSessions(sessions);
  syncWithSupabase();
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
  current.synced = false;

  saveCashSessions(sessions);
  syncWithSupabase();
  return current;
}

export function updateCashOperator(newOperatorName) {
  const sessions = getCashSessions();
  const current = sessions.find(s => s.status === 'open');
  if (!current) {
    throw new Error('Nenhum caixa aberto para alterar o operador!');
  }
  current.operator = newOperatorName;
  current.synced = false;
  saveCashSessions(sessions);
  syncWithSupabase();
  return current;
}

// --- SYNC & MEDIA SUPABASE ---
export async function syncWithSupabase() {
  if (!supabase) {
    console.log("Supabase: Client not configured. Running in LocalStorage-only mode.");
    return { success: false, reason: 'not_configured' };
  }

  try {
    console.log("Supabase: Starting background synchronization...");

    // 1. PUSH LOCAL CHANGES TO REMOTE
    // Sync Products
    const localProducts = JSON.parse(localStorage.getItem(KEY_PRODUCTS)) || [];
    const unsyncedProducts = localProducts.filter(p => !p.synced);
    for (const prod of unsyncedProducts) {
      const payload = {
        id: prod.id,
        code: prod.code || '',
        name: prod.name,
        category: prod.category || '',
        cost_price: Number(prod.costPrice) || 0,
        price: Number(prod.price) || 0,
        stock: Number(prod.stock) || 0,
        color: prod.color || '',
        image: prod.image || '',
        description: prod.description || '',
        variations: prod.variations || [],
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('products').upsert(payload);
      if (!error) {
        prod.synced = true;
      } else {
        console.error("Error syncing product:", prod.id, error);
      }
    }
    localStorage.setItem(KEY_PRODUCTS, JSON.stringify(localProducts));

    // Sync Operators
    const localOperators = JSON.parse(localStorage.getItem(KEY_OPERATORS)) || [];
    const unsyncedOperators = localOperators.filter(o => !o.synced);
    for (const op of unsyncedOperators) {
      const payload = {
        id: op.id,
        name: op.name,
        email: op.email,
        password: op.password,
        role: op.role || 'operator',
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('operators').upsert(payload);
      if (!error) {
        op.synced = true;
      } else {
        console.error("Error syncing operator:", op.id, error);
      }
    }
    localStorage.setItem(KEY_OPERATORS, JSON.stringify(localOperators));

    // Sync Clients
    const localClients = JSON.parse(localStorage.getItem(KEY_CLIENTS)) || [];
    const unsyncedClients = localClients.filter(c => !c.synced);
    for (const client of unsyncedClients) {
      const payload = {
        id: client.id,
        name: client.name,
        phone: client.phone || '',
        email: client.email || '',
        password: client.password || '',
        birthday: client.birthday || null,
        debt: Number(client.debt) || 0,
        notes: client.notes || '',
        cpf_cnpj: client.cpfCnpj || '',
        address: client.address || '',
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('clients').upsert(payload);
      if (!error) {
        client.synced = true;
      } else {
        console.error("Error syncing client:", client.id, error);
      }
    }
    localStorage.setItem(KEY_CLIENTS, JSON.stringify(localClients));

    // Sync Sales
    const localSales = JSON.parse(localStorage.getItem(KEY_SALES)) || [];
    const unsyncedSales = localSales.filter(s => !s.synced);
    for (const sale of unsyncedSales) {
      const payload = {
        id: sale.id,
        client_id: sale.clientId || null,
        client_name: sale.clientName || '',
        date: sale.date || sale.timestamp || new Date().toISOString(),
        items: sale.items || [],
        subtotal: Number(sale.subtotal) || 0,
        discount: Number(sale.discount) || 0,
        total: Number(sale.total) || 0,
        payment_method: sale.paymentMethod,
        amount_paid: Number(sale.amountPaid) || 0,
        operator: sale.operator || '',
        origin: sale.origin || 'pdv',
        delivery_address: sale.deliveryAddress || '',
        coupon: sale.coupon || null,
        shipping_fee: Number(sale.shippingFee) || 0,
        shipping_carrier: sale.shippingCarrier || '',
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('sales').upsert(payload);
      if (!error) {
        sale.synced = true;
      } else {
        console.error("Error syncing sale:", sale.id, error);
      }
    }
    localStorage.setItem(KEY_SALES, JSON.stringify(localSales));

    // Sync Cash Sessions
    const localSessions = JSON.parse(localStorage.getItem(KEY_CASH_SESSIONS)) || [];
    const unsyncedSessions = localSessions.filter(s => !s.synced);
    for (const session of unsyncedSessions) {
      const payload = {
        id: session.id,
        operator: session.operator || '',
        open_time: session.openedAt || null,
        close_time: session.closedAt || null,
        initial_cash: Number(session.initialAmount) || 0,
        final_cash: Number(session.actualAmount) || 0,
        status: session.status || 'closed',
        transactions: session.transactions || [],
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('cash_sessions').upsert(payload);
      if (!error) {
        session.synced = true;
      } else {
        console.error("Error syncing cash session:", session.id, error);
      }
    }
    localStorage.setItem(KEY_CASH_SESSIONS, JSON.stringify(localSessions));

    // 2. PULL FRESH TABLES FROM REMOTE AND OVERWRITE LOCAL
    // Fetch Products
    const { data: dbProducts, error: errProducts } = await supabase
      .from('products')
      .select('*')
      .order('updated_at', { ascending: true });

    if (!errProducts && dbProducts) {
      const mappedProds = dbProducts.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        costPrice: Number(p.cost_price),
        price: Number(p.price),
        stock: Number(p.stock),
        color: p.color,
        image: p.image,
        description: p.description,
        variations: p.variations || [],
        synced: true
      }));
      
      const localProds = JSON.parse(localStorage.getItem(KEY_PRODUCTS)) || [];
      const unsynced = localProds.filter(lp => !lp.synced);
      const merged = [...mappedProds];
      unsynced.forEach(lp => {
        if (!merged.find(sp => sp.id === lp.id)) merged.push(lp);
      });
      localStorage.setItem(KEY_PRODUCTS, JSON.stringify(merged));
    }

    // Fetch Clients
    const { data: dbClients, error: errClients } = await supabase
      .from('clients')
      .select('*')
      .order('updated_at', { ascending: true });

    if (!errClients && dbClients) {
      const mappedClients = dbClients.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        password: c.password,
        birthday: c.birthday,
        notes: c.notes,
        cpfCnpj: c.cpf_cnpj,
        address: c.address,
        debt: Number(c.debt),
        synced: true
      }));
      
      const localClients = JSON.parse(localStorage.getItem(KEY_CLIENTS)) || [];
      const unsynced = localClients.filter(lc => !lc.synced);
      const merged = [...mappedClients];
      unsynced.forEach(lc => {
        if (!merged.find(sc => sc.id === lc.id)) merged.push(lc);
      });
      localStorage.setItem(KEY_CLIENTS, JSON.stringify(merged));
    }

    // Fetch Operators
    try {
      const { data: dbOperators, error: errOperators } = await supabase
        .from('operators')
        .select('*')
        .order('updated_at', { ascending: true });

      if (!errOperators && dbOperators) {
        const mappedOperators = dbOperators.map(o => ({
          id: o.id,
          name: o.name,
          email: o.email,
          password: o.password,
          role: o.role || 'operator',
          synced: true
        }));
        
        const localOperators = JSON.parse(localStorage.getItem(KEY_OPERATORS)) || [];
        const unsynced = localOperators.filter(lo => !lo.synced);
        const merged = [...mappedOperators];
        unsynced.forEach(lo => {
          if (!merged.find(so => so.id === lo.id)) merged.push(lo);
        });
        localStorage.setItem(KEY_OPERATORS, JSON.stringify(merged));
      }
    } catch (e) {
      console.warn("Supabase Operators sync failed or table missing:", e);
    }

    // Fetch Sales
    const { data: dbSales, error: errSales } = await supabase
      .from('sales')
      .select('*')
      .order('updated_at', { ascending: true });

    if (!errSales && dbSales) {
      const mappedSales = dbSales.map(s => ({
        id: s.id,
        clientId: s.client_id,
        clientName: s.client_name,
        date: s.date,
        items: s.items || [],
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        total: Number(s.total),
        paymentMethod: s.payment_method,
        amountPaid: Number(s.amount_paid),
        operator: s.operator,
        origin: s.origin,
        deliveryAddress: s.delivery_address,
        coupon: s.coupon,
        shippingFee: Number(s.shipping_fee),
        shippingCarrier: s.shipping_carrier,
        synced: true
      }));
      
      const localSales = JSON.parse(localStorage.getItem(KEY_SALES)) || [];
      const unsynced = localSales.filter(ls => !ls.synced);
      const merged = [...mappedSales];
      unsynced.forEach(ls => {
        if (!merged.find(ss => ss.id === ls.id)) merged.push(ls);
      });
      localStorage.setItem(KEY_SALES, JSON.stringify(merged));
    }

    // Fetch Cash Sessions
    const { data: dbSessions, error: errSessions } = await supabase
      .from('cash_sessions')
      .select('*')
      .order('updated_at', { ascending: true });

    if (!errSessions && dbSessions) {
      const mappedSessions = dbSessions.map(s => ({
        id: s.id,
        operator: s.operator,
        openedAt: s.open_time,
        closedAt: s.close_time,
        initialAmount: Number(s.initial_cash),
        actualAmount: Number(s.final_cash),
        status: s.status,
        transactions: s.transactions || [],
        synced: true
      }));
      
      const localSessions = JSON.parse(localStorage.getItem(KEY_CASH_SESSIONS)) || [];
      const unsynced = localSessions.filter(ls => !ls.synced);
      const merged = [...mappedSessions];
      unsynced.forEach(ls => {
        if (!merged.find(ss => ss.id === ls.id)) merged.push(ls);
      });
      localStorage.setItem(KEY_CASH_SESSIONS, JSON.stringify(merged));
    }

    console.log("Supabase: Background synchronization completed successfully!");
    localStorage.removeItem('purple_pdv_last_sync_error');
    window.dispatchEvent(new CustomEvent('db-synced'));
    return { success: true };
  } catch (err) {
    console.error("Supabase Sync Failed:", err);
    localStorage.setItem('purple_pdv_last_sync_error', err.message || String(err));
    return { success: false, reason: err.message };
  }
}

export async function uploadProductImage(file) {
  if (!supabase) {
    throw new Error('Supabase não configurado.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
  const filePath = fileName;

  const { data, error } = await supabase.storage
    .from('products')
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(filePath);

  return publicUrl;
}

