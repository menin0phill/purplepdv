import { createClient } from '@supabase/supabase-js';

// ======== SISTEMA DE ARMAZENAMENTO ILIMITADO OFFLINE (ELECTRON FS) ========
let fsModule = null;
let pathModule = null;
let dataPath = '';

try {
  if (typeof window !== 'undefined' && window.require) {
    fsModule = window.require('fs');
    pathModule = window.require('path');
    const appData = window['process'].env['APPDATA'] || (window['process'].platform === 'darwin' ? window['process'].env['HOME'] + '/Library/Application Support' : window['process'].env['HOME'] + '/.config');
    dataPath = pathModule.join(appData, 'PurplePDV_Data_Offline');
    if (!fsModule.existsSync(dataPath)) {
      fsModule.mkdirSync(dataPath, { recursive: true });
    }
  }
} catch (e) {}

export function getStorageItem(key) {
  if (fsModule) {
    try {
      const file = pathModule.join(dataPath, key + '.json');
      if (fsModule.existsSync(file)) {
        return fsModule.readFileSync(file, 'utf8');
      }
      
      const localData = localStorage.getItem(key);
      if (localData) {
        fsModule.writeFileSync(file, localData, 'utf8');
        return localData;
      }
    } catch(e) {}
    return null;
  }
  return localStorage.getItem(key);
}

export function setStorageItem(key, value) {
  if (fsModule) {
    try {
      const file = pathModule.join(dataPath, key + '.json');
      fsModule.writeFileSync(file, value, 'utf8');
    } catch(e) {}
  } else {
    localStorage.setItem(key, value);
  }
}
// =========================================================================

const supabaseUrl = 'https://vhjnvewzyfaohmdqdxzj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoam52ZXd6eWZhb2htZHFkeHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzQxODcsImV4cCI6MjEwMjE1MDE4N30.i_xMrg-4OcytJTp0Frqvp9nago0mtWCaiXAo23kDs2E';

export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (supabase) {
  setTimeout(() => {
    try {
      supabase.channel('purple-pdv-realtime-global').on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('[Realtime] Alteração', payload); syncWithSupabase().catch(e => console.warn(e));
      }).subscribe();
    } catch (e) {}
  }, 1000);
}
export function sanitizeHTML(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

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
  },
  {
    id: 'op2',
    name: 'Operador Purple',
    email: 'purple@live.com',
    password: '080601',
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
  if (!getStorageItem('purple_pdv_db_reset_v9')) {
    setStorageItem(KEY_SALES, JSON.stringify([]));
    setStorageItem(KEY_CASH_SESSIONS, JSON.stringify([]));
    setStorageItem('purple_pdv_db_reset_v9', 'true');
  }

  // MIGRAR IDs DUPLICADOS (causados por importações em massa na mesma milissegundo)
  const rawProds = getStorageItem(KEY_PRODUCTS);
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
        setStorageItem(KEY_PRODUCTS, JSON.stringify(prods));
        console.log("Database Migration: Fixed duplicate product IDs!");
      }
    } catch(e) {
      console.error("Migration error:", e);
    }
  }

  const currentProds = getStorageItem(KEY_PRODUCTS);
  let needsReset = false;
  if (!currentProds) {
    needsReset = true;
  }

  if (needsReset) {
    setStorageItem(KEY_PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS.map(p => ({ ...p, synced: true }))));
  }
  if (!getStorageItem(KEY_SALES)) {
    setStorageItem(KEY_SALES, JSON.stringify([]));
  }
  if (!getStorageItem(KEY_CASH_SESSIONS)) {
    setStorageItem(KEY_CASH_SESSIONS, JSON.stringify([]));
  }
  if (!getStorageItem(KEY_CLIENTS)) {
    setStorageItem(KEY_CLIENTS, JSON.stringify(DEFAULT_CLIENTS.map(c => ({ ...c, synced: true }))));
  }
  if (!getStorageItem(KEY_CONFIG)) {
    setStorageItem(KEY_CONFIG, JSON.stringify({ requireClientCheckout: true }));
  }
  let ops = JSON.parse(getStorageItem(KEY_OPERATORS)) || [];
  if (ops.length === 0) {
    setStorageItem(KEY_OPERATORS, JSON.stringify(DEFAULT_OPERATORS.map(o => ({ ...o, synced: true }))));
  } else {
    let mod = false;
    DEFAULT_OPERATORS.forEach(dOp => {
      if (!ops.some(o => o.email && o.email.toLowerCase() === dOp.email.toLowerCase())) {
        ops.push(dOp);
        mod = true;
      }
    });
    if (mod) setStorageItem(KEY_OPERATORS, JSON.stringify(ops));
  }
}

