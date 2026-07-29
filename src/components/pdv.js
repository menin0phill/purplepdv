import { getClients, addClient, getProducts, addSale, addCashTransaction, getConfig, getCurrentCashSession } from '../db.js';
import { showReceipt } from './receipt.js';

export function renderPDV(container) {
  let cart = [];
  const products = getProducts();
  const clients = getClients();

  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  let currentCategory = 'Todos';
  let searchQuery = '';

  container.innerHTML = `
    <div class="pdv-container fade-in">
      <div class="pdv-layout">
        
        <!-- Lado Esquerdo: Vitrine de Produtos -->
        <div class="pdv-products-panel">
          <div class="pdv-header">
            <div class="search-input-container">
              <i data-lucide="search" class="search-icon"></i>
              <input type="text" id="pdv-search-input" placeholder="Buscar por nome, categoria ou código de barras...">
            </div>
          </div>

          <!-- Categorias (Chips) -->
          <div class="pdv-categories-chips" id="pdv-category-chips">
            ${categories.map(cat => `
              <button class="chip ${cat === currentCategory ? 'active' : ''}" data-cat="${cat}">
                ${cat}
              </button>
            `).join('')}
          </div>

          <!-- Grid de Vitrine -->
          <div class="pdv-products-grid" id="pdv-grid">
            ${renderProductsGrid(products, currentCategory, searchQuery)}
          </div>
        </div>

        <!-- Lado Direito: Carrinho de Compras -->
        <div class="pdv-cart-section glass-card">
          <div class="cart-header">
            <h3>Carrinho de Venda</h3>
            <button id="btn-clear-cart" class="btn btn-clear text-danger btn-sm" title="Esvaziar Carrinho">
              <i data-lucide="trash-2"></i> Limpar
            </button>
          </div>

          <!-- Seleção de Cliente -->
          <div class="cart-client-selector margin-top-sm">
            <label for="client-select" class="text-xs text-muted font-bold">Cliente da Venda</label>
            <div class="client-select-container margin-top-xs">
              <select id="client-select">
                <option value="">-- Consumidor Geral --</option>
                ${clients.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('')}
              </select>
              <button id="btn-quick-add-client" class="btn btn-secondary" title="Cadastro Rápido de Cliente">
                <i data-lucide="plus"></i>
              </button>
            </div>
          </div>

          <!-- Lista de Itens no Carrinho -->
          <div class="cart-items-container" id="cart-items">
            <div class="cart-empty-state">
              <i data-lucide="shopping-cart"></i>
              <p>Carrinho Vazio</p>
            </div>
          </div>

          <!-- Resumo Financeiro -->
          <div class="cart-summary border-top-purple">
            <div class="summary-row">
              <span>Subtotal</span>
              <span id="cart-subtotal">R$ 0,00</span>
            </div>
            <div class="summary-row">
              <span>Desconto (R$)</span>
              <input type="number" id="cart-discount" value="0.00" step="0.01" min="0" class="discount-input">
            </div>
            <div class="summary-row total-row">
              <span>Total Geral</span>
              <strong id="cart-total" class="text-purple">R$ 0,00</strong>
            </div>
          </div>

          <button id="btn-checkout" class="btn btn-primary btn-full btn-lg margin-top-md" disabled>
            <i data-lucide="credit-card"></i> Finalizar Venda
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Checkout / Pagamento (Múltiplas Formas) -->
    <div id="modal-checkout" class="modal-overlay">
      <div style="display: flex; gap: 20px; align-items: flex-start; justify-content: center; max-width: 95vw; flex-wrap: wrap; max-height: 90vh; overflow-y: auto; padding: 20px;">
        <div class="modal-card max-w-lg" style="margin: 0; width: 100%; min-width: 350px;">
        <h3>Finalizar Pagamento</h3>
        <p class="text-muted text-sm">Insira o valor recebido em cada forma de pagamento.</p>
        
        <div class="checkout-total-banner margin-top-sm">
          <span>Valor da Venda</span>
          <h2 id="checkout-total-val">R$ 0,00</h2>
        </div>

        <div class="payment-split-grid margin-top-md" style="display: flex; flex-direction: column; gap: 10px;">
          <div class="payment-split-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <i data-lucide="banknote" class="text-purple"></i> <strong style="font-size: 15px;">Dinheiro</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="text-muted">R$</span>
              <input type="number" id="split-money" class="input-sm split-payment-input" placeholder="0,00" step="0.01" min="0" style="width: 100px; text-align: right; font-weight: bold; font-size: 16px;">
            </div>
          </div>
          <div class="payment-split-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <i data-lucide="qr-code" class="text-purple"></i> <strong style="font-size: 15px;">Pix</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="text-muted">R$</span>
              <input type="number" id="split-pix" class="input-sm split-payment-input" placeholder="0,00" step="0.01" min="0" style="width: 100px; text-align: right; font-weight: bold; font-size: 16px;">
            </div>
          </div>
          <div class="payment-split-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <i data-lucide="credit-card" class="text-purple"></i> <strong style="font-size: 15px;">Cartão de Crédito</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="text-muted">R$</span>
              <input type="number" id="split-credit" class="input-sm split-payment-input" placeholder="0,00" step="0.01" min="0" style="width: 100px; text-align: right; font-weight: bold; font-size: 16px;">
            </div>
          </div>
          <div class="payment-split-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <i data-lucide="credit-card" class="text-purple"></i> <strong style="font-size: 15px;">Cartão de Débito</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="text-muted">R$</span>
              <input type="number" id="split-debit" class="input-sm split-payment-input" placeholder="0,00" step="0.01" min="0" style="width: 100px; text-align: right; font-weight: bold; font-size: 16px;">
            </div>
          </div>
          <div class="payment-split-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <i data-lucide="user-minus" class="text-purple"></i> <strong style="font-size: 15px;">Fiado / A Prazo</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="text-muted">R$</span>
              <input type="number" id="split-fiado" class="input-sm split-payment-input" placeholder="0,00" step="0.01" min="0" style="width: 100px; text-align: right; font-weight: bold; font-size: 16px;">
            </div>
          </div>
        </div>
        
        <div id="fiado-client-warning" class="text-xs text-danger margin-top-xs hidden font-bold" style="background: rgba(239, 68, 68, 0.1); padding: 8px; border-radius: 4px; border-left: 3px solid #ef4444;">
          <i data-lucide="alert-circle" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> É obrigatório selecionar um cliente na tela anterior para lançar fiado!
        </div>

        <div class="checkout-summary margin-top-md" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 15px;">
            <span class="text-muted">Total Informado:</span>
            <strong id="split-total-informed">R$ 0,00</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #ef4444; font-size: 16px;" id="split-remaining-container">
            <span>Falta Receber:</span>
            <strong id="split-remaining">R$ 0,00</strong>
          </div>
          <div style="display: flex; justify-content: space-between; color: #10b981; font-size: 16px; display: none;" id="split-change-container">
            <span>Troco (Dinheiro):</span>
            <strong id="split-change">R$ 0,00</strong>
          </div>
        </div>

        <div class="modal-actions margin-top-lg">
          <button type="button" id="btn-cancel-checkout" class="btn btn-secondary">Voltar</button>
          <button type="button" id="btn-confirm-sale" class="btn btn-primary" disabled><i data-lucide="check-circle"></i> Confirmar Venda</button>
        </div>
      </div>
      
      <!-- Teclado Numérico Virtual Purple -->
      <div class="modal-card numpad-card glass-card border-left-purple" style="margin: 0; width: 320px; display: flex; flex-direction: column; gap: 15px; padding: 20px; min-width: 300px;">
        <h3 class="text-center" style="font-size: 1.2rem; margin-bottom: 0;">Teclado Virtual</h3>
        <p class="text-center text-muted text-sm" style="margin-top: -10px;">Toque para digitar no campo ativo</p>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px;">
          <button type="button" class="btn btn-secondary numpad-btn" data-val="1" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">1</button>
          <button type="button" class="btn btn-secondary numpad-btn" data-val="2" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">2</button>
          <button type="button" class="btn btn-secondary numpad-btn" data-val="3" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">3</button>
          
          <button type="button" class="btn btn-secondary numpad-btn" data-val="4" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">4</button>
          <button type="button" class="btn btn-secondary numpad-btn" data-val="5" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">5</button>
          <button type="button" class="btn btn-secondary numpad-btn" data-val="6" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">6</button>
          
          <button type="button" class="btn btn-secondary numpad-btn" data-val="7" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">7</button>
          <button type="button" class="btn btn-secondary numpad-btn" data-val="8" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">8</button>
          <button type="button" class="btn btn-secondary numpad-btn" data-val="9" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">9</button>
          
          <button type="button" class="btn btn-secondary numpad-btn" data-val="C" style="font-size: 1.2rem; padding: 18px; border-radius: 12px; background: rgba(255,100,100,0.1); color: #ff6b6b; font-weight: bold;">C</button>
          <button type="button" class="btn btn-secondary numpad-btn" data-val="0" style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">0</button>
          <button type="button" class="btn btn-secondary numpad-btn" data-val="." style="font-size: 1.5rem; padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.05);">.</button>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn btn-secondary numpad-btn" data-val="backspace" style="padding: 12px; border-radius: 10px;"><i data-lucide="delete"></i> Apagar</button>
          <button type="button" class="btn btn-primary numpad-btn" data-val="exact" style="padding: 12px; border-radius: 10px;">Exato</button>
        </div>
      </div>
      
      </div>
    </div>

    <!-- Modal Detalhes do Produto (PDV) -->
    <div id="modal-product-details" class="modal-overlay">
      <div class="modal-card max-w-lg">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h3>Detalhes do Cosmético</h3>
          <button id="btn-close-detail" class="btn-icon" title="Fechar"><i data-lucide="x"></i></button>
        </div>
        <div class="margin-top-md" id="detail-prod-content">
          <!-- Injetado dinamicamente via JS -->
        </div>
      </div>
    </div>

    <!-- Modal Seleção de Variação Rápida (Cor/Tons) -->
    <div id="modal-variation-select" class="modal-overlay">
      <div class="modal-card max-w-sm">
        <h3 id="var-select-title">Selecionar Variação</h3>
        <p class="text-muted text-sm margin-top-xs">Escolha a cor, tom ou subcategoria para adicionar ao carrinho:</p>
        
        <div class="variations-options-list margin-top-md" id="var-options-container" style="display:flex; flex-direction:column; gap:10px;">
          <!-- Injetado via JS -->
        </div>

        <div class="modal-actions margin-top-lg">
          <button type="button" id="btn-cancel-var-select" class="btn btn-secondary btn-full">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Cadastro Rápido de Cliente -->
    <div id="modal-quick-client" class="modal-overlay">
      <div class="modal-card max-w-md">
        <h3>Cadastro Rápido de Cliente</h3>
        <form id="form-quick-client" class="form-group margin-top-md">
          <label for="quick-name">Nome Completo</label>
          <input type="text" id="quick-name" placeholder="Ex: Juliana Santos" required>
          
          <label for="quick-phone" class="margin-top-sm">Telefone / WhatsApp</label>
          <input type="text" id="quick-phone" placeholder="Ex: (11) 98888-7777" required>

          <label for="quick-birthday" class="margin-top-sm">Data de Nascimento (Aniversário)</label>
          <input type="text" id="quick-birthday" placeholder="DD/MM/AAAA" maxlength="10">
          
          <label for="quick-notes" class="margin-top-sm">Observações / Preferências</label>
          <input type="text" id="quick-notes" placeholder="Ex: Prefere bases claras">

          <div class="modal-actions margin-top-md">
            <button type="button" id="btn-cancel-quick-client" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Alerta Cliente Obrigatório -->
    <div id="modal-client-required-alert" class="modal-overlay">
      <div class="modal-card max-w-sm text-center scale-in">
        <div class="lock-icon-container" style="background-color: var(--danger-bg); border-color: var(--danger-border); margin: 0 auto 16px auto; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <i data-lucide="user-x" class="icon-lg text-danger" style="width: 32px; height: 32px;"></i>
        </div>
        <h3 class="text-lg font-bold">Identificação Obrigatória</h3>
        <p class="text-muted text-sm margin-top-xs">
          O sistema está configurado para exigir a identificação do cliente para finalizar qualquer venda. Por favor, identifique a cliente.
        </p>
        
        <div class="margin-top-md" style="display: flex; flex-direction: column; gap: 8px;">
          <button type="button" id="btn-alert-select-client" class="btn btn-primary btn-full">
            Selecionar Cliente Existente
          </button>
          <button type="button" id="btn-alert-create-client" class="btn btn-secondary btn-full">
            Cadastrar Novo Cliente Rápido
          </button>
        </div>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  setupPDVEvents(cart, currentCategory, searchQuery, products);
}

function renderProductsGrid(products, category, query) {
  const lowerQuery = query.toLowerCase().trim();
  const filtered = products.filter(p => {
    const matchesSearch = !lowerQuery || 
                          p.name.toLowerCase().includes(lowerQuery) || 
                          (p.code && p.code.includes(lowerQuery));
    const matchesCategory = category === 'Todos' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    return `<div class="pdv-empty-grid text-muted">Nenhum produto correspondente encontrado.</div>`;
  }

  return filtered.map(p => {
    const isOut = p.stock <= 0;
    const hasVars = p.variations && p.variations.length > 0;
    
    return `
      <div class="product-card ${isOut ? 'out-of-stock' : ''}" data-id="${p.id}">
        <div class="prod-card-image animate-glow" style="background-color: ${p.color || '#8b5cf6'}15; cursor: pointer;">
          <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none';">
          ${isOut ? '<span class="out-badge">Esgotado</span>' : ''}
        </div>
        <div class="prod-card-body">
          <span class="prod-card-cat">${p.category}</span>
          <h4 class="prod-card-title">${p.name}</h4>
          ${hasVars ? `<span class="text-xs text-purple font-bold">${p.variations.length} cores disponíveis</span>` : ''}
          <div class="prod-card-footer margin-top-xs">
            <span class="prod-card-price">R$ ${p.price.toFixed(2)}</span>
            <button class="btn-add-to-cart btn btn-primary btn-sm" ${isOut ? 'disabled' : ''} data-id="${p.id}">
              <i data-lucide="plus"></i> Add
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupPDVEvents(cart, currentCategory, searchQuery, products) {
  const grid = document.getElementById('pdv-grid');
  const searchInput = document.getElementById('pdv-search-input');
  const chipsContainer = document.getElementById('pdv-category-chips');
  const cartItemsContainer = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const discountInput = document.getElementById('cart-discount');
  const totalEl = document.getElementById('cart-total');
  const btnCheckout = document.getElementById('btn-checkout');
  const btnClearCart = document.getElementById('btn-clear-cart');
  const clientSelect = document.getElementById('client-select');

  // Filtro de Categorias
  chipsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;

    chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');

    currentCategory = btn.getAttribute('data-cat');
    grid.innerHTML = renderProductsGrid(products, currentCategory, searchQuery);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // Busca
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    grid.innerHTML = renderProductsGrid(products, currentCategory, searchQuery);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // Limpar Carrinho
  btnClearCart.addEventListener('click', () => {
    cart.splice(0, cart.length);
    updateCartUI();
  });

  // Clique no Grid: Se for na imagem/corpo, abre Detalhes. Se for no botão "+ Add", adiciona direto.
  grid.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.btn-add-to-cart');
    
    if (addBtn) {
      // Adicionar rápido direto do card
      const id = addBtn.getAttribute('data-id');
      const product = products.find(p => p.id === id);

      if (product && product.stock > 0) {
        if (product.variations && product.variations.length > 0) {
          openVariationSelect(product);
        } else {
          addProductToCart(product);
        }
      }
      return;
    }

    const card = e.target.closest('.product-card');
    if (card) {
      const id = card.getAttribute('data-id');
      const product = products.find(p => p.id === id);
      if (product) {
        openProductDetails(product);
      }
    }
  });

  function openProductDetails(product) {
    const modal = document.getElementById('modal-product-details');
    const content = document.getElementById('detail-prod-content');
    
    const hasVars = product.variations && product.variations.length > 0;

    content.innerHTML = `
      <div class="prod-details-layout" style="display:flex; gap:20px; flex-wrap:wrap; text-align:left;">
        <div class="prod-details-img-container" style="flex: 1 1 200px; display:flex; justify-content:center; align-items:center; background-color:${product.color || '#8b5cf6'}10; border-radius:var(--radius-lg); padding:10px; width:220px; height:240px;">
          <img id="pdv-detail-main-img" src="${hasVars ? (product.variations[0].image || product.image) : product.image}" alt="${product.name}" style="max-width:100%; max-height:220px; object-fit:cover; border-radius:var(--radius-md);" onerror="this.style.display='none';">
        </div>
        
        <div class="prod-details-info-container" style="flex: 1.5 1 250px; display:flex; flex-direction:column; gap:10px;">
          <span class="badge badge-secondary" style="align-self:flex-start;">${product.category}</span>
          <h2 class="text-xl font-bold" style="margin:0;">${product.name}</h2>
          <p class="text-sm text-muted" style="margin:0;">${product.description || 'Nenhuma descrição detalhada disponível.'}</p>
          
          <div style="font-size:18px; margin-top:5px;">
            <strong>Preço:</strong> <span class="text-purple font-bold">R$ ${product.price.toFixed(2)}</span>
          </div>
          
          ${hasVars ? `
            <div>
              <label class="text-xs text-muted font-bold block margin-bottom-xs">Escolha a Cor/Subcategoria:</label>
              <div class="color-swatch-container" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:6px;">
                ${product.variations.map((v, idx) => `
                  <button type="button" class="color-swatch ${idx === 0 ? 'active' : ''} ${v.stock <= 0 ? 'out-of-stock' : ''}" 
                          data-var-id="${v.id}" 
                          title="${v.name} (${v.stock} un)" 
                          style="background-color: ${v.colorCode || '#8b5cf6'}; width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--border-color); cursor: pointer; transition: all 0.2s;"
                          ${v.stock <= 0 ? 'disabled' : ''}>
                  </button>
                `).join('')}
              </div>
              <span id="detail-var-name-display" class="text-xs text-purple font-bold">${product.variations[0].name} (${product.variations[0].stock} un disponíveis)</span>
            </div>
          ` : `
            <div class="text-sm text-muted">
              <strong>Estoque disponível:</strong> ${product.stock} unidades
            </div>
          `}
          
          <div class="flex-row gap-md align-center" style="display:flex; gap:16px; align-items:center; margin-top:10px;">
            <div>
              <label class="text-xs text-muted font-bold block margin-bottom-xs">Quantidade:</label>
              <div class="qty-selector">
                <button type="button" id="btn-detail-qty-minus" class="btn-qty-adj">-</button>
                <span class="qty" id="detail-qty-val">1</span>
                <button type="button" id="btn-detail-qty-plus" class="btn-qty-adj">+</button>
              </div>
            </div>
            
            <button type="button" id="btn-detail-add-cart" class="btn btn-primary" style="flex-grow:1; height:42px; margin-top:18px;" ${product.stock <= 0 ? 'disabled' : ''}>
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    
    let qty = 1;
    let selectedVarId = hasVars ? product.variations[0].id : null;

    const qtyMinus = document.getElementById('btn-detail-qty-minus');
    const qtyPlus = document.getElementById('btn-detail-qty-plus');
    const qtyVal = document.getElementById('detail-qty-val');
    const addBtn = document.getElementById('btn-detail-add-cart');
    const swatches = content.querySelectorAll('.color-swatch');
    const varNameDisplay = document.getElementById('detail-var-name-display');
    const mainImg = document.getElementById('pdv-detail-main-img');

    // Listener para as cores (swatches)
    swatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');

        selectedVarId = swatch.getAttribute('data-var-id');
        const variation = product.variations.find(v => v.id === selectedVarId);
        
        if (variation) {
          if (varNameDisplay) varNameDisplay.textContent = `${variation.name} (${variation.stock} un disponíveis)`;
          
          // Troca de imagem dinâmica no popup!
          if (mainImg) {
            mainImg.src = variation.image || product.image;
          }

          qty = 1;
          qtyVal.textContent = qty;
        }
      });
    });

    qtyMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      if (qty > 1) {
        qty--;
        qtyVal.textContent = qty;
      }
    });

    qtyPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      let maxLimit = product.stock;
      if (hasVars && selectedVarId) {
        const selectedVar = product.variations.find(v => v.id === selectedVarId);
        if (selectedVar) maxLimit = selectedVar.stock;
      }
      if (qty < maxLimit) {
        qty++;
        qtyVal.textContent = qty;
      } else {
        showNotification('Limite de estoque atingido!', 'warning');
      }
    });

    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const variation = selectedVarId ? product.variations.find(v => v.id === selectedVarId) : null;
      addProductToCartWithQty(product, variation, qty);
      modal.classList.remove('active');
    });
  }

  function addProductToCartWithQty(product, variation = null, qty = 1) {
    const cartKey = variation ? `${product.id}_${variation.id}` : product.id;
    const name = variation ? `${product.name} - ${variation.name}` : product.name;
    const maxStock = variation ? variation.stock : product.stock;
    const variationId = variation ? variation.id : null;
    const finalPrice = (variation && variation.price !== undefined && variation.price !== null) ? variation.price : product.price;

    const existing = cart.find(item => item.cartKey === cartKey);
    if (existing) {
      if (existing.quantity + qty <= maxStock) {
        existing.quantity += qty;
        showNotification(`${qty}x ${name} adicionados!`, 'success');
      } else {
        existing.quantity = maxStock;
        showNotification(`Adicionado limite máximo em estoque!`, 'warning');
      }
    } else {
      cart.push({
        id: product.id,
        variationId: variationId,
        cartKey: cartKey,
        name: name,
        price: finalPrice,
        quantity: qty,
        maxStock: maxStock
      });
      showNotification(`${qty}x ${name} adicionados!`, 'success');
    }
    updateCartUI();
  }

  document.getElementById('btn-close-detail').addEventListener('click', () => {
    document.getElementById('modal-product-details').classList.remove('active');
  });

  function openVariationSelect(product) {
    const modal = document.getElementById('modal-variation-select');
    const container = document.getElementById('var-options-container');

    container.innerHTML = product.variations.map(v => {
      const isOut = v.stock <= 0;
      return `
        <div class="variation-option-row" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(139,92,246,0.1); padding-bottom:8px;">
          <div>
            <strong>${v.name}</strong>
            <br><span class="text-xs text-muted">Estoque: ${v.stock} un</span>
          </div>
          <button class="btn btn-primary btn-sm btn-pick-var" ${isOut ? 'disabled' : ''} data-var-id="${v.id}">
            Selecionar
          </button>
        </div>
      `;
    }).join('');

    modal.classList.add('active');

    container.querySelectorAll('.btn-pick-var').forEach(btn => {
      btn.addEventListener('click', () => {
        const varId = btn.getAttribute('data-var-id');
        const variation = product.variations.find(v => v.id === varId);
        if (variation) {
          addProductToCart(product, variation);
          modal.classList.remove('active');
        }
      });
    });
  }

  document.getElementById('btn-cancel-var-select').addEventListener('click', () => {
    document.getElementById('modal-variation-select').classList.remove('active');
  });

  function addProductToCart(product, variation = null) {
    const cartKey = variation ? `${product.id}_${variation.id}` : product.id;
    const name = variation ? `${product.name} - ${variation.name}` : product.name;
    const maxStock = variation ? variation.stock : product.stock;
    const variationId = variation ? variation.id : null;
    const finalPrice = (variation && variation.price !== undefined && variation.price !== null) ? variation.price : product.price;

    const existing = cart.find(item => item.cartKey === cartKey);
    if (existing) {
      if (existing.quantity < maxStock) {
        existing.quantity++;
      } else {
        showNotification('Quantidade máxima em estoque atingida!', 'warning');
      }
    } else {
      cart.push({
        id: product.id,
        variationId: variationId,
        cartKey: cartKey,
        name: name,
        price: finalPrice,
        quantity: 1,
        maxStock: maxStock
      });
    }
    updateCartUI();
  }

  // Gerenciamento de itens do carrinho (Alterar Qtd/Deletar)
  cartItemsContainer.addEventListener('click', (e) => {
    const btnPlus = e.target.closest('.btn-cart-plus');
    const btnMinus = e.target.closest('.btn-cart-minus');
    const btnDelete = e.target.closest('.btn-cart-delete');

    if (btnPlus) {
      const key = btnPlus.getAttribute('data-key');
      const item = cart.find(i => i.cartKey === key);
      if (item && item.quantity < item.maxStock) {
        item.quantity++;
        updateCartUI();
      } else {
        showNotification('Estoque insuficiente!', 'warning');
      }
    }

    if (btnMinus) {
      const key = btnMinus.getAttribute('data-key');
      const item = cart.find(i => i.cartKey === key);
      if (item) {
        if (item.quantity > 1) {
          item.quantity--;
        } else {
          const index = cart.findIndex(i => i.cartKey === key);
          if (index !== -1) cart.splice(index, 1);
        }
        updateCartUI();
      }
    }

    if (btnDelete) {
      const key = btnDelete.getAttribute('data-key');
      const index = cart.findIndex(i => i.cartKey === key);
      if (index !== -1) cart.splice(index, 1);
      updateCartUI();
    }
  });

  // Desconto
  discountInput.addEventListener('input', () => {
    updateCartTotals();
  });

  function updateCartUI() {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <i data-lucide="shopping-cart"></i>
          <p>Carrinho Vazio</p>
        </div>
      `;
      btnCheckout.disabled = true;
    } else {
      cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-info">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">R$ ${item.price.toFixed(2)}</span>
          </div>
          <div class="cart-item-actions">
            <div class="qty-selector">
              <button class="btn-cart-minus" data-key="${item.cartKey}">-</button>
              <span class="qty">${item.quantity}</span>
              <button class="btn-cart-plus" data-key="${item.cartKey}">+</button>
            </div>
            <button class="btn-cart-delete text-danger" data-key="${item.cartKey}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `).join('');
      btnCheckout.disabled = false;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateCartTotals();
  }

  let cartSubtotal = 0;
  let cartTotal = 0;
  let cartDiscount = 0;

  function updateCartTotals() {
    cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartDiscount = parseFloat(discountInput.value) || 0;
    
    if (cartDiscount < 0) cartDiscount = 0;
    if (cartDiscount > cartSubtotal) cartDiscount = cartSubtotal;

    cartTotal = Math.max(0, cartSubtotal - cartDiscount);

    subtotalEl.textContent = `R$ ${cartSubtotal.toFixed(2)}`;
    totalEl.textContent = `R$ ${cartTotal.toFixed(2)}`;
  }

  // --- CADASTRO RÁPIDO DE CLIENTE ---
  const modalQuickClient = document.getElementById('modal-quick-client');
  const formQuickClient = document.getElementById('form-quick-client');

  const quickBdayInput = document.getElementById('quick-birthday');
  if (quickBdayInput) {
    quickBdayInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 8) value = value.slice(0, 8);
      if (value.length > 4) {
        value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
      } else if (value.length > 2) {
        value = `${value.slice(0, 2)}/${value.slice(2)}`;
      }
      e.target.value = value;
    });
  }

  document.getElementById('btn-quick-add-client').addEventListener('click', () => {
    formQuickClient.reset();
    modalQuickClient.classList.add('active');
  });

  document.getElementById('btn-cancel-quick-client').addEventListener('click', () => {
    modalQuickClient.classList.remove('active');
  });

  let isSavingClient = false;
  formQuickClient.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isSavingClient) return;
    isSavingClient = true;

    const saveBtn = formQuickClient.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.disabled = true;

    try {
      const name = document.getElementById('quick-name').value;
      const phone = document.getElementById('quick-phone').value;
      const notes = document.getElementById('quick-notes').value;
      
      const birthdayRaw = document.getElementById('quick-birthday').value.trim();
      let birthday = '';
      if (birthdayRaw) {
        const parts = birthdayRaw.split('/');
        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
          birthday = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          showNotification('Data de nascimento inválida! Use o formato DD/MM/AAAA ou deixe em branco.', 'error');
          isSavingClient = false;
          if (saveBtn) saveBtn.disabled = false;
          return;
        }
      }

      const newClient = addClient({ name, phone, notes, birthday, debt: 0 });
      showNotification('Cliente cadastrado com sucesso!', 'success');
      modalQuickClient.classList.remove('active');

      // Recarrega dropdown de clientes
      const updatedClients = getClients();
      clientSelect.innerHTML = `
        <option value="">-- Consumidor Geral --</option>
        ${updatedClients.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('')}
      `;
      clientSelect.value = newClient.id;
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      isSavingClient = false;
      if (saveBtn) saveBtn.disabled = false;
    }
  });

    // --- ALERTA CLIENTE OBRIGATÓRIO AÇÕES ---
    const alertModalEl = document.getElementById('modal-client-required-alert');
    
    document.getElementById('btn-alert-select-client').addEventListener('click', () => {
      alertModalEl.classList.remove('active');
      clientSelect.focus();
    });

    document.getElementById('btn-alert-create-client').addEventListener('click', () => {
      alertModalEl.classList.remove('active');
      formQuickClient.reset();
      modalQuickClient.classList.add('active');
    });

  // --- CHECKOUT ---
  const modalCheckout = document.getElementById('modal-checkout');
  const checkoutTotalBanner = document.getElementById('checkout-total-val');
  
  const inputMoney = document.getElementById('split-money');
  const inputPix = document.getElementById('split-pix');
  const inputCredit = document.getElementById('split-credit');
  const inputDebit = document.getElementById('split-debit');
  const inputFiado = document.getElementById('split-fiado');
  const splitInputs = [inputMoney, inputPix, inputCredit, inputDebit, inputFiado];
  
  const labelInformed = document.getElementById('split-total-informed');
  const labelRemaining = document.getElementById('split-remaining');
  const labelChange = document.getElementById('split-change');
  const containerRemaining = document.getElementById('split-remaining-container');
  const containerChange = document.getElementById('split-change-container');
  const warningFiado = document.getElementById('fiado-client-warning');
  const btnConfirmSale = document.getElementById('btn-confirm-sale');

  function getSplitValues() {
    return {
      money: parseFloat(inputMoney.value) || 0,
      pix: parseFloat(inputPix.value) || 0,
      credit: parseFloat(inputCredit.value) || 0,
      debit: parseFloat(inputDebit.value) || 0,
      fiado: parseFloat(inputFiado.value) || 0
    };
  }

  function updateSplitCalculations() {
    const vals = getSplitValues();
    const totalInformed = vals.money + vals.pix + vals.credit + vals.debit + vals.fiado;
    const remaining = cartTotal - totalInformed;
    
    labelInformed.textContent = `R$ ${totalInformed.toFixed(2)}`;
    
    let canConfirm = true;

    if (remaining > 0) {
      containerRemaining.style.display = 'flex';
      containerChange.style.display = 'none';
      labelRemaining.textContent = `R$ ${remaining.toFixed(2)}`;
      canConfirm = false;
    } else {
      containerRemaining.style.display = 'none';
      containerChange.style.display = 'flex';
      const change = Math.abs(remaining);
      labelChange.textContent = `R$ ${change.toFixed(2)}`;
    }

    const clientId = clientSelect.value;
    if (vals.fiado > 0 && !clientId) {
      warningFiado.classList.remove('hidden');
      canConfirm = false;
    } else {
      warningFiado.classList.add('hidden');
    }

    btnConfirmSale.disabled = !canConfirm;
  }

  let activePaymentInput = null;

  splitInputs.forEach(input => {
    input.addEventListener('input', updateSplitCalculations);
    input.addEventListener('focus', () => {
      activePaymentInput = input;
    });
  });

  // Lógica do Teclado Numérico Virtual
  document.querySelectorAll('.numpad-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (!activePaymentInput) {
        activePaymentInput = inputMoney;
      }
      
      const val = btn.getAttribute('data-val');
      let currentStr = activePaymentInput.value || '';
      
      if (val === 'C') {
        currentStr = '';
      } else if (val === 'backspace') {
        currentStr = currentStr.slice(0, -1);
      } else if (val === 'exact') {
        const vals = getSplitValues();
        const activeId = activePaymentInput.id.replace('split-', '');
        vals[activeId] = 0;
        const sumOutros = Object.values(vals).reduce((a, b) => a + b, 0);
        const restante = Math.max(0, cartTotal - sumOutros);
        currentStr = restante.toFixed(2);
      } else {
        if (currentStr === '0' || currentStr === '0.00') currentStr = '';
        currentStr += val;
      }
      
      activePaymentInput.value = currentStr;
      activePaymentInput.dispatchEvent(new Event('input'));
    });
  });

  btnCheckout.addEventListener('click', () => {
    // Verificar obrigatoriedade de cliente
    const currentConfig = getConfig();
    const clientId = clientSelect.value;
    
    if (currentConfig.requireClientCheckout && !clientId) {
      const alertModal = document.getElementById('modal-client-required-alert');
      alertModal.classList.add('active');
      return;
    }

    checkoutTotalBanner.textContent = `R$ ${cartTotal.toFixed(2)}`;
    
    inputMoney.value = cartTotal.toFixed(2);
    inputPix.value = '';
    inputCredit.value = '';
    inputDebit.value = '';
    inputFiado.value = '';
    
    updateSplitCalculations();
    modalCheckout.classList.add('active');
  });

  document.getElementById('btn-cancel-checkout').addEventListener('click', () => {
    modalCheckout.classList.remove('active');
  });

  // Confirmação de Venda
  let isConfirmingSale = false;
  btnConfirmSale.addEventListener('click', () => {
    if (isConfirmingSale) return;

    // Verificar se o caixa está aberto antes de fazer qualquer alteração no estoque/db
    const currentSession = getCurrentCashSession();
    if (!currentSession) {
      showNotification('Operação negada: O caixa deve estar aberto para realizar vendas!', 'error');
      return;
    }

    const clientId = clientSelect.value;
    const client = clientId ? getClients().find(c => c.id === clientId) : null;
    const clientName = client ? client.name : null;
    
    const vals = getSplitValues();
    const totalInformed = vals.money + vals.pix + vals.credit + vals.debit + vals.fiado;

    if (totalInformed < cartTotal) {
      showNotification('Valor pago é insuficiente!', 'error');
      return;
    }

    if (vals.fiado > 0 && !clientId) {
      showNotification('Venda no fiado exige a seleção de um cliente cadastrado!', 'error');
      return;
    }

    isConfirmingSale = true;
    btnConfirmSale.disabled = true;

    // Se o valor informado for maior (troco), o troco sai do dinheiro recebido.
    // Ex: Total 100. Dinheiro 120. Pagamento real em dinheiro = 100. Troco = 20.
    let finalMoneyPaid = vals.money;
    if (totalInformed > cartTotal) {
      const change = totalInformed - cartTotal;
      finalMoneyPaid = Math.max(0, vals.money - change); // Reduz o troco do dinheiro
    }

    const payments = {
      money: finalMoneyPaid,
      pix: vals.pix,
      credit: vals.credit,
      debit: vals.debit,
      fiado: vals.fiado
    };

    const saleData = {
      items: cart.map(i => ({
        id: i.id,
        variationId: i.variationId,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      subtotal: cartSubtotal,
      discount: cartDiscount,
      total: cartTotal,
      clientId: clientId || null,
      clientName: clientName || null,
      payments: payments, // Objeto de pagamentos múltiplos
      amountPaid: totalInformed,
      operator: currentSession.operator || 'Operador Purple'
    };

    try {
      const completedSale = addSale(saleData);
      
      const shortId = completedSale.id.split('_')[1];
      if (payments.money > 0) addCashTransaction('venda', payments.money, `Venda #${shortId} (Dinheiro)`);
      if (payments.pix > 0) addCashTransaction('venda', payments.pix, `Venda #${shortId} (Pix)`);
      if (payments.credit > 0) addCashTransaction('venda', payments.credit, `Venda #${shortId} (Crédito)`);
      if (payments.debit > 0) addCashTransaction('venda', payments.debit, `Venda #${shortId} (Débito)`);
      if (payments.fiado > 0) addCashTransaction('venda', 0, `Venda #${shortId} (Fiado: R$ ${payments.fiado.toFixed(2)}) para ${clientName}`);
      
      showNotification('Venda realizada com sucesso!', 'success');
      modalCheckout.classList.remove('active');
      
      showReceipt(completedSale);

      cart.splice(0, cart.length);
      clientSelect.value = '';
      discountInput.value = '0.00';
      
      // Recarregar grid
      const freshProducts = getProducts();
      grid.innerHTML = renderProductsGrid(freshProducts, currentCategory, searchQuery);
      if (typeof lucide !== 'undefined') lucide.createIcons();
      
      updateCartUI();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      isConfirmingSale = false;
      btnConfirmSale.disabled = false;
    }
  });
}

function translatePayment(method) {
  const methods = {
    'money': 'Dinheiro',
    'credit': 'C. Crédito',
    'debit': 'C. Débito',
    'pix': 'Pix',
    'fiado': 'Fiado'
  };
  return methods[method] || method;
}

function showNotification(msg, type) {
  const container = document.getElementById('notifications-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
