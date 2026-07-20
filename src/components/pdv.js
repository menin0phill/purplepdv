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

    <!-- Modal de Checkout / Pagamento -->
    <div id="modal-checkout" class="modal-overlay">
      <div class="modal-card max-w-lg">
        <h3>Finalizar Pagamento</h3>
        <p class="text-muted text-sm">Selecione o método de pagamento e confirme a venda.</p>
        
        <div class="checkout-total-banner margin-top-sm">
          <span>Valor a Pagar</span>
          <h2 id="checkout-total-val">R$ 0,00</h2>
        </div>

        <div class="payment-methods-grid margin-top-md">
          <button class="payment-btn active" data-method="money">
            <i data-lucide="banknote"></i> Dinheiro
          </button>
          <button class="payment-btn" data-method="pix">
            <i data-lucide="qr-code"></i> Pix
          </button>
          <button class="payment-btn" data-method="credit">
            <i data-lucide="credit-card"></i> C. Crédito
          </button>
          <button class="payment-btn" data-method="debit">
            <i data-lucide="credit-card"></i> C. Débito
          </button>
          <button class="payment-btn" data-method="fiado">
            <i data-lucide="user-minus"></i> Fiado
          </button>
        </div>

        <!-- Dinheiro -->
        <div class="payment-details-container margin-top-md" id="payment-details-money">
          <div class="form-group">
            <label for="payment-cash-received">Valor Recebido (R$)</label>
            <input type="number" id="payment-cash-received" placeholder="0,00" step="0.01" class="input-lg">
          </div>
          <div class="change-banner margin-top-sm">
            <span>Troco a devolver:</span>
            <strong id="payment-change-val">R$ 0,00</strong>
          </div>
        </div>

        <!-- Pix -->
        <div class="payment-details-container margin-top-md hidden" id="payment-details-pix">
          <div class="pix-qr-container">
            <div class="qr-mock">
              <svg viewBox="0 0 100 100" class="qr-svg">
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="currentColor" stroke-width="2"/>
                <rect x="10" y="10" width="20" height="20" fill="currentColor"/>
                <rect x="70" y="10" width="20" height="20" fill="currentColor"/>
                <rect x="10" y="70" width="20" height="20" fill="currentColor"/>
                <rect x="40" y="40" width="20" height="20" fill="currentColor"/>
                <rect x="45" y="15" width="10" height="10" fill="currentColor"/>
                <rect x="15" y="45" width="10" height="10" fill="currentColor"/>
                <rect x="75" y="45" width="10" height="10" fill="currentColor"/>
                <rect x="45" y="75" width="10" height="10" fill="currentColor"/>
              </svg>
            </div>
            <p class="text-xs text-muted margin-top-xs text-center">Pix Copia e Cola / QR Code simulado para o PDV</p>
          </div>
        </div>

        <!-- Cartões -->
        <div class="payment-details-container margin-top-md hidden" id="payment-details-card">
          <div class="card-status-mock">
            <i data-lucide="smartphone" class="icon-lg text-purple animate-pulse"></i>
            <p class="margin-top-xs">Aguardando inserção ou aproximação do cartão na SmartPOS...</p>
            <span class="text-xs text-muted">Aprovado pelo TEF integrado</span>
          </div>
        </div>

        <!-- Fiado (Contas) -->
        <div class="payment-details-container margin-top-md hidden" id="payment-details-fiado">
          <div class="fiado-status-box">
            <p class="text-sm" id="fiado-client-check-label">Validando cliente...</p>
          </div>
        </div>

        <div class="modal-actions margin-top-lg">
          <button type="button" id="btn-cancel-checkout" class="btn btn-secondary">Voltar</button>
          <button type="button" id="btn-confirm-sale" class="btn btn-primary">Confirmar e Imprimir</button>
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
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(query.toLowerCase()) || p.code.includes(query);
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
        price: product.price,
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
        price: product.price,
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
  const paymentButtons = document.querySelectorAll('.payment-btn');
  const detailsMoney = document.getElementById('payment-details-money');
  const detailsPix = document.getElementById('payment-details-pix');
  const detailsCard = document.getElementById('payment-details-card');
  const detailsFiado = document.getElementById('payment-details-fiado');
  const fiadoLabel = document.getElementById('fiado-client-check-label');
  const inputCashReceived = document.getElementById('payment-cash-received');
  const changeValEl = document.getElementById('payment-change-val');
  let selectedMethod = 'money';

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
    inputCashReceived.value = cartTotal.toFixed(2);
    changeValEl.textContent = 'R$ 0,00';
    selectedMethod = 'money';
    
    paymentButtons.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-method="money"]').classList.add('active');

    detailsMoney.classList.remove('hidden');
    detailsPix.classList.add('hidden');
    detailsCard.classList.add('hidden');
    detailsFiado.classList.add('hidden');

    modalCheckout.classList.add('active');
  });

  document.getElementById('btn-cancel-checkout').addEventListener('click', () => {
    modalCheckout.classList.remove('active');
  });

  paymentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      paymentButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMethod = btn.getAttribute('data-method');

      detailsMoney.classList.add('hidden');
      detailsPix.classList.add('hidden');
      detailsCard.classList.add('hidden');
      detailsFiado.classList.add('hidden');

      if (selectedMethod === 'money') {
        detailsMoney.classList.remove('hidden');
        inputCashReceived.value = cartTotal.toFixed(2);
        changeValEl.textContent = 'R$ 0,00';
      } else if (selectedMethod === 'pix') {
        detailsPix.classList.remove('hidden');
      } else if (selectedMethod === 'fiado') {
        detailsFiado.classList.remove('hidden');
        const clientId = clientSelect.value;
        if (!clientId) {
          fiadoLabel.textContent = 'ERRO: Venda Fiada requer um cliente selecionado!';
          fiadoLabel.className = 'text-xs text-danger font-bold margin-top-xs';
        } else {
          const client = getClients().find(c => c.id === clientId);
          fiadoLabel.textContent = `Venda será cobrada na conta de: ${client.name}`;
          fiadoLabel.className = 'text-xs text-success font-bold margin-top-xs';
        }
      } else {
        detailsCard.classList.remove('hidden');
      }
    });
  });

  inputCashReceived.addEventListener('input', () => {
    const received = parseFloat(inputCashReceived.value) || 0;
    const change = Math.max(0, received - cartTotal);
    changeValEl.textContent = `R$ ${change.toFixed(2)}`;
  });

  // Confirmação de Venda
  let isConfirmingSale = false;
  document.getElementById('btn-confirm-sale').addEventListener('click', () => {
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
    
    const amountPaid = selectedMethod === 'money' ? parseFloat(inputCashReceived.value) : cartTotal;

    if (selectedMethod === 'money' && amountPaid < cartTotal) {
      showNotification('Valor pago é insuficiente!', 'error');
      return;
    }

    if (selectedMethod === 'fiado' && !clientId) {
      showNotification('Venda no fiado exige a seleção de um cliente cadastrado!', 'error');
      return;
    }

    isConfirmingSale = true;
    const confirmBtn = document.getElementById('btn-confirm-sale');
    if (confirmBtn) confirmBtn.disabled = true;

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
      paymentMethod: selectedMethod,
      amountPaid: selectedMethod === 'fiado' ? 0 : amountPaid,
      operator: currentSession.operator || 'Operador Purple'
    };

    try {
      const completedSale = addSale(saleData);
      
      if (selectedMethod === 'fiado') {
        addCashTransaction('venda', 0, `Venda Fiada #${completedSale.id.split('_')[1]} para ${clientName} (A Receber: R$ ${cartTotal.toFixed(2)})`);
      } else {
        addCashTransaction('venda', cartTotal, `Venda #${completedSale.id.split('_')[1]} finalizada via ${translatePayment(selectedMethod)}`);
      }
      
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
      if (confirmBtn) confirmBtn.disabled = false;
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