// Executa initDB ao importar
initDB();

// --- OPERADORES ---
export function getOperators() {
  let ops = JSON.parse(getStorageItem(KEY_OPERATORS)) || [];
  let mod = false;
  DEFAULT_OPERATORS.forEach(dOp => {
    if (!ops.some(o => o.email && o.email.toLowerCase() === dOp.email.toLowerCase())) {
      ops.push(dOp);
      mod = true;
    }
  });
  if (mod || ops.length === 0) {
    const finalOps = ops.length ? ops : DEFAULT_OPERATORS;
    setStorageItem(KEY_OPERATORS, JSON.stringify(finalOps));
    return finalOps;
  }
  return ops;
}

export function saveOperators(operators) {
  setStorageItem(KEY_OPERATORS, JSON.stringify(operators));
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
  return JSON.parse(getStorageItem(KEY_CONFIG)) || { requireClientCheckout: true };
}

export function saveConfig(config) {
  setStorageItem(KEY_CONFIG, JSON.stringify(config));
}

// --- PRODUTOS ---
export function getProducts() {
  const prods = JSON.parse(getStorageItem(KEY_PRODUCTS)) || [];
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
  setStorageItem(KEY_PRODUCTS, JSON.stringify(products));
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
      id: v.id || ('v_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5)),
      stock: parseInt(v.stock) || 0,
      costPrice: v.costPrice !== undefined ? parseFloat(v.costPrice) || 0 : parseFloat(product.costPrice) || 0,
      price: v.price !== undefined ? parseFloat(v.price) || 0 : parseFloat(product.price) || 0,
      image: v.image || ''
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
      variations: (updatedData.variations || []).map((v, idx) => ({
        ...v,
        id: v.id || ('v_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5)),
        stock: parseInt(v.stock) || 0,
        costPrice: v.costPrice !== undefined ? parseFloat(v.costPrice) || 0 : parseFloat(updatedData.costPrice) || 0,
        price: v.price !== undefined ? parseFloat(v.price) || 0 : parseFloat(updatedData.price) || 0,
        image: v.image || ''
      })),
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
  
  // Add to deletion queue for persistent offline deletions
  const KEY_DELETED_PRODUCTS = 'purple_pdv_deleted_products';
  let deletedProductIds = JSON.parse(getStorageItem(KEY_DELETED_PRODUCTS)) || [];
  if (!deletedProductIds.includes(id)) {
    deletedProductIds.push(id);
    setStorageItem(KEY_DELETED_PRODUCTS, JSON.stringify(deletedProductIds));
  }

  if (supabase) {
    syncWithSupabase();
  } else {
    window.dispatchEvent(new CustomEvent('db-synced'));
  }
}

// --- VENDAS ---
export function getSales() {
  const sales = JSON.parse(getStorageItem(KEY_SALES)) || [];
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
  setStorageItem(KEY_SALES, JSON.stringify(sales));
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

  // Se a venda teve pagamento no fiado, incrementa o débito do cliente
  const fiadoAmount = sale.payments && sale.payments.fiado ? sale.payments.fiado : (sale.paymentMethod === 'fiado' ? sale.total : 0);
  if (sale.clientId && fiadoAmount > 0) {
    const clients = getClients();
    const client = clients.find(c => c.id === sale.clientId);
    if (client) {
      client.debt = (client.debt || 0) + fiadoAmount;
      client.synced = false;
      saveClients(clients);
    }
  }

  const newSale = {
    ...sale,
    origin: sale.origin || 'pos',
    status: sale.status || (sale.origin === 'e-commerce' ? 'Preparando' : 'Finalizada'),
    id: 's_' + getRealNow(),
    timestamp: getRealDate().toISOString(),
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

export function cancelSale(saleId) {
  const sales = getSales();
  const saleIndex = sales.findIndex(s => s.id === saleId);
  if (saleIndex === -1) throw new Error('Venda não encontrada');
  const sale = sales[saleIndex];
  
  if (sale.status === 'Cancelada') throw new Error('A venda já está cancelada');

  // Devolver ao estoque
  const products = getProducts();
  sale.items.forEach(item => {
    const prod = products.find(p => p.id === item.id);
    if (prod) {
      if (item.variationId && prod.variations) {
        const v = prod.variations.find(v => v.id === item.variationId);
        if (v) v.stock += item.quantity;
      }
      prod.stock += item.quantity;
      prod.synced = false;
    }
  });
  saveProducts(products);

  // Reverter Dívida de Fiado se houver
  const fiadoAmount = sale.payments && sale.payments.fiado ? sale.payments.fiado : (sale.paymentMethod === 'fiado' ? sale.total : 0);
  if (sale.clientId && fiadoAmount > 0) {
    const clients = getClients();
    const client = clients.find(c => c.id === sale.clientId);
    if (client) {
      client.debt = Math.max(0, (client.debt || 0) - fiadoAmount);
      client.synced = false;
      saveClients(clients);
    }
  }

  // Estornar pagamentos do caixa atual (se houver caixa aberto)
  const paidAmount = sale.amountPaid || sale.total; // para vendas antigas
  const amountToRefund = sale.paymentMethod === 'fiado' ? 0 : paidAmount;
  const shortId = sale.id.split('_')[1] || sale.id;
  
  if (sale.payments) {
    if (sale.payments.money > 0) addCashTransaction('sangria', sale.payments.money, `Estorno de Venda #${shortId} (Dinheiro)`);
    if (sale.payments.pix > 0) addCashTransaction('sangria', sale.payments.pix, `Estorno de Venda #${shortId} (Pix)`);
    if (sale.payments.credit > 0) addCashTransaction('sangria', sale.payments.credit, `Estorno de Venda #${shortId} (Crédito)`);
    if (sale.payments.debit > 0) addCashTransaction('sangria', sale.payments.debit, `Estorno de Venda #${shortId} (Débito)`);
  } else if (amountToRefund > 0) {
    addCashTransaction('sangria', amountToRefund, `Estorno de Venda #${shortId}`);
  }

  // Mudar o status
  sale.status = 'Cancelada';
  sale.synced = false;
  saveSales(sales);
  syncWithSupabase();
  return sale;
}

// --- CLIENTES ---
export function getClients() {
  const clients = JSON.parse(getStorageItem(KEY_CLIENTS)) || [];
  return clients.map(c => ({
    ...c,
    debt: Number(c.debt) || 0
  }));
}

export function saveClients(clients) {
  setStorageItem(KEY_CLIENTS, JSON.stringify(clients));
}

export function addClient(client) {
  const clients = getClients();
  const newClient = {
    ...client,
    id: 'c_' + getRealNow(),
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
      if (error) {
        console.error("Error deleting client from Supabase:", error);
      } else {
        syncWithSupabase();
      }
    });
  } else {
    window.dispatchEvent(new CustomEvent('db-synced'));
  }
}

export function payClientDebt(clientId, amountOrPayments, paymentMethod = null) {
  const clients = getClients();
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    throw new Error('Cliente não encontrado!');
  }

  let totalPaid = 0;
  if (typeof amountOrPayments === 'object') {
    totalPaid = Object.values(amountOrPayments).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  } else {
    totalPaid = parseFloat(amountOrPayments) || 0;
  }

  if (totalPaid <= 0) {
    throw new Error('Valor de pagamento inválido!');
  }

  client.debt = Math.max(0, client.debt - totalPaid);
  client.synced = false;
  saveClients(clients);
  syncWithSupabase();

  // Registrar a entrada no caixa (Apenas Dinheiro físico!)
  if (typeof amountOrPayments === 'object') {
    if (amountOrPayments.money > 0) addCashTransaction('suprimento', amountOrPayments.money, `Recebimento Débito (Fiado) - ${client.name} (Dinheiro)`);
  } else {
    if (!paymentMethod || paymentMethod === 'money') {
      addCashTransaction('suprimento', totalPaid, `Recebimento Débito (Fiado) - ${client.name} (Dinheiro)`);
    }
  }
  
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

// Sincronização de Tempo
let timeOffset = 0;

export async function initializeNetworkTime() {
  try {
    const res = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=America/Sao_Paulo');
    if (res.ok) {
      const data = await res.json();
      const networkTime = new Date(data.dateTime + '-03:00').getTime();
      timeOffset = networkTime - Date.now();
    }
  } catch (err) {
    console.warn('Network time sync failed, using local time.', err);
  }
}

export function getRealDate() {
  return new Date(Date.now() + timeOffset);
}

export function getRealNow() {
  return Date.now() + timeOffset;
}

// --- CAIXA (SESSÕES E TRANSAÇÕES) ---
export function getCashSessions() {
  const sessions = JSON.parse(getStorageItem(KEY_CASH_SESSIONS)) || [];
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
  setStorageItem(KEY_CASH_SESSIONS, JSON.stringify(sessions));
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
    id: 'c_' + getRealNow(),
    status: 'open',
    operator: operatorName,
    openedAt: getRealDate().toISOString(),
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
    id: 't_' + getRealNow(),
    type,
    amount: txAmount,
    time: getRealDate().toISOString(),
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
  if (typeof syncWithSupabase === 'function') {
    syncWithSupabase();
  }
  return current;
}

export function closeCash(actualAmount, notes = '') {
  const sessions = getCashSessions();
  const index = sessions.findIndex(s => s.status === 'open');
  if (index === -1) {
    throw new Error('Nenhum caixa aberto para fechar!');
  }

  const current = sessions[index];
  
  // Calculate expected amount dynamically to ensure it is always accurate, even after pulling from Supabase
  const sales = getSales().filter(sale => new Date(sale.timestamp) >= new Date(current.openedAt) && sale.status !== 'Cancelada');
  const moneySales = sales.reduce((sum, sale) => {
    if (sale.payments) {
      return sum + (Number(sale.payments.money) || 0);
    } else {
      return sum + (sale.paymentMethod === 'money' ? sale.total : 0);
    }
  }, 0);
  const suprimentos = (current.transactions || []).filter(t => t.type === 'suprimento').reduce((sum, t) => sum + t.amount, 0);
  const sangrias = (current.transactions || []).filter(t => t.type === 'sangria' && !(t.description || '').startsWith('Estorno')).reduce((sum, t) => sum + t.amount, 0);
  const expectedAmount = (current.initialAmount || 0) + moneySales + suprimentos - sangrias;
  
  current.status = 'closed';
  current.closedAt = getRealDate().toISOString();
  current.expectedAmount = expectedAmount;
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
let isSyncing = false;
let syncQueued = false;

// Helper para buscar todas as linhas contornando o limite nativo do PostgREST (1000 linhas) via paginação
async function fetchAllRows(tableName, orderBy = 'updated_at', columns = '*') {
  if (!supabase) return { data: null, error: 'not_configured' };
  let allRows = [];
  let from = 0;
  const step = 1000;
  let more = true;
  while (more) {
    const { data, error } = await supabase
      .from(tableName)
      .select(columns)
      .order(orderBy, { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + step - 1);
    
    if (error || !data) {
      // CRITICAL FIX: If ANY page fails, we must abort and return the error.
      // Otherwise, we silently return partial data, and the sync engine will incorrectly DELETE all missing items locally!
      return { data: null, error: error || new Error("Failed to fetch paginated data") };
    }
    allRows = allRows.concat(data);
    if (data.length < step) {
      more = false;
    } else {
      from += step;
    }
  }
  return { data: allRows, error: null };
}

export async function syncWithSupabase(manual = false) {
  if (!supabase) {
    console.log("Supabase: Client not configured. Running in LocalStorage-only mode.");
    return { success: false, reason: 'not_configured' };
  }

  if (isSyncing) {
    syncQueued = true;
    return { success: false, reason: 'already_syncing' };
  }

  isSyncing = true;
  try {
    console.log("Supabase: Starting background synchronization...");

    // 1. PUSH LOCAL CHANGES TO REMOTE
    // Sync Products
    const localProducts = JSON.parse(getStorageItem(KEY_PRODUCTS)) || [];
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
        updated_at: getRealDate().toISOString()
      };
      
      const { error } = await supabase.from('products').upsert(payload);
      if (!error) {
        prod.synced = true;
      } else {
        console.error("Error syncing product:", prod.id, error);
        setStorageItem('purple_pdv_last_upsert_error', `Produto ${prod.name}: ${error.message || JSON.stringify(error)}`);
      }
    }

    // Push Deleted Products
    const KEY_DELETED_PRODUCTS = 'purple_pdv_deleted_products';
    let deletedProductIds = JSON.parse(getStorageItem(KEY_DELETED_PRODUCTS)) || [];
    if (deletedProductIds.length > 0) {
      const remainingDeletes = [];
      for (const id of deletedProductIds) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          console.error("Error pushing delete for product:", id, error);
          remainingDeletes.push(id);
        }
      }
      deletedProductIds = remainingDeletes;
      setStorageItem(KEY_DELETED_PRODUCTS, JSON.stringify(deletedProductIds));
    }

    setStorageItem(KEY_PRODUCTS, JSON.stringify(localProducts));

    // Sync Operators
    const localOperators = JSON.parse(getStorageItem(KEY_OPERATORS)) || [];
    const unsyncedOperators = localOperators.filter(o => !o.synced);
    for (const op of unsyncedOperators) {
      const payload = {
        id: op.id,
        name: op.name,
        email: op.email,
        password: op.password,
        role: op.role || 'operator',
        updated_at: getRealDate().toISOString()
      };
      const { error } = await supabase.from('operators').upsert(payload);
      if (!error) {
        op.synced = true;
      } else {
        console.error("Error syncing operator:", op.id, error);
      }
    }
    setStorageItem(KEY_OPERATORS, JSON.stringify(localOperators));

    // Sync Clients
    const unsyncedClients = (JSON.parse(getStorageItem(KEY_CLIENTS)) || []).filter(c => !c.synced);
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
        updated_at: getRealDate().toISOString()
      };
      
      const { error } = await supabase.from('clients').upsert(payload);
      if (!error) {
        const fresh = JSON.parse(getStorageItem(KEY_CLIENTS)) || [];
        const fIdx = fresh.findIndex(x => x.id === client.id);
        if (fIdx !== -1) {
          fresh[fIdx].synced = true;
          setStorageItem(KEY_CLIENTS, JSON.stringify(fresh));
        }
      } else {
        console.error("Error syncing client:", client.id, error);
      }
    }

    // Sync Sales
    const localSales = JSON.parse(getStorageItem(KEY_SALES)) || [];
    const unsyncedSales = localSales.filter(s => !s.synced);
    for (const sale of unsyncedSales) {
      const payload = {
        id: sale.id,
        client_id: sale.clientId || null,
        client_name: sale.clientName || '',
        date: sale.date || sale.timestamp || getRealDate().toISOString(),
        items: sale.items || [],
        subtotal: Number(sale.subtotal) || 0,
        discount: Number(sale.discount) || 0,
        total: Number(sale.total) || 0,
        payment_method: sale.payments ? JSON.stringify(sale.payments) : (sale.paymentMethod || 'dinheiro'),
        amount_paid: Number(sale.amountPaid) || 0,
        operator: sale.operator || '',
        origin: sale.origin || 'pdv',
          status: sale.status || 'Finalizada',
        delivery_address: sale.deliveryAddress || '',
        coupon: sale.coupon || null,
        shipping_fee: Number(sale.shippingFee) || 0,
        shipping_carrier: sale.shippingCarrier || '',
        updated_at: getRealDate().toISOString()
      };
      
      const { error } = await supabase.from('sales').upsert(payload);
      if (!error) {
        sale.synced = true;
      } else {
        console.error("Error syncing sale:", sale.id, error);
      }
    }
    setStorageItem(KEY_SALES, JSON.stringify(localSales));

    // Sync Cash Sessions
    const localSessions = JSON.parse(getStorageItem(KEY_CASH_SESSIONS)) || [];
    const unsyncedSessions = localSessions.filter(s => !s.synced);
    for (const session of unsyncedSessions) {
      const payload = {
        id: session.id,
        operator: session.operator,
        open_time: session.openedAt,
        close_time: session.closedAt || null,
        initial_cash: Number(session.initialAmount) || 0,
        final_cash: Number(session.actualAmount) || 0,
        status: session.status || 'closed',
        transactions: session.transactions || [],
        updated_at: getRealDate().toISOString()
      };
      
      const { error } = await supabase.from('cash_sessions').upsert(payload);
      if (!error) {
        session.synced = true;
      } else {
        console.error("Error syncing cash session:", session.id, error);
      }
    }
    setStorageItem(KEY_CASH_SESSIONS, JSON.stringify(localSessions));

    // 2. PULL FRESH TABLES FROM REMOTE AND OVERWRITE LOCAL (SMART SYNC - 99% LESS BANDWIDTH)
    let dataChanged = false;
    
    // --- SMART SYNC LOGIC PARA ECONOMIA DE BANDA (99% MENOS DADOS) ---
    async function smartSyncTable(tableName, localKey, mapFn) {
      let columns = 'id, updated_at';
      if (tableName === 'products') columns += ', code';
      
      const { data: metaData, error: errMeta } = await fetchAllRows(tableName, 'updated_at', columns);
      if (errMeta || !metaData) { if (errMeta && errMeta.message) throw new Error(errMeta.message); return false; }

      const localData = JSON.parse(getStorageItem(localKey)) || [];
      const remoteIds = new Set(metaData.map(r => String(r.id)));
      const remoteCodes = tableName === 'products' ? new Set(metaData.map(p => String(p.code)).filter(Boolean)) : new Set();
      
      let activeLocalData = localData.filter(ld => !ld.synced || remoteIds.has(String(ld.id)));
      if (tableName === 'products') {
        activeLocalData = localData.filter(lp => !lp.synced || remoteIds.has(String(lp.id)) || (lp.code && remoteCodes.has(String(lp.code))));
      }

      const idsToFetch = [];
      for (const meta of metaData) {
        const local = activeLocalData.find(l => String(l.id) === String(meta.id));
        if (!local || local.updated_at !== meta.updated_at) {
          idsToFetch.push(meta.id);
        }
      }

      let fetchedFullRows = [];
      if (idsToFetch.length > 0) {
        const { data: freshRows, error: errFresh } = await fetchFullRowsByIds(tableName, idsToFetch);
        if (!errFresh && freshRows) {
          fetchedFullRows = freshRows;
        }
      }

      const merged = [...activeLocalData];
      let hasChanges = false;

      for (const meta of metaData) {
        if (tableName === 'products' && typeof deletedProductIds !== 'undefined' && deletedProductIds.includes(meta.id)) continue;

        const fullRow = fetchedFullRows.find(f => String(f.id) === String(meta.id));
        if (fullRow) {
           const mappedObj = mapFn(fullRow);
           mappedObj.updated_at = meta.updated_at;
           mappedObj.synced = true;

           let idx = -1;
           if (tableName === 'products') {
              idx = merged.findIndex(lp => lp.id === mappedObj.id || (lp.code && lp.code === mappedObj.code));
           } else {
              idx = merged.findIndex(l => l.id === mappedObj.id);
           }

           if (idx !== -1) {
              if (merged[idx].synced) merged[idx] = { ...merged[idx], ...mappedObj, synced: true };
           } else {
              merged.push(mappedObj);
           }
           hasChanges = true;
        }
      }

      if (merged.length !== localData.length) hasChanges = true;

      const prevVal = getStorageItem(localKey);
      const newVal = JSON.stringify(merged);
      if (prevVal !== newVal) {
         setStorageItem(localKey, newVal);
         return true;
      }
      return false;
    }


    const prodChanged = await smartSyncTable('products', KEY_PRODUCTS, (p) => ({
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
      variations: p.variations || []
    }));
    if (prodChanged) dataChanged = true;

    const clientChanged = await smartSyncTable('clients', KEY_CLIENTS, (c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      password: c.password,
      birthday: c.birthday,
      notes: c.notes,
      cpfCnpj: c.cpf_cnpj,
      zipCode: c.zip_code,
      address: c.address,
      number: c.number,
      neighborhood: c.neighborhood,
      city: c.city,
      state: c.state,
      debt: Number(c.debt)
    }));
    if (clientChanged) dataChanged = true;

    try {
      const opChanged = await smartSyncTable('operators', 'purple_pdv_operators', (o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        password: o.password,
        role: o.role || 'operator'
      }));
      if (opChanged) dataChanged = true;
    } catch (e) {
      console.warn("Supabase Operators sync failed:", e);
    }

    const salesChanged = await smartSyncTable('sales', KEY_SALES, (s) => {
      let parsedPayments = s.payments || null;
      if (!parsedPayments && s.payment_method && s.payment_method.startsWith('{')) {
        try { parsedPayments = JSON.parse(s.payment_method); } catch (e) {}
      }
      return {
        id: s.id,
        clientId: s.client_id,
        clientName: s.client_name,
        date: s.date,
        timestamp: s.date,
        items: s.items || [],
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        total: Number(s.total),
        paymentMethod: s.payment_method,
        payments: parsedPayments,
        status: s.status,
        origin: s.origin
      };
    });
    if (salesChanged) dataChanged = true;

    const cashChanged = await smartSyncTable('cash_sessions', KEY_CASH_SESSIONS, (s) => ({
      id: s.id,
      operator: s.operator,
      openedAt: s.open_time,
      closedAt: s.close_time,
      initialAmount: Number(s.initial_cash),
      actualAmount: Number(s.final_cash),
      status: s.status,
      transactions: s.transactions || []
    }));
    if (cashChanged) dataChanged = true;

    console.log("Supabase: Background synchronization completed successfully!", { dataChanged });
    localStorage.removeItem('purple_pdv_last_sync_error');
    if (dataChanged) {
      window.dispatchEvent(new CustomEvent('db-synced'));
    }
    return { success: true };
  } catch (err) {
    console.error("Sync error:", err);
    setStorageItem('purple_pdv_last_sync_error', err.message || String(err));
    if (manual) throw err;
    return { success: false, reason: err.message };
  } finally {
    isSyncing = false;
    if (syncQueued) {
      syncQueued = false;
      setTimeout(() => {
        syncWithSupabase().catch(() => {});
      }, 500);
    }
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

export function generatePixPayload(key, amount, merchantName = "Purple Cosmetics", merchantCity = "Sao Paulo") {
  function crc16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  // Normaliza o nome e cidade (remover acentos para compatibilidade EMV)
  const cleanName = merchantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 25);
  const cleanCity = merchantCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 15);

  const parts = [
    "000201",
    "26" + String(22 + key.length).padStart(2, '0') + "0014br.gov.bcb.pix01" + String(key.length).padStart(2, '0') + key,
    "52040000",
    "5303986",
    "54" + String(Number(amount).toFixed(2).length).padStart(2, '0') + Number(amount).toFixed(2),
    "5802BR",
    "59" + String(cleanName.length).padStart(2, '0') + cleanName,
    "60" + String(cleanCity.length).padStart(2, '0') + cleanCity,
    "62070503***"
  ];

  const raw = parts.join("") + "6304";
  return raw + crc16(raw);
}


// Inicializar tempo da rede quando o arquivo é carregado
initializeNetworkTime();

async function fetchFullRowsByIds(tableName, ids) {
  if (!supabase) return { data: null, error: 'not_configured' };
  let allRows = [];
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data, error } = await supabase.from(tableName).select('*').in('id', chunk);
    if (error || !data) return { data: null, error: error || new Error("Failed chunk fetch") };
    allRows = allRows.concat(data);
  }
  return { data: allRows, error: null };
}
