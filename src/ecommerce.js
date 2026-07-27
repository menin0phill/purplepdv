import './style.css';
import { getProducts, addSale, getClients, addClient, getSales, getConfig, syncWithSupabase, sanitizeHTML } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app-ecommerce');
  const cart = [];
  let products = getProducts();
  let selectedCategory = 'Todos';
  let discountPercentage = 0; // Desconto de aniversário (10% = 0.10)
  let selectedShippingPrice = 0;

  function normalizeStr(str) {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }
  let selectedShippingCarrier = '';
  let calculatedCep = '';
  let selectedDeliveryMode = 'delivery'; // 'delivery' ou 'pickup'
  
  // Carrossel de Brindes
  let currentCarouselIndex = 0;
  let carouselInterval = null;
  const giftOffers = [
    { minPrice: '49,99', reward: 'MÁSCARA FACIAL', image: '/gift-mask.png' },
    { minPrice: '149,99', reward: 'ESPONJA DE PÓ', image: '/gift-puff.png' },
    { minPrice: '249,99', reward: 'MANTEIGA DE CACAU', image: '/gift-butter.png' },
    { minPrice: '349,99', reward: 'ESPONJA DE MAQUIAGEM', image: '/gift-sponge.png' },
    { minPrice: '449,99', reward: 'KIT DE MINI PINCÉIS', image: '/gift-brushes.png' },
    { minPrice: '549,99', reward: 'UMA BOX MISTERIOSA COM 5 PRODUTOS', image: '/gift-box.png' }
  ];
  
  // Estado de login do cliente
  let loggedClient = JSON.parse(sessionStorage.getItem('purple_ecom_logged_in_client')) || null;
  let favorites = JSON.parse(localStorage.getItem('purple_ecom_favorites')) || [];
  let searchQuery = '';

  // Renderiza layout base do E-commerce
  function renderLayout() {
    appContainer.innerHTML = `
      <div class="ecom-layout">
        <!-- Navbar Pública -->
        <header class="ecom-navbar" style="background: white; border-bottom: 1px solid #eaeaea; color: #000; padding: 15px 30px; display: flex; flex-direction: column; gap: 15px; align-items: center; position: relative; z-index: 10; height: auto !important; min-height: 100px !important;">
          <!-- Top Row: Logo in the center, icons on the right -->
          <div style="width: 100%; display: flex; justify-content: flex-end; align-items: center; position: relative;">
            
            <div class="ecom-logo-container" style="cursor: pointer; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);" onclick="window.scrollTo({ top: 0, behavior: 'smooth' });">
              <img src="/logo-purple-text.png" alt="Purple Logo" style="height: 50px; display: block; filter: none;">
            </div>
            
            <div class="ecom-nav-right gap-sm" style="display: flex; align-items: center; gap: 15px; position: relative; z-index: 5;">
              <!-- Barra de Pesquisa Expansível -->
              <div class="ecom-search-container" style="position: relative; display: flex; align-items: center; background: rgba(0,0,0,0.05); padding: 4px 10px; border-radius: 20px; transition: all 0.3s ease;">
                <input type="text" id="ecom-search-input" placeholder="Buscar produto, preço, tag..." style="width: 0px; opacity: 0; padding: 0; border: none; outline: none; font-family: 'Outfit', sans-serif; font-size: 13px; background: transparent; color: #111; transition: all 0.3s ease;">
                <button id="btn-ecom-search-trigger" class="btn-icon" style="color: #333; background:none; border:none; padding:4px; cursor: pointer; display: flex; align-items: center;" title="Buscar"><i data-lucide="search" style="width: 18px; height: 18px;"></i></button>
              </div>

              <!-- Botão de Favoritos com Badge -->
              <button id="btn-ecom-favorites" class="btn-icon" style="color: #333; background:none; border:none; padding:4px; position: relative; cursor: pointer; display: flex; align-items: center;" title="Favoritos">
                <i data-lucide="heart" style="width: 18px; height: 18px;"></i>
                <span id="ecom-favorites-badge" class="badge" style="position: absolute; top: -5px; right: -5px; background: #6a3f97; color: white; border-radius: 50%; width: 15px; height: 15px; font-size: 9px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid white; display: none;">0</span>
              </button>

              <div id="ecom-auth-status" style="display: flex; align-items: center;">
                ${renderAuthStatusHTML()}
              </div>
              <button id="btn-ecom-cart" class="btn btn-secondary" style="background: #6a3f97; color: white; border: none; padding: 8px 16px; display: flex; align-items: center; gap: 6px; border-radius: 20px; font-weight: 500;">
                <i data-lucide="shopping-cart" style="width: 16px; height: 16px;"></i> <span class="ecom-cart-text">Carrinho</span> <span class="cart-badge" id="ecom-cart-badge">${cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </button>
            </div>
          </div>
          
          <!-- Bottom Row: Navigation menu -->
          <nav class="ecom-menu" style="display: flex !important; gap: 30px !important; justify-content: center !important; align-items: center !important; width: 100% !important; font-size: 14px; font-weight: 500; margin: 0 auto !important; padding: 0 !important; border: none !important; background: none !important;">
            <a href="#" class="ecom-menu-link active" data-category="all" style="color: #6a3f97; text-decoration: none; border-bottom: 2px solid #6a3f97; padding-bottom: 5px;">Ofertas</a>
            <a href="#" class="ecom-menu-link" data-category="MAQUIAGEM" style="color: #555; text-decoration: none; padding-bottom: 5px; transition: color 0.2s;">Maquiagem</a>
            <a href="#" class="ecom-menu-link" data-category="SKINCARE" style="color: #555; text-decoration: none; padding-bottom: 5px; transition: color 0.2s;">Skincare</a>
            <a href="#" class="ecom-menu-link" data-category="CABELO" style="color: #555; text-decoration: none; padding-bottom: 5px; transition: color 0.2s;">Cabelo</a>
            <a href="#" class="ecom-menu-link" data-category="CORPO" style="color: #555; text-decoration: none; padding-bottom: 5px; transition: color 0.2s;">Corpo</a>
            <a href="#" class="ecom-menu-link" data-category="ACESSORIOS" style="color: #555; text-decoration: none; padding-bottom: 5px; transition: color 0.2s;">Acessórios</a>
          </nav>
        </header>

        <!-- Banner de Hero -->
        <section class="ecom-hero">
          <!-- Centered Content Wrapper -->
          <div class="ecom-hero-wrapper">
            <!-- Left text -->
            <div class="ecom-hero-text-side">
              <h2 class="ecom-hero-title">
                <span class="title-sub">CONDIÇÕES</span>
                <span class="title-main">ESPECIAIS</span>
              </h2>
              <div class="ecom-hero-subtitle-badge">
                Conecte-se com sua melhor versão e realce a beleza que existe em você.
              </div>
            </div>
            
            <!-- Right carousel container -->
            <div class="ecom-hero-carousel-side">
              <button class="carousel-arrow prev-arrow" id="btn-carousel-prev" style="background:none; border:none; color:white; font-size:3rem; cursor:pointer; padding:15px; z-index:10; font-family:monospace; font-weight:bold;">&lt;</button>
              <div class="carousel-container" style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 480px; user-select: none;">
                <div class="carousel-track" id="carousel-track" style="position: relative; width: 660px; height: 450px; display: flex; align-items: center; justify-content: center;">
                  <!-- Injetado dinamicamente via javascript -->
                </div>
              </div>
              <button class="carousel-arrow next-arrow" id="btn-carousel-next" style="background:none; border:none; color:white; font-size:3rem; cursor:pointer; padding:15px; z-index:10; font-family:monospace; font-weight:bold;">&gt;</button>
            </div>
          </div>

          <!-- Botão Compre agora centralizado na parte inferior do hero banner -->
          <div style="position: absolute; bottom: 35px; left: 50%; transform: translateX(-50%); z-index: 10;">
            <button id="btn-hero-buy-now" class="btn" style="background: white; color: #6a3f97; border: none; padding: 16px 55px; font-size: 16px; font-weight: 800; border-radius: 35px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.15); font-family:'Outfit', sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">
              Compre agora
            </button>
          </div>
        </section>

        <!-- Vitrine e Filtros -->
        <main class="ecom-main" style="padding: 40px 80px; background: #ffffff !important; color: #111111 !important;">

          <div class="ecom-products-grid" id="ecom-products-grid">
            <!-- Produtos injetados dinamicamente -->
          </div>
        </main>

        <!-- Rodapé -->
        <footer class="ecom-footer" style="padding: 30px 16px; background: #ffffff !important; border-top: 1px solid #eaeaea; color: #333333 !important;">
          <div class="ecom-footer-top" style="text-align: center; margin-bottom: 12px;">
            <img src="/logo-purple-text.png" alt="Purple Logo" style="height: 50px; display: block; margin: 0 auto; filter: none;">
            <h3 style="font-size:14px; margin-top:8px; color: #111111 !important;">56.926.739 MARIA EDUARDA LANA DA COSTA</h3>
            <p class="text-sm text-purple font-bold" style="color: #6a3f97 !important;">Purple Cosméticos - Beleza que Inspira</p>
            <p class="text-xs text-muted" style="margin-top: 6px; line-height: 1.5; font-size:11px; color: #555555 !important;">
              CNPJ: 56.926.739/0001-83 | IE: 150.561.424.113<br>
              Rua Jequirituba, 600 - Jardim Colonial - São Paulo/SP - CEP: 04821-035<br>
              E-mail: purplemakeup.contato@gmail.com | Tel: (11) 94903-2024
            </p>
          </div>
          <div class="receipt-divider" style="border-top: 1px dashed #eaeaea; margin: 15px 0;"></div>
          <p class="text-xs text-muted text-center" style="font-size:10px; color: #777777 !important;">© 2026 Purple Cosméticos. Todos os direitos reservados. E-Commerce Oficial.</p>
        </footer>

        <!-- Gaveta Lateral do Carrinho (Drawer) -->
        <div id="ecom-cart-drawer" class="ecom-drawer">
          <div class="ecom-drawer-card">
            <div class="ecom-drawer-header">
              <h3>Sua Sacola</h3>
              <button id="btn-close-ecom-cart" class="btn-icon"><i data-lucide="x"></i></button>
            </div>

            <div class="ecom-drawer-body" id="ecom-drawer-items">
              <!-- Itens do Carrinho -->
            </div>

            <div class="ecom-drawer-footer" id="ecom-drawer-footer">
              <!-- Formulário de checkout e total -->
            </div>
          </div>
        </div>

        <!-- Gaveta Lateral de Favoritos (Drawer) -->
        <div id="ecom-favorites-drawer" class="ecom-drawer">
          <div class="ecom-drawer-card">
            <div class="ecom-drawer-header">
              <h3 style="display:flex; align-items:center; gap:8px;"><i data-lucide="heart" style="fill:white;"></i> Meus Favoritos</h3>
              <button id="btn-close-ecom-favorites" class="btn-icon"><i data-lucide="x"></i></button>
            </div>

            <div class="ecom-drawer-body" id="ecom-favorites-items">
              <!-- Itens de Favoritos -->
            </div>
          </div>
        </div>

        <!-- Modal Detalhes do Produto (E-Commerce) -->
        <div id="modal-ecom-product-details" class="modal-overlay">
          <div class="modal-card max-w-lg">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
              <h3>Detalhes do Produto</h3>
              <button id="btn-close-ecom-detail" class="btn-icon" title="Fechar"><i data-lucide="x"></i></button>
            </div>
            <div class="margin-top-md" id="ecom-detail-prod-content">
              <!-- Injetado dinamicamente via JS -->
            </div>
          </div>
        </div>

        <!-- Modal de Seleção de Variação Rápida (E-Commerce) -->
        <div id="modal-ecom-variation-select" class="modal-overlay">
          <div class="modal-card max-w-sm">
            <h3 id="ecom-var-title">Escolha sua Cor/Tom</h3>
            <p class="text-muted text-sm margin-top-xs">Selecione a variação para adicionar à sacola:</p>
            
            <div class="variations-options-list margin-top-md" id="ecom-var-options-container" style="display:flex; flex-direction:column; gap:10px;">
              <!-- Injetado via JS -->
            </div>

            <div class="modal-actions margin-top-lg">
              <button type="button" id="btn-cancel-ecom-var" class="btn btn-secondary btn-full">Cancelar</button>
            </div>
          </div>
        </div>

        <!-- Modal de Login / Cadastro de Cliente (Interface Clara Baseada na Imagem) -->
        <div id="modal-auth" class="modal-overlay">
          <div class="auth-light-card scale-in">
            <!-- Badge de Avatar Redondo Sobreposto -->
            <div class="auth-avatar-badge">
              <i data-lucide="user"></i>
            </div>
            
            <!-- Botão Fechar -->
            <button type="button" id="btn-cancel-auth" class="auth-close-btn">&times;</button>
            
            <!-- Container de Login -->
            <div id="auth-login-container">
              <h3 class="auth-card-title">Bem vindo de volta</h3>
              
              <form id="form-ecom-login" class="auth-light-form">
                <div class="auth-field-group">
                  <label for="login-email">E-mail *</label>
                  <input type="email" id="login-email" placeholder="Digite seu e-mail" required>
                </div>
                
                <div class="auth-field-group">
                  <label for="login-password">Senha *</label>
                  <input type="password" id="login-password" placeholder="Digite sua senha" required>
                </div>
                
                <div class="auth-remember-row">
                  <label class="auth-checkbox-label">
                    <input type="checkbox" id="login-remember">
                    <span>Lembrar-me</span>
                  </label>
                </div>
                
                <button type="submit" class="auth-submit-btn">Conectar-se</button>
              </form>
              
              <div class="auth-footer-links">
                <a href="#" id="link-forgot-password" class="auth-footer-link">Esqueceu a senha?</a>
                <a href="#" id="link-go-to-register" class="auth-footer-link">Não tem uma conta? Crie uma aqui</a>
              </div>
            </div>
            
            <!-- Container de Cadastro -->
            <div id="auth-register-container" class="hidden">
              <h3 class="auth-card-title">Criar nova conta</h3>
              
              <form id="form-ecom-register" class="auth-light-form">
                <div class="auth-field-group">
                  <label for="reg-name">Nome Completo *</label>
                  <input type="text" id="reg-name" placeholder="Ex: Juliana Santos" required>
                </div>
                
                <div class="auth-field-group">
                  <label for="reg-phone">Telefone / WhatsApp *</label>
                  <input type="text" id="reg-phone" placeholder="Ex: (11) 98888-7777" required>
                </div>
                
                <div class="auth-field-group">
                  <label for="reg-email">E-mail *</label>
                  <input type="email" id="reg-email" placeholder="Ex: juliana@email.com" required>
                </div>
                
                <div class="auth-field-row">
                  <div class="auth-field-group flex-1">
                    <label for="reg-cpfcnpj">CPF ou CNPJ *</label>
                    <input type="text" id="reg-cpfcnpj" placeholder="000.000.000-00" required>
                  </div>
                  
                  <div class="auth-field-group flex-1">
                    <label for="reg-birthday">Nascimento *</label>
                    <input type="text" id="reg-birthday" placeholder="DD/MM/AAAA" maxlength="10" required>
                  </div>
                </div>
                
                <div class="auth-field-group">
                  <label for="reg-password">Criar Senha *</label>
                  <input type="password" id="reg-password" placeholder="Mínimo 6 caracteres" required minlength="6">
                </div>
                
                <div class="auth-field-group">
                  <label for="reg-address">Endereço de Entrega Padrão *</label>
                  <input type="text" id="reg-address" placeholder="Ex: Av. Paulista, 1000 - Apto 51" required>
                </div>
                
                <button type="submit" class="auth-submit-btn">Criar Conta & Entrar</button>
              </form>
              
              <div class="auth-footer-links">
                <a href="#" id="link-go-to-login" class="auth-footer-link">Já tem uma conta? Conecte-se aqui</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal de Sucesso do Pedido -->
        <div id="modal-success" class="modal-overlay">
          <div class="modal-card max-w-md text-center scale-in">
            <div class="lock-icon-container" style="background-color: var(--success-bg); border-color: var(--success-border)">
              <i data-lucide="check-circle" class="icon-lg text-green"></i>
            </div>
            <h2>Pedido Concluído!</h2>
            <p class="text-muted margin-top-xs">Sua compra foi efetuada e o estoque da Purple já foi atualizado!</p>
            <div class="success-order-box margin-top-md">
              <p><strong>Nº do Pedido:</strong> <code id="success-order-id"></code></p>
              <p><strong>Faturamento:</strong> E-Commerce Oficial</p>
            </div>
            <button id="btn-success-close" class="btn btn-primary btn-full margin-top-lg">Continuar Comprando</button>
          </div>
        </div>

        <!-- Modal Meu Perfil (E-Commerce) -->
        <div id="modal-ecom-profile" class="modal-overlay">
          <div class="modal-card max-w-lg" style="background-color: #5b328a !important; color: white !important; border: 1px solid rgba(255,255,255,0.15) !important;">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
              <h3 style="color:white !important; margin:0; display:flex; align-items:center; gap:8px; font-family:'Outfit', sans-serif;"><i data-lucide="user"></i> Área do Cliente</h3>
              <button id="btn-close-ecom-profile" class="btn-icon" title="Fechar" style="color:white !important; background:none; border:none; cursor:pointer;"><i data-lucide="x"></i></button>
            </div>
            
            <div class="margin-top-md" style="display:flex; flex-direction:column; gap:20px; text-align:left; font-family:'Outfit', sans-serif;">
              <!-- Informações do Cliente -->
              <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; border: 1px solid rgba(255,255,255,0.08);">
                <h4 style="margin:0 0 10px 0; color:#b794f4; font-size:16px;">Meus Dados</h4>
                <p style="margin:4px 0; font-size:13px;"><strong>Nome:</strong> <span id="profile-name"></span></p>
                <p style="margin:4px 0; font-size:13px;"><strong>WhatsApp:</strong> <span id="profile-phone"></span></p>
                <p style="margin:4px 0; font-size:13px;"><strong>E-mail:</strong> <span id="profile-email"></span></p>
                <p style="margin:4px 0; font-size:13px;"><strong>Data de Nascimento:</strong> <span id="profile-birthday"></span></p>
                <p style="margin:4px 0; font-size:13px;"><strong>Endereço Padrão:</strong> <span id="profile-address"></span></p>
              </div>

              <!-- Histórico de Pedidos -->
              <div>
                <h4 style="margin:0 0 10px 0; color:#b794f4; font-size:16px; display:flex; align-items:center; gap:6px;"><i data-lucide="shopping-bag" style="width:18px; height:18px;"></i> Meus Pedidos</h4>
                <div id="profile-orders-list" style="max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding-right:5px;">
                  <!-- Injetado dinamicamente -->
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Container de Notificações -->
        <div id="notifications-container" class="notifications-container"></div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    setupLayoutEvents();
    renderCarousel();
    startCarouselAutoPlay();
    renderProducts();
    updateCartUI();
    updateFavoritesUI();

    // Sincronização inicial em background
    syncWithSupabase().then(() => {
      products = getProducts();
      renderProducts();
    });

    // Atualizar UI quando dados mudarem em background
    window.addEventListener('db-synced', () => {
      products = getProducts();
      renderProducts();
    });

    // Sincronizar produtos entre abas do navegador (PDV -> E-Commerce em tempo real)
    window.addEventListener('storage', (e) => {
      if (e.key === 'purple_pdv_products') {
        products = getProducts();
        renderProducts();
      }
    });
  }

  function renderCarousel() {
    const track = document.getElementById('carousel-track');
    if (!track) return;

    track.innerHTML = giftOffers.map((offer, i) => {
      let positionClass = '';
      if (i === currentCarouselIndex) {
        positionClass = 'active';
      } else if (i === (currentCarouselIndex - 1 + 6) % 6) {
        positionClass = 'prev';
      } else if (i === (currentCarouselIndex + 1) % 6) {
        positionClass = 'next';
      } else {
        positionClass = 'hidden-slide';
      }

      return `
        <div class="carousel-slide ${positionClass}">
          <!-- Text Above (only visible on active) -->
          <div class="carousel-info-top" style="
            font-size: 13px;
            font-weight: 700;
            color: #fbd38d;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-family: 'Outfit', sans-serif;
            margin-bottom: 15px;
            text-align: center;
            opacity: ${i === currentCarouselIndex ? 1 : 0};
            transform: translateY(${i === currentCarouselIndex ? '0' : '-10px'});
            transition: all 0.5s ease;
          ">
            NAS COMPRAS A PARTIR DE R$ ${offer.minPrice}
          </div>

          <!-- Image Wrapper -->
          <div class="carousel-image-box" style="
            width: 220px;
            height: 220px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
            backdrop-filter: blur(5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          ">
            <img src="${offer.image}" alt="${offer.reward}" style="
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              filter: drop-shadow(0 8px 16px rgba(0,0,0,0.2));
            ">
          </div>

          <!-- Text Below (only visible on active) -->
          <div class="carousel-info-bottom" style="
            font-size: 18px;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-family: 'Outfit', sans-serif;
            margin-top: 20px;
            text-align: center;
            line-height: 1.2;
            opacity: ${i === currentCarouselIndex ? 1 : 0};
            transform: translateY(${i === currentCarouselIndex ? '0' : '10px'});
            transition: all 0.5s ease;
          ">
            GANHE ${offer.reward}
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function startCarouselAutoPlay() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
      currentCarouselIndex = (currentCarouselIndex + 1) % 6;
      renderCarousel();
    }, 10000);
  }

  function renderAuthStatusHTML() {
    if (loggedClient) {
      return `
        <div class="auth-logged-info" style="display:flex; align-items:center; gap:8px;">
          <span class="text-sm" id="ecom-profile-trigger" style="cursor:pointer; font-weight:600; color:#6a3f97; display:flex; align-items:center; gap:4px;" title="Ver Perfil & Pedidos">
            <i data-lucide="user" style="width:16px; height:16px;"></i> <span class="ecom-user-name">Olá, <strong>${loggedClient.name.split(' ')[0]}</strong></span>
          </span>
          <button id="btn-ecom-logout" class="btn btn-clear btn-sm" title="Sair da Conta">Sair</button>
        </div>
      `;
    } else {
      return `
        <button id="btn-ecom-auth-open" class="btn btn-secondary btn-sm" style="display:flex; align-items:center; gap:4px;">
          <i data-lucide="user"></i> <span class="ecom-login-text">Entrar / Cadastrar</span>
        </button>
      `;
    }
  }

  function setupLayoutEvents() {
    const cartBtn = document.getElementById('btn-ecom-cart');
    const cartDrawer = document.getElementById('ecom-cart-drawer');
    const closeCartBtn = document.getElementById('btn-close-ecom-cart');
    const successModal = document.getElementById('modal-success');
    const closeSuccessBtn = document.getElementById('btn-success-close');

    // Drawer de Favoritos
    const favBtn = document.getElementById('btn-ecom-favorites');
    const favDrawer = document.getElementById('ecom-favorites-drawer');
    const closeFavBtn = document.getElementById('btn-close-ecom-favorites');

    if (favBtn && favDrawer && closeFavBtn) {
      favBtn.addEventListener('click', () => {
        favDrawer.classList.add('active');
        updateFavoritesUI();
      });

      closeFavBtn.addEventListener('click', () => {
        favDrawer.classList.remove('active');
      });
    }

    // Busca Expansível
    const searchTrigger = document.getElementById('btn-ecom-search-trigger');
    const searchInput = document.getElementById('ecom-search-input');
    
    if (searchTrigger && searchInput) {
      searchTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = searchInput.style.width === '180px';
        if (isOpen) {
          if (!searchInput.value.trim()) {
            searchInput.style.width = '0px';
            searchInput.style.opacity = '0';
            searchInput.style.padding = '0';
          }
        } else {
          searchInput.style.width = '180px';
          searchInput.style.opacity = '1';
          searchInput.style.padding = '2px 8px';
          searchInput.focus();
        }
      });

      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
      });
      
      searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      document.addEventListener('click', () => {
        if (searchInput.style.width === '180px' && !searchInput.value.trim()) {
          searchInput.style.width = '0px';
          searchInput.style.opacity = '0';
          searchInput.style.padding = '0';
        }
      });
    }

    // Drawer do carrinho
    cartBtn.addEventListener('click', () => {
      cartDrawer.classList.add('active');
    });

    closeCartBtn.addEventListener('click', () => {
      cartDrawer.classList.remove('active');
    });

    closeSuccessBtn.addEventListener('click', () => {
      successModal.classList.remove('active');
    });

    document.getElementById('btn-cancel-ecom-var').addEventListener('click', () => {
      document.getElementById('modal-ecom-variation-select').classList.remove('active');
    });

    document.getElementById('btn-close-ecom-detail').addEventListener('click', () => {
      document.getElementById('modal-ecom-product-details').classList.remove('active');
    });

    const regBdayInput = document.getElementById('reg-birthday');
    if (regBdayInput) {
      regBdayInput.addEventListener('input', (e) => {
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

    // Login/Cadastro Modal
    const authBtn = document.getElementById('btn-ecom-auth-open');
    const authModal = document.getElementById('modal-auth');
    const cancelAuthBtn = document.getElementById('btn-cancel-auth');

    if (authBtn) {
      authBtn.addEventListener('click', () => {
        showAuthTab('login');
        authModal.classList.add('active');
      });
    }

    if (cancelAuthBtn) {
      cancelAuthBtn.addEventListener('click', () => {
        authModal.classList.remove('active');
      });
    }

    // Logout
    const logoutBtn = document.getElementById('btn-ecom-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        loggedClient = null;
        discountPercentage = 0; // Reseta desconto
        sessionStorage.removeItem('purple_ecom_logged_in_client');
        showNotification('Sessão encerrada!', 'info');
        renderLayout();
      });
    }

    // Alternância de Auth (Nova Interface Clara)
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-ecom-login');
    const formRegister = document.getElementById('form-ecom-register');
    
    const loginContainer = document.getElementById('auth-login-container');
    const registerContainer = document.getElementById('auth-register-container');
    
    const linkGoToRegister = document.getElementById('link-go-to-register');
    const linkGoToLogin = document.getElementById('link-go-to-login');

    if (tabLogin) tabLogin.addEventListener('click', () => showAuthTab('login'));
    if (tabRegister) tabRegister.addEventListener('click', () => showAuthTab('register'));
    
    if (linkGoToRegister) {
      linkGoToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthTab('register');
      });
    }
    
    if (linkGoToLogin) {
      linkGoToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthTab('login');
      });
    }

    function showAuthTab(tab) {
      if (tab === 'login') {
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
        
        if (loginContainer) loginContainer.classList.remove('hidden');
        if (registerContainer) registerContainer.classList.add('hidden');
        
        if (formLogin) formLogin.classList.remove('hidden');
        if (formRegister) formRegister.classList.add('hidden');
      } else {
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.add('active');
        
        if (loginContainer) loginContainer.classList.add('hidden');
        if (registerContainer) registerContainer.classList.remove('hidden');
        
        if (formLogin) formLogin.classList.add('hidden');
        if (formRegister) formRegister.classList.remove('hidden');
      }
      
      // Altera o ícone do badge de avatar dinamicamente com base na tela
      const badgeIcon = document.querySelector('.auth-avatar-badge');
      if (badgeIcon) {
        if (tab === 'login') {
          badgeIcon.innerHTML = `<i data-lucide="user"></i>`;
        } else {
          badgeIcon.innerHTML = `<i data-lucide="user-plus"></i>`;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }

    // Ações de Submit Auth
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-password').value;

      const registeredClients = getClients();
      const client = registeredClients.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());

      if (client && client.password === pass) {
        loggedClient = client;
        sessionStorage.setItem('purple_ecom_logged_in_client', JSON.stringify(client));
        showNotification(`Bem-vinda, ${client.name}!`, 'success');
        authModal.classList.remove('active');
        router();
      } else {
        showNotification('E-mail ou senha incorretos!', 'error');
      }
    });

    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const phone = document.getElementById('reg-phone').value;
      const email = document.getElementById('reg-email').value.trim();
      const cpfCnpj = document.getElementById('reg-cpfcnpj').value.trim();
      
      const birthdayRaw = document.getElementById('reg-birthday').value.trim();
      let birthday = '';
      if (birthdayRaw) {
        const parts = birthdayRaw.split('/');
        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
          birthday = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          showNotification('Data de nascimento inválida! Use o formato DD/MM/AAAA.', 'error');
          return;
        }
      }

      const pass = document.getElementById('reg-password').value;
      const address = document.getElementById('reg-address').value;

      const registeredClients = getClients();
      const exists = registeredClients.some(c => c.email && c.email.toLowerCase() === email.toLowerCase());

      if (exists) {
        showNotification('Este e-mail já está cadastrado!', 'error');
        return;
      }

      const newClient = addClient({
        name,
        phone,
        email,
        cpfCnpj,
        birthday,
        password: pass,
        address,
        notes: 'Cadastrado pelo E-Commerce.',
        debt: 0
      });

      loggedClient = newClient;
      sessionStorage.setItem('purple_ecom_logged_in_client', JSON.stringify(newClient));
      showNotification('Conta criada com sucesso!', 'success');
      authModal.classList.remove('active');
      router();
    });

    // Eventos do carrossel
    const btnPrev = document.getElementById('btn-carousel-prev');
    const btnNext = document.getElementById('btn-carousel-next');
    
    if (btnPrev && btnNext) {
      btnPrev.addEventListener('click', (e) => {
        e.preventDefault();
        currentCarouselIndex = (currentCarouselIndex - 1 + 6) % 6;
        renderCarousel();
        startCarouselAutoPlay();
      });
      
      btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        currentCarouselIndex = (currentCarouselIndex + 1) % 6;
        renderCarousel();
        startCarouselAutoPlay();
      });
    }

    // Botão "Compre agora" rola até a vitrine
    const btnBuyNow = document.getElementById('btn-hero-buy-now');
    if (btnBuyNow) {
      btnBuyNow.addEventListener('click', () => {
        const grid = document.getElementById('ecom-products-grid');
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Liga os cliques dos links do menu aos filtros de categorias
    const menuLinks = document.querySelectorAll('.ecom-menu-link');
    menuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const cat = link.getAttribute('data-category');
        e.preventDefault();
        
        menuLinks.forEach(l => {
          l.classList.remove('active');
          l.style.color = '#555';
          l.style.borderBottom = 'none';
        });
        
        link.classList.add('active');
        link.style.color = '#6a3f97';
        link.style.borderBottom = '2px solid #6a3f97';
        
        if (cat === 'all') {
          selectedCategory = 'Todos';
        } else if (cat === 'MAQUIAGEM') {
          selectedCategory = 'Maquiagem';
        } else if (cat === 'SKINCARE') {
          selectedCategory = 'Skincare';
        } else if (cat === 'CABELO') {
          selectedCategory = 'Cabelo';
        } else if (cat === 'CORPO') {
          selectedCategory = 'Corpo';
        } else if (cat === 'ACESSORIOS') {
          selectedCategory = 'Acessórios';
        }
        
        renderProducts();
      });
    });

    // Eventos de abertura e fechamento da área do cliente
    document.addEventListener('click', (e) => {
      if (e.target.closest('#ecom-profile-trigger')) {
        window.location.hash = '#minha-conta';
      }
    });
  }

  function openEcomProfile() {
    if (!loggedClient) return;
    
    const modal = document.getElementById('modal-ecom-profile');
    if (!modal) return;

    // Preenche dados do cliente
    document.getElementById('profile-name').textContent = loggedClient.name;
    document.getElementById('profile-phone').textContent = loggedClient.phone;
    document.getElementById('profile-email').textContent = loggedClient.email;
    document.getElementById('profile-birthday').textContent = loggedClient.birthday ? loggedClient.birthday.split('-').reverse().join('/') : 'Não informada';
    document.getElementById('profile-address').textContent = loggedClient.address || 'Nenhum cadastrado';

    // Carrega pedidos
    const ordersList = document.getElementById('profile-orders-list');
    const sales = getSales();
    const clientSales = sales.filter(s => s.clientId === loggedClient.id);

    if (clientSales.length === 0) {
      ordersList.innerHTML = `<p style="color:rgba(255,255,255,0.6); text-align:center; margin:15px 0;">Você ainda não realizou compras.</p>`;
    } else {
      ordersList.innerHTML = clientSales.reverse().map(sale => {
        const orderDate = new Date(sale.timestamp).toLocaleString('pt-BR');
        const statusBadgeColor = sale.status === 'Entregue' ? '#48bb78' : (sale.status === 'Enviado' ? '#4299e1' : '#ed8936');
        return `
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:8px; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:bold; font-size:13px; color:#b794f4;">Pedido #${sale.id.split('_')[1] || sale.id}</span>
              <span style="background:${statusBadgeColor}; color:white; font-size:10px; font-weight:bold; padding:2px 8px; border-radius:12px;">${sale.status || 'Preparando'}</span>
            </div>
            <div style="font-size:12px; color:rgba(255,255,255,0.8);">
              ${sale.items.map(item => `• ${item.quantity}x ${item.name}`).join('<br>')}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px; margin-top:4px; font-size:12px;">
              <span style="color:rgba(255,255,255,0.6);">${orderDate}</span>
              <strong>Total: R$ ${sale.total.toFixed(2)}</strong>
            </div>
          </div>
        `;
      }).join('');
    }

    modal.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderCategoriesChips() {
    const chipsEl = document.getElementById('ecom-category-chips');
    if (!chipsEl) return;
    const categories = ['Todos', ...new Set(products.map(p => p.category))];
    chipsEl.innerHTML = categories.map(cat => `
      <button class="chip ${cat === selectedCategory ? 'active' : ''}" data-cat="${cat}">${cat}</button>
    `).join('');

    chipsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      selectedCategory = btn.getAttribute('data-cat');
      chipsEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    });
  }

  function translateCategory(cat) {
    const translation = {
      'rosto': 'Rosto',
      'lábios': 'Lábios',
      'labios': 'Lábios',
      'olhos': 'Olhos',
      'sobrancelhas': 'Sobrancelhas',
      'skincare': 'Skincare',
      'acessórios': 'Acessórios',
      'acessorios': 'Acessórios'
    };
    return translation[cat.toLowerCase()] || cat;
  }

  function renderProducts() {
    const grid = document.getElementById('ecom-products-grid');
    if (!grid) return;

    let filtered = products.filter(p => {
      const pCat = normalizeStr(p.category);
      const selCat = normalizeStr(selectedCategory);
      
      if (selCat === 'todos') return true;
      
      if (selCat === 'maquiagem') {
        // Maquiagem é o padrão para qualquer categoria que não seja as outras principais
        return pCat !== 'skincare' && 
               pCat !== 'acessorios' && 
               pCat !== 'cabelo' && 
               pCat !== 'cabelos' &&
               pCat !== 'corpo' &&
               pCat !== 'corpos';
      }
      
      if (selCat === 'skincare') return pCat === 'skincare' || pCat === 'skin care';
      if (selCat === 'cabelo' || selCat === 'cabelos') return pCat === 'cabelo' || pCat === 'cabelos';
      if (selCat === 'corpo' || selCat === 'corpos') return pCat === 'corpo' || pCat === 'corpos';
      if (selCat === 'acessorios') return pCat === 'acessorios' || pCat === 'acessorio';
      
      return pCat === selCat;
    });

    // Filtro de pesquisa
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesPrice = p.price.toString().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesPrice || matchesCategory;
      });
    }

    // Ordenar: maior estoque no topo, fora de estoque (0) no final
    filtered.sort((a, b) => b.stock - a.stock);

    // Injeta título e subtítulo da vitrine
    const mainEl = document.querySelector('.ecom-main');
    if (mainEl) {
      let titleBar = document.getElementById('ecom-vitrine-title-bar');
      if (!titleBar) {
        mainEl.insertAdjacentHTML('afterbegin', `
          <div id="ecom-vitrine-title-bar" class="ecom-filter-bar" style="margin-bottom: 30px; text-align: left;">
            <h3 style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; font-weight: 700; color: #6a3f97 !important; margin: 0;">Produtos em Destaque</h3>
            <p style="margin: 5px 0 0 0; font-size: 15px; color: #9c6ade !important; font-family:'Outfit', sans-serif; font-weight: 500;">Descubra nossa coleção mais recente</p>
          </div>
        `);
      }
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<p class="text-muted text-center pad-md col-span-12">Nenhum produto cadastrado.</p>`;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const isOut = p.stock <= 0;
      const hasVars = p.variations && p.variations.length > 0;
      const isFav = favorites.includes(p.id);
      return `
        <div class="ecom-product-card-premium ${isOut ? 'out-of-stock' : ''}" data-id="${p.id}">
          <!-- Image Wrapper -->
          <div class="ecom-card-image-wrapper" style="position: relative; overflow: hidden; border-radius: 12px; width: 286px; height: 381.33px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; z-index: 1;">
            <img src="${p.image}" alt="${p.name}" class="ecom-card-main-image" id="img-${p.id}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease, filter 0.4s ease;" onerror="this.style.display='none';">
            
            <button class="ecom-favorite-btn ${isFav ? 'favorited' : ''}" data-id="${p.id}" style="position: absolute; top: 12px; right: 12px; background: white; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; z-index: 5;">
              <i data-lucide="heart" style="width: 16px; height: 16px; ${isFav ? 'fill: #6a3f97; color: #6a3f97;' : 'color: #777;'}"></i>
            </button>
            
            <!-- Hover Overlay -->
            <div class="ecom-card-hover-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); padding: 15px; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; transform: translateY(10px); transition: all 0.3s ease; z-index: 4;">
              ${hasVars ? `
                <span class="text-xs" style="color: white; font-weight: 500; margin-bottom: 8px; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.5); font-family:'Outfit', sans-serif;">Selecione o Tom</span>
                <div class="card-color-swatches" style="display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;">
                  ${p.variations.map(v => `
                    <div class="card-swatch-circle" 
                         data-var-id="${v.id}" 
                         data-var-name="${v.name}" 
                         data-var-image="${v.image || p.image}" 
                         data-product-id="${p.id}"
                         style="width: 20px; height: 20px; border-radius: 50%; background: ${v.colorCode || '#8b5cf6'}; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); cursor: pointer; transition: transform 0.2s;" 
                         title="${v.name}">
                    </div>
                  `).join('')}
                </div>
              ` : (isOut ? `
                <button class="btn btn-secondary" 
                        disabled 
                        style="background: rgba(255,255,255,0.45); color: #777; font-weight: bold; border: none; width: 100%; border-radius: 20px; padding: 8px 15px; font-size: 13px; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 6px; font-family:'Outfit', sans-serif;">
                  <i data-lucide="slash" style="width: 14px; height: 14px;"></i> Esgotado
                </button>
              ` : `
                <button class="btn btn-primary btn-ecom-quick-add" 
                        data-id="${p.id}" 
                        style="background: white; color: #6a3f97; font-weight: bold; border: none; width: 100%; border-radius: 20px; padding: 8px 15px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-family:'Outfit', sans-serif;">
                  <i data-lucide="shopping-cart" style="width: 14px; height: 14px;"></i> Adicionar à Sacola
                </button>
              `)}
            </div>
            
            ${isOut ? '<span class="out-badge" style="position: absolute; top: 12px; left: 12px; background: #ef4444; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; z-index: 5;">Esgotado</span>' : ''}
          </div>

          <!-- Body Details -->
          <div class="ecom-product-body-premium" style="text-align: left; padding: 12px 2px; min-height: 95px; display: flex; flex-direction: column; justify-content: flex-start;">
            <span class="ecom-product-cat" style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 500; letter-spacing: 0.5px; font-family:'Outfit', sans-serif;">
              ${translateCategory(p.category)}
            </span>
            <h4 class="ecom-product-title" style="font-size: 15px; font-weight: 600; color: #111; margin: 4px 0 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family:'Outfit', sans-serif;">
              ${p.name}
            </h4>
            <p class="ecom-product-subtitle" id="subtitle-${p.id}" style="font-size: 12px; color: #666; margin: 0 0 6px 0; font-family:'Outfit', sans-serif;">
              ${hasVars ? `${p.variations[0].name}` : 'Coleção Oficial'}
            </p>
            <span class="ecom-product-price" style="font-size: 15px; font-weight: 700; color: #000; font-family:'Outfit', sans-serif;">
              R$ ${p.price.toFixed(2)}
            </span>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Eventos dos cards premium
    grid.querySelectorAll('.ecom-product-card-premium').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-swatch-circle') || e.target.closest('.btn-ecom-quick-add') || e.target.closest('.ecom-favorite-btn')) {
          return;
        }
        const id = card.getAttribute('data-id');
        const product = products.find(p => p.id === id);
        if (product) {
          openEcomProductDetails(product);
        }
      });
    });

    // Hover e clique nos swatches
    grid.querySelectorAll('.card-swatch-circle').forEach(swatch => {
      swatch.addEventListener('mouseenter', () => {
        const prodId = swatch.getAttribute('data-product-id');
        const varName = swatch.getAttribute('data-var-name');
        const varImage = swatch.getAttribute('data-var-image');
        
        const imgEl = document.getElementById(`img-${prodId}`);
        const subtitleEl = document.getElementById(`subtitle-${prodId}`);
        
        if (imgEl && varImage) imgEl.src = varImage;
        if (subtitleEl && varName) subtitleEl.textContent = varName;
      });
      
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        const prodId = swatch.getAttribute('data-product-id');
        const varId = swatch.getAttribute('data-var-id');
        const varName = swatch.getAttribute('data-var-name');
        
        const product = products.find(p => p.id === prodId);
        const variation = product.variations.find(v => v.id === varId);
        
        if (product && variation) {
          addEcomProductToCartWithQty(product, variation, 1);
        }
      });
    });

    // Botões rápidos de compra
    grid.querySelectorAll('.btn-ecom-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prodId = btn.getAttribute('data-id');
        const product = products.find(p => p.id === prodId);
        if (product) {
          addEcomProductToCartWithQty(product, null, 1);
        }
      });
    });

    // Favoritar
    grid.querySelectorAll('.ecom-favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prodId = btn.getAttribute('data-id');
        if (favorites.includes(prodId)) {
          favorites = favorites.filter(id => id !== prodId);
          showNotification('Removido dos favoritos', 'info');
        } else {
          favorites.push(prodId);
          showNotification('Adicionado aos favoritos!', 'success');
        }
        saveFavorites();
        updateFavoritesUI();
        renderProducts();
      });
    });
  }

  function openEcomProductDetails(product) {
    const modal = document.getElementById('modal-ecom-product-details');
    const content = document.getElementById('ecom-detail-prod-content');
    
    const hasVars = product.variations && product.variations.length > 0;

    content.innerHTML = `
      <div class="prod-details-layout" style="display:flex; gap:20px; flex-wrap:wrap; text-align:left;">
        <div class="prod-details-img-container" style="flex: 1 1 200px; display:flex; justify-content:center; align-items:center; background-color:${product.color || '#8b5cf6'}10; border-radius:var(--radius-lg); padding:10px; width:220px; height:240px;">
          <img id="ecom-detail-main-img" src="${hasVars ? (product.variations[0].image || product.image) : product.image}" alt="${product.name}" style="max-width:100%; max-height:220px; object-fit:cover; border-radius:var(--radius-md);" onerror="this.style.display='none';">
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
              <span id="ecom-detail-var-name-display" class="text-xs text-purple font-bold">${product.variations[0].name} (${product.variations[0].stock} un disponíveis)</span>
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
                <button type="button" id="btn-ecom-detail-qty-minus" class="btn-qty-adj">-</button>
                <span class="qty" id="ecom-detail-qty-val">1</span>
                <button type="button" id="btn-ecom-detail-qty-plus" class="btn-qty-adj">+</button>
              </div>
            </div>
            
            <button type="button" id="btn-ecom-detail-add-cart" class="btn btn-primary" style="flex-grow:1; height:42px; margin-top:18px;" ${product.stock <= 0 ? 'disabled' : ''}>
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    
    let qty = 1;
    let selectedVarId = hasVars ? product.variations[0].id : null;

    const oldQtyMinus = document.getElementById('btn-ecom-detail-qty-minus');
    const oldQtyPlus = document.getElementById('btn-ecom-detail-qty-plus');
    const oldAddBtn = document.getElementById('btn-ecom-detail-add-cart');

    const qtyMinus = oldQtyMinus.cloneNode(true);
    const qtyPlus = oldQtyPlus.cloneNode(true);
    const addBtn = oldAddBtn.cloneNode(true);

    oldQtyMinus.parentNode.replaceChild(qtyMinus, oldQtyMinus);
    oldQtyPlus.parentNode.replaceChild(qtyPlus, oldQtyPlus);
    oldAddBtn.parentNode.replaceChild(addBtn, oldAddBtn);

    const qtyVal = document.getElementById('ecom-detail-qty-val');
    const swatches = content.querySelectorAll('.color-swatch');
    const varNameDisplay = document.getElementById('ecom-detail-var-name-display');
    const mainImg = document.getElementById('ecom-detail-main-img');

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
      addEcomProductToCartWithQty(product, variation, qty);
      modal.classList.remove('active');
    });
  }

  function addEcomProductToCartWithQty(product, variation = null, qty = 1) {
    const cartKey = variation ? `${product.id}_${variation.id}` : product.id;
    const name = variation ? `${product.name} - ${variation.name}` : product.name;
    const maxStock = variation ? variation.stock : product.stock;
    const variationId = variation ? variation.id : null;

    if (maxStock <= 0) {
      showNotification(`O produto/variação ${name} está esgotado!`, 'error');
      return;
    }

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
      const initialQty = qty > maxStock ? maxStock : qty;
      cart.push({
        id: product.id,
        variationId: variationId,
        cartKey: cartKey,
        name: name,
        price: product.price,
        quantity: initialQty,
        maxStock: maxStock
      });
      showNotification(`${initialQty}x ${name} adicionados!`, 'success');
    }
    updateCartUI();
  }

  function openEcomVariationSelect(product) {
    const modal = document.getElementById('modal-ecom-variation-select');
    const container = document.getElementById('ecom-var-options-container');

    container.innerHTML = product.variations.map(v => {
      const isOut = v.stock <= 0;
      return `
        <div class="variation-option-row" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(139,92,246,0.1); padding-bottom:8px;">
          <div>
            <strong>${v.name}</strong>
            <br><span class="text-xs text-muted">Estoque: ${v.stock} un</span>
          </div>
          <button class="btn btn-primary btn-sm btn-pick-ecom-var-opt" ${isOut ? 'disabled' : ''} data-var-id="${v.id}">
            Selecionar
          </button>
        </div>
      `;
    }).join('');

    modal.classList.add('active');

    container.querySelectorAll('.btn-pick-ecom-var-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const varId = btn.getAttribute('data-var-id');
        const variation = product.variations.find(v => v.id === varId);
        if (variation) {
          addEcomProductToCart(product, variation);
          modal.classList.remove('active');
        }
      });
    });
  }

  function addEcomProductToCart(product, variation = null) {
    const cartKey = variation ? `${product.id}_${variation.id}` : product.id;
    const name = variation ? `${product.name} - ${variation.name}` : product.name;
    const maxStock = variation ? variation.stock : product.stock;
    const variationId = variation ? variation.id : null;

    if (maxStock <= 0) {
      showNotification(`O produto/variação ${name} está esgotado!`, 'error');
      return;
    }

    const existing = cart.find(item => item.cartKey === cartKey);
    if (existing) {
      if (existing.quantity < maxStock) {
        existing.quantity++;
        showNotification(`${name} adicionado!`, 'success');
      } else {
        showNotification(`Estoque insuficiente!`, 'warning');
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
      showNotification(`${name} adicionado!`, 'success');
    }

    updateCartUI();
  }

  function updateCartUI() {
    const badge = document.getElementById('ecom-cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) badge.textContent = totalItems;

    const drawerItems = document.getElementById('ecom-drawer-items');
    const drawerFooter = document.getElementById('ecom-drawer-footer');
    if (!drawerItems || !drawerFooter) return;

    if (cart.length === 0) {
      drawerItems.innerHTML = `
        <div class="cart-empty-state">
          <i data-lucide="shopping-bag"></i>
          <p>Sua sacola está vazia.</p>
        </div>
      `;
      drawerFooter.innerHTML = '';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    drawerItems.innerHTML = cart.map(item => `
      <div class="ecom-cart-item">
        <div class="ecom-cart-item-info">
          <strong>${item.name}</strong>
          <span class="text-muted text-sm">R$ ${item.price.toFixed(2)}</span>
        </div>
        <div class="ecom-cart-item-actions">
          <div class="qty-selector">
            <button class="btn-ecom-minus" data-key="${item.cartKey}">-</button>
            <span class="qty">${item.quantity}</span>
            <button class="btn-ecom-plus" data-key="${item.cartKey}">+</button>
          </div>
          <button class="btn-icon text-danger btn-ecom-delete" data-key="${item.cartKey}"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountValue = subtotal * discountPercentage;
    const finalTotal = subtotal - discountValue + selectedShippingPrice;
    drawerFooter.innerHTML = `
      <div class="cart-summary border-top-purple pad-top-sm" style="margin-top: 15px;">
        ${discountPercentage > 0 ? `
          <div class="summary-row" style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span>Subtotal</span>
            <span>R$ ${subtotal.toFixed(2)}</span>
          </div>
          <div class="summary-row text-success font-bold" style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span>Desconto Cupom (10%)</span>
            <span>- R$ ${discountValue.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="summary-row font-bold" style="display:flex; justify-content:space-between; font-size: 16px; color: white;">
          <span>Total Geral</span>
          <span>R$ ${(subtotal - discountValue).toFixed(2)}</span>
        </div>
      </div>

      <!-- Campo de Cupom de Desconto -->
      <div class="coupon-area margin-top-sm" style="background:rgba(255,255,255,0.03); border:1px dashed var(--border-color); padding:10px; border-radius:8px; margin-top: 15px;">
        <label class="text-xs text-muted font-bold block" style="display:block; font-size:11px; color:#cbd5e1; text-align:left;">Cupom de Desconto</label>
        <div class="flex-row" style="display:flex; gap:8px; align-items:center; margin-top:4px;">
          <input type="text" id="ecom-coupon-input" placeholder="PARABENSPURPLE" class="input-sm" style="flex-grow:1; height:34px; margin:0; background:rgba(255,255,255,0.08); border:1px solid var(--border-color); color:white; border-radius:6px; padding:0 8px;" value="${discountPercentage > 0 ? 'PARABENSPURPLE' : ''}">
          <button type="button" id="btn-ecom-apply-coupon" class="btn btn-secondary btn-sm" style="height:34px; margin-top:0; padding:0 12px; border-radius:6px; cursor:pointer;">Aplicar</button>
        </div>
        <div id="ecom-coupon-message" class="text-xs margin-top-xs" style="text-align:left; margin-top:4px;">
          ${discountPercentage > 0 ? '<span style="color:#10b981; font-weight:bold; font-size:11px;">Cupom PARABENSPURPLE aplicado: 10% de desconto!</span>' : ''}
        </div>
      </div>

      <a href="#carrinho" id="btn-go-to-checkout" class="btn btn-primary btn-full btn-lg" style="margin-top:20px; width:100%; font-family:'Outfit', sans-serif; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; height:46px; border-radius:23px; background:#8b5cf6; color:white; font-weight:700; border:none; cursor:pointer;">
        <i data-lucide="shopping-bag" style="width:18px; height:18px;"></i> Finalizar a Compra
      </a>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Event listener para fechar o drawer de carrinho ao clicar em finalizar a compra
    const goCheckoutBtn = document.getElementById('btn-go-to-checkout');
    if (goCheckoutBtn) {
      goCheckoutBtn.addEventListener('click', () => {
        document.getElementById('ecom-cart-drawer').classList.remove('active');
      });
    }

    // Event listener para cupom
    const applyCouponBtn = document.getElementById('btn-ecom-apply-coupon');
    const couponInput = document.getElementById('ecom-coupon-input');
    if (applyCouponBtn && couponInput) {
      applyCouponBtn.addEventListener('click', () => {
        const code = couponInput.value.trim().toUpperCase();
        if (code === 'PARABENSPURPLE') {
          discountPercentage = 0.1;
          showNotification('Cupom aplicado com sucesso!', 'success');
        } else {
          discountPercentage = 0;
          showNotification('Cupom inválido!', 'error');
        }
        updateCartUI();
      });
    }
  }

  function saveFavorites() {
    localStorage.setItem('purple_ecom_favorites', JSON.stringify(favorites));
  }

  function updateFavoritesUI() {
    const badge = document.getElementById('ecom-favorites-badge');
    if (badge) {
      badge.textContent = favorites.length;
      badge.style.display = favorites.length > 0 ? 'flex' : 'none';
    }

    const container = document.getElementById('ecom-favorites-items');
    if (!container) return;

    if (favorites.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#aaa; gap:10px; padding: 40px 0;">
          <i data-lucide="heart" style="width: 48px; height: 48px; color: rgba(255,255,255,0.25);"></i>
          <p style="font-size:14px; font-family:'Outfit', sans-serif; color: rgba(255,255,255,0.6);">Nenhum favorito selecionado.</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    // Obter produtos favoritados
    const favProducts = products.filter(p => favorites.includes(p.id));

    container.innerHTML = favProducts.map(p => {
      const isOut = p.stock <= 0;
      return `
        <div class="ecom-cart-item" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; margin-bottom:12px; gap: 10px;">
          <div style="display:flex; gap:10px; align-items:center; text-align:left;">
            <img src="${p.image}" alt="${p.name}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; background:#f5f5f5; border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; flex-direction:column;">
              <strong style="font-size:13px; color:#ffffff; font-family:'Outfit', sans-serif; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; max-width:180px;">${p.name}</strong>
              <span style="color:#ffffff; font-weight:600; font-size:12px; margin-top:2px;">R$ ${p.price.toFixed(2)}</span>
            </div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            ${isOut ? `
              <button disabled style="padding: 6px 12px; font-size: 10px; font-weight: 700; border-radius: 20px; border: none; background: rgba(255,255,255,0.1) !important; color: rgba(255,255,255,0.4) !important; font-family: 'Outfit', sans-serif; cursor: not-allowed;">Esgotado</button>
            ` : `
              <button class="btn-fav-add-to-cart" data-id="${p.id}" style="background: #8b5cf6 !important; color: white !important; border: none; padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif; box-shadow: 0 2px 5px rgba(0,0,0,0.2); white-space: nowrap; transition: opacity 0.2s;">
                Adicionar
              </button>
            `}
            <button class="btn-icon btn-fav-remove" data-id="${p.id}" title="Remover dos favoritos" style="color:#ffffff; background:none; border:none; cursor:pointer; padding:4px; opacity:0.75; display:flex; align-items:center; justify-content:center;">
              <i data-lucide="trash-2" style="width:14px; height:14px; color:#f87171;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Ouvintes de eventos na gaveta de favoritos
    container.querySelectorAll('.btn-fav-add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prodId = btn.getAttribute('data-id');
        const product = products.find(p => p.id === prodId);
        if (product) {
          addEcomProductToCartWithQty(product, null, 1);
        }
      });
    });

    container.querySelectorAll('.btn-fav-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prodId = btn.getAttribute('data-id');
        favorites = favorites.filter(id => id !== prodId);
        saveFavorites();
        updateFavoritesUI();
        renderProducts();
      });
    });
  }

  function renderCheckoutClientStatusHTML() {
    if (loggedClient) {
      return `
        <div class="checkout-login-alert success">
          <span>Identificado como: <strong>${sanitizeHTML(loggedClient.name)}</strong></span>
        </div>
      `;
    } else {
      return `
        <div class="checkout-login-alert warning">
          <span>Deseja finalizar mais rápido?</span>
          <button type="button" id="btn-checkout-login-trigger" class="btn btn-secondary btn-sm margin-top-xs">Fazer Login / Cadastrar</button>
        </div>
      `;
    }
  }

  function setupCartCheckoutEvents(finalTotal) {
    const guestBdayInput = document.getElementById('ecom-birthday');
    if (guestBdayInput) {
      guestBdayInput.addEventListener('input', (e) => {
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

    // Evento de gatilho do Login de dentro do carrinho
    const checkoutLoginBtn = document.getElementById('btn-checkout-login-trigger');
    if (checkoutLoginBtn) {
      checkoutLoginBtn.addEventListener('click', () => {
        document.getElementById('modal-auth').classList.add('active');
        document.getElementById('ecom-cart-drawer').classList.remove('active');
      });
    }

    // Ações de alteração de sacola
    const drawerItems = document.getElementById('ecom-drawer-items');
    
    drawerItems.querySelectorAll('.btn-ecom-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        const item = cart.find(i => i.cartKey === key);
        if (item && item.quantity < item.maxStock) {
          item.quantity++;
          updateCartUI();
        } else {
          showNotification('Limite de estoque atingido!', 'warning');
        }
      });
    });

    drawerItems.querySelectorAll('.btn-ecom-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        const item = cart.find(i => i.cartKey === key);
        if (item) {
          if (item.quantity > 1) {
            item.quantity--;
          } else {
            const idx = cart.findIndex(i => i.cartKey === key);
            if (idx !== -1) cart.splice(idx, 1);
          }
          updateCartUI();
        }
      });
    });

    drawerItems.querySelectorAll('.btn-ecom-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        const idx = cart.findIndex(i => i.cartKey === key);
        if (idx !== -1) cart.splice(idx, 1);
        updateCartUI();
      });
    });

    // Evento de Aplicar Cupom
    const btnApply = document.getElementById('btn-ecom-apply-coupon');
    const couponInput = document.getElementById('ecom-coupon-input');
    const couponMessage = document.getElementById('ecom-coupon-message');

    if (btnApply && couponInput) {
      btnApply.addEventListener('click', () => {
        const code = couponInput.value.trim().toUpperCase();
        if (!code) return;

        if (code === 'PARABENSPURPLE') {
          if (!loggedClient) {
            couponMessage.innerHTML = '<span class="text-danger">Erro: Faça login para validar o aniversário!</span>';
            discountPercentage = 0;
          } else {
            const bdayMonth = loggedClient.birthday ? loggedClient.birthday.split('-')[1] : '';
            const curMonth = String(new Date().getMonth() + 1).padStart(2, '0');
            
            if (bdayMonth === curMonth) {
              discountPercentage = 0.10;
              couponMessage.innerHTML = '<span class="text-success font-bold">Cupom PARABENSPURPLE aplicado: 10% de desconto!</span>';
              showNotification('Desconto de 10% de aniversário aplicado!', 'success');
            } else {
              discountPercentage = 0;
              couponMessage.innerHTML = '<span class="text-danger">Erro: Cupom válido apenas no mês do seu aniversário!</span>';
              showNotification('Seu aniversário não é neste mês!', 'error');
            }
          }
        } else {
          discountPercentage = 0;
          couponMessage.innerHTML = '<span class="text-danger">Erro: Cupom inválido!</span>';
        }
        updateCartUI();
      });
    }

    // Evento de alteração da modalidade de entrega (delivery vs pickup)
    const modeRadios = document.querySelectorAll('input[name="delivery_mode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        selectedDeliveryMode = radio.value;
        if (selectedDeliveryMode === 'pickup') {
          selectedShippingPrice = 0;
          selectedShippingCarrier = 'Retirada na Loja';
        } else {
          selectedShippingPrice = 0;
          selectedShippingCarrier = '';
          calculatedCep = '';
        }
        updateCartUI(); // Re-renderiza para atualizar layout e totais
      });
    });

    // Evento de frete - Máscara CEP
    const cepInput = document.getElementById('ecom-cep-input');
    if (cepInput) {
      cepInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        if (value.length > 5) {
          value = `${value.slice(0, 5)}-${value.slice(5)}`;
        }
        e.target.value = value;
      });
    }

    // Botão de Calcular Frete
    const btnCalcShipping = document.getElementById('btn-ecom-calc-shipping');
    if (btnCalcShipping && cepInput) {
      btnCalcShipping.addEventListener('click', (e) => {
        e.stopPropagation();
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) {
          showNotification('CEP inválido! Digite os 8 números.', 'error');
          return;
        }
        calculatedCep = cepInput.value;
        const optionsDiv = document.getElementById('ecom-shipping-options');
        if (optionsDiv) {
          optionsDiv.style.display = 'flex';
        }
        showNotification('Opções de frete calculadas via Melhor Envio!', 'success');
      });
    }

    // Seleção de frete (radios)
    const shippingRadios = document.querySelectorAll('input[name="shipping_carrier"]');
    shippingRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        selectedShippingPrice = parseFloat(radio.value);
        selectedShippingCarrier = radio.getAttribute('data-carrier');
        updateCartUI(); // Atualiza resumo e totais
      });
    });

    // Finalizar pedido submit
    let isSubmittingOrder = false;
    const formCheckout = document.getElementById('ecom-form-checkout');
    formCheckout.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmittingOrder) return;
      isSubmittingOrder = true;

      const submitBtn = formCheckout.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      
      let finalClientId = null;
      let finalClientName = '';
      const address = document.getElementById('ecom-address').value;
      const payment = document.getElementById('ecom-payment').value;

      if (loggedClient) {
        finalClientId = loggedClient.id;
        finalClientName = loggedClient.name;
        
        // Atualiza endereço padrão se não tiver
        if (!loggedClient.address) {
          loggedClient.address = address;
        }
      } else {
        const guestName = document.getElementById('ecom-name').value;
        const guestPhone = document.getElementById('ecom-phone').value;
        const guestEmail = document.getElementById('ecom-email').value.trim();
        const guestCpfCnpj = document.getElementById('ecom-cpfcnpj').value.trim();
        
        const birthdayRaw = document.getElementById('ecom-birthday').value.trim();
        let guestBirthday = '';
        if (birthdayRaw) {
          const parts = birthdayRaw.split('/');
          if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            guestBirthday = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            showNotification('Data de nascimento inválida! Use o formato DD/MM/AAAA.', 'error');
            isSubmittingOrder = false;
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
        }

        // Salvar visitante no banco de clientes
        const newClient = addClient({
          name: guestName,
          phone: guestPhone || 'Visitante E-Com',
          email: guestEmail || '',
          cpfCnpj: guestCpfCnpj,
          birthday: guestBirthday,
          notes: 'Visitante (sem login) via E-Commerce.',
          debt: 0
        });
        
        finalClientId = newClient.id;
        finalClientName = newClient.name;
      }

      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountValue = subtotal * discountPercentage;
      const finalTotalValue = subtotal - discountValue + selectedShippingPrice;

      const saleData = {
        items: cart.map(i => ({
          id: i.id,
          variationId: i.variationId,
          name: i.name,
          price: i.price,
          quantity: i.quantity
        })),
        subtotal: subtotal,
        discount: discountValue,
        shippingFee: selectedShippingPrice,
        shippingCarrier: selectedShippingCarrier || null,
        total: finalTotalValue,
        clientId: finalClientId,
        clientName: finalClientName,
        paymentMethod: payment,
        amountPaid: finalTotalValue,
        operator: 'Venda Online (E-Commerce)',
        origin: 'e-commerce',
        deliveryAddress: address,
        coupon: discountPercentage > 0 ? 'PARABENSPURPLE' : null
      };

      try {
        const completedSale = addSale(saleData);
        
        // Obter configurações de pagamento
        const config = getConfig();
        const isAsaas = config.asaasMode === 'production';
        
        // Exibir modal de sucesso
        const modal = document.getElementById('modal-success');
        const successBox = modal.querySelector('.success-order-box');
        
        // Resetar o box de sucesso para garantir a presença do elemento success-order-id em compras consecutivas
        successBox.innerHTML = `<p><strong>Nº do Pedido:</strong> <code id="success-order-id"></code></p><p><strong>Faturamento:</strong> E-Commerce Oficial</p>`;
        
        document.getElementById('success-order-id').textContent = completedSale.id.split('_')[1] || completedSale.id;
        
        // Resetar textos/botões para o padrão antes de alterar
        const modalTitle = modal.querySelector('h2');
        const modalSub = modal.querySelector('p.text-muted');
        const closeBtn = document.getElementById('btn-success-close');
        
        modalTitle.textContent = 'Pedido Concluído!';
        modalSub.textContent = 'Sua compra foi efetuada e o estoque da Purple já foi atualizado!';
        closeBtn.textContent = 'Continuar Comprando';
        closeBtn.style.display = 'block';

        // Remover botões dinâmicos de checkouts anteriores se existirem
        const oldDynamicBtn = document.getElementById('ecom-dynamic-checkout-btn');
        if (oldDynamicBtn) oldDynamicBtn.remove();
        
        if (isAsaas) {
          // Capturar dados do cliente para a API do Asaas
          let customerName = finalClientName || 'Cliente E-commerce';
          let customerEmail = '';
          let customerPhone = '';
          let customerCpfCnpj = '';
          
          if (loggedClient) {
            customerEmail = loggedClient.email;
            customerPhone = loggedClient.phone;
            customerCpfCnpj = loggedClient.cpfCnpj || '';
          } else {
            customerEmail = document.getElementById('ecom-email').value.trim();
            customerPhone = document.getElementById('ecom-phone').value;
            customerCpfCnpj = document.getElementById('ecom-cpfcnpj').value.trim();
          }
          
          if (payment === 'credit') {
            modalTitle.textContent = 'Pedido Recebido!';
            modalSub.textContent = 'Seu pedido foi registrado. Para concluir o seu pagamento no cartão de crédito com segurança, clique no botão de pagamento do Asaas abaixo.';
            
            // Injetar botão do Checkout Asaas (invoiceUrl)
            successBox.innerHTML = `<div class="text-center pad-md"><p class="animate-pulse" style="color:var(--primary); font-weight:bold;">Gerando link de pagamento Asaas...</p></div>`;
            modal.classList.add('active');
            
            try {
              const paymentResponse = await fetch('/api/asaas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: completedSale.total,
                  paymentMethod: 'CREDIT_CARD',
                  customerName: customerName,
                  customerEmail: customerEmail,
                  customerPhone: customerPhone,
                  customerCpfCnpj: customerCpfCnpj,
                  apiKey: config.asaasApiKey,
                  mode: config.asaasMode,
                  orderId: completedSale.id
                })
              });
              
              const result = await paymentResponse.json();
              if (result.success) {
                successBox.innerHTML = `<p><strong>Nº do Pedido:</strong> <code>${completedSale.id.split('_')[1] || completedSale.id}</code></p>`;
                successBox.insertAdjacentHTML('afterend', `
                  <a href="${result.checkoutUrl}" target="_blank" id="ecom-dynamic-checkout-btn" class="btn btn-primary btn-full margin-top-md" style="display:block; text-align:center; text-decoration:none; background: #48bb78; color: white;">
                    <i data-lucide="external-link" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Pagar com Asaas (Cartão)
                  </a>
                `);
                if (typeof lucide !== 'undefined') lucide.createIcons();
              } else {
                throw new Error((result.error ? (result.error + (result.details ? ' (' + result.details + ')' : '')) : null) || 'Erro desconhecido');
              }
            } catch (err) {
              showNotification('Erro Asaas: ' + err.message, 'error');
              successBox.innerHTML = `
                <p><strong>Nº do Pedido:</strong> <code>${completedSale.id.split('_')[1] || completedSale.id}</code></p>
                <p class="text-xs text-danger text-center">Fale com o suporte para concluir seu pagamento. Detalhes: ${err.message}</p>
              `;
            }
            
          } else if (payment === 'pix') {
            modalTitle.textContent = 'Aguardando Pagamento';
            modalSub.textContent = 'Escaneie o QR Code abaixo ou copie a chave Pix para realizar o pagamento oficial via Asaas.';
            
            successBox.innerHTML = `<div class="text-center pad-md"><p class="animate-pulse" style="color:var(--primary); font-weight:bold;">Gerando Pix oficial no Asaas...</p></div>`;
            modal.classList.add('active'); // Mostrar modal com carregamento
            
            try {
              const pixResponse = await fetch('/api/asaas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: completedSale.total,
                  paymentMethod: 'PIX',
                  customerName: customerName,
                  customerEmail: customerEmail,
                  customerPhone: customerPhone,
                  customerCpfCnpj: customerCpfCnpj,
                  apiKey: config.asaasApiKey,
                  mode: config.asaasMode,
                  orderId: completedSale.id
                })
              });
              
              const pixResult = await pixResponse.json();
              if (pixResult.success) {
                successBox.innerHTML = `
                  <p><strong>Nº do Pedido:</strong> <code>${completedSale.id.split('_')[1] || completedSale.id}</code></p>
                  <div style="margin: 15px auto; width: 200px; height: 200px; padding: 10px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.1);">
                    <img src="${pixResult.qrCode}" style="max-width:100%; max-height:100%;">
                  </div>
                  <p class="text-xs text-muted text-center" style="margin-bottom:8px;">Pix Dinâmico Oficial Asaas</p>
                  <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
                    <input type="text" readonly id="ecom-pix-copy-key" value="${pixResult.pixKey}" style="width:100%; text-align:center; padding:8px; font-size:12px; font-family:monospace; background:rgba(255,255,255,0.08); border:1px solid var(--border-color); color:white; border-radius:6px;">
                    <button type="button" id="btn-copy-ecom-pix" class="btn btn-secondary btn-sm" style="width:100%;"><i data-lucide="copy"></i> Copiar Chave Pix</button>
                  </div>
                `;
                
                if (typeof lucide !== 'undefined') lucide.createIcons();
                
                document.getElementById('btn-copy-ecom-pix').addEventListener('click', () => {
                  const input = document.getElementById('ecom-pix-copy-key');
                  input.select();
                  document.execCommand('copy');
                  showNotification('Chave Pix copiada!', 'success');
                });
              } else {
                throw new Error((pixResult.error ? (pixResult.error + (pixResult.details ? ' (' + pixResult.details + ')' : '')) : null) || 'Falha ao processar Pix.');
              }
            } catch (err) {
              showNotification('Erro Asaas: ' + err.message, 'warning');
              successBox.innerHTML = `
                <p><strong>Nº do Pedido:</strong> <code>${completedSale.id.split('_')[1] || completedSale.id}</code></p>
                <p class="text-xs text-danger text-center" style="margin: 5px 0;">Erro: ${err.message}</p>
                <p class="text-xs text-muted text-center" style="margin: 5px 0;">Usando Pix de backup offline abaixo:</p>
                <div style="margin: 15px auto; width: 200px; height: 200px; padding: 10px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.1);">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('00020101021226930014br.gov.bcb.pix2571pix-qrcode.asaas.com/v3/simulated_purple_offline_' + Date.now())}" style="max-width:100%; max-height:100%;">
                </div>
              `;
            }
          }
        }
        
        modal.classList.add('active');

        // Limpar carrinho, cupom e fechar drawer
        cart.splice(0, cart.length);
        discountPercentage = 0; // Reseta cupom
        selectedShippingPrice = 0;
        selectedShippingCarrier = '';
        calculatedCep = '';
        selectedDeliveryMode = 'delivery';
        document.getElementById('ecom-cart-drawer').classList.remove('active');
        updateCartUI();

        // Atualiza estoque local da vitrine
        products = getProducts();
        renderProducts();

      } catch (err) {
        showNotification(err.message, 'error');
      } finally {
        isSubmittingOrder = false;
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // --- SISTEMA DE ROTEAMENTO SPA E NOVAS TELAS (CHECKOUT DEDICADO, RASTREAMENTO E MEU PERFIL SEPHORA) ---

  let checkoutStep = 1;
  let selectedPaymentMethod = 'pix';
  let activeAccountTab = 'dashboard';
  let checkoutGuestData = null;

  function injectCheckoutAccountStyles() {
    if (document.getElementById('ecom-extra-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'ecom-extra-styles';
    styleEl.innerHTML = `
      .checkout-layout {
        display: flex;
        gap: 30px;
        max-width: 1200px;
        margin: 30px auto;
        padding: 0 20px;
        font-family: 'Outfit', sans-serif;
        color: #111;
        text-align: left;
      }
      .checkout-main-col {
        flex: 1.7;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .checkout-summary-col {
        flex: 1;
        background: #fdfdfd;
        border: 1px solid #eaeaea;
        border-radius: 12px;
        padding: 24px;
        position: sticky;
        top: 130px;
        height: fit-content;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .checkout-stepper-header {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        margin-bottom: 25px;
        padding: 10px 0;
        border-bottom: 1px solid #eaeaea;
      }
      .checkout-step-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #9ca3af;
      }
      .checkout-step-indicator.active {
        color: #8b5cf6;
        font-weight: 700;
      }
      .checkout-step-indicator.active .step-num {
        background: #8b5cf6;
        color: white;
      }
      .checkout-step-indicator .step-num {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #e5e7eb;
        color: #4b5563;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }
      .checkout-step-indicator.completed {
        color: #10b981;
      }
      .checkout-step-indicator.completed .step-num {
        background: #10b981;
        color: white;
      }
      
      .checkout-card {
        background: white;
        border: 1px solid #eaeaea;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      }
      .checkout-card h3 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 18px;
        font-weight: 700;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 8px;
      }

      /* Estilos Minha Conta Sephora */
      .account-layout {
        display: flex;
        gap: 30px;
        max-width: 1200px;
        margin: 30px auto;
        padding: 0 20px;
        font-family: 'Outfit', sans-serif;
        color: #111;
        text-align: left;
      }
      .account-sidebar-menu {
        width: 250px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-right: 1px solid #eaeaea;
        padding-right: 20px;
        flex-shrink: 0;
      }
      .account-sidebar-menu h3 {
        font-size: 16px;
        font-weight: 700;
        color: #111;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .account-menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 500;
        color: #555;
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.2s;
        cursor: pointer;
      }
      .account-menu-item:hover {
        background: #f5f3ff;
        color: #8b5cf6;
      }
      .account-menu-item.active {
        background: #f5f3ff;
        color: #8b5cf6;
        font-weight: 700;
        border-left: 4px solid #8b5cf6;
        border-radius: 0 8px 8px 0;
      }
      .account-content-pane {
        flex: 1;
        min-height: 500px;
      }
      .loyalty-banner {
        background: linear-gradient(135deg, #180936 0%, #3e126e 100%);
        color: white;
        border-radius: 12px;
        padding: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        position: relative;
        overflow: hidden;
      }
      .loyalty-banner::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -20%;
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: rgba(139, 92, 246, 0.15);
        filter: blur(40px);
      }
      .loyalty-banner h4 {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 5px;
      }
      .loyalty-points {
        text-align: right;
        z-index: 2;
      }
      .loyalty-points span {
        font-size: 11px;
        opacity: 0.8;
        text-transform: uppercase;
      }
      .loyalty-points h2 {
        font-size: 32px;
        font-weight: 800;
        color: #fca5a5;
        line-height: 1;
      }
      .dashboard-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
      }

      /* Stepper Rastreamento */
      .tracking-stepper-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        margin: 30px 0;
        padding: 0 10px;
      }
      .tracking-stepper-container::before {
        content: '';
        position: absolute;
        top: 15px;
        left: 5%;
        right: 5%;
        height: 4px;
        background: #e5e7eb;
        z-index: 1;
      }
      .tracking-stepper-progress-bar {
        position: absolute;
        top: 15px;
        left: 5%;
        height: 4px;
        background: #10b981;
        z-index: 2;
        transition: width 0.4s ease;
      }
      .tracking-step-node {
        position: relative;
        z-index: 3;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 80px;
      }
      .tracking-step-node .node-circle {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #e5e7eb;
        color: #9ca3af;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        transition: all 0.3s;
      }
      .tracking-step-node.active .node-circle {
        background: #8b5cf6;
        color: white;
        box-shadow: 0 0 10px rgba(139,92,246,0.5);
      }
      .tracking-step-node.completed .node-circle {
        background: #10b981;
        color: white;
      }
      .tracking-step-node span {
        font-size: 11px;
        font-weight: 600;
        color: #4b5563;
        text-align: center;
      }
      .tracking-step-node.active span {
        color: #8b5cf6;
        font-weight: 700;
      }
      @media (max-width: 768px) {
        .checkout-layout, .account-layout {
          flex-direction: column;
        }
        .account-sidebar-menu {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid #eaeaea;
          padding-right: 0;
          padding-bottom: 15px;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  function renderCheckoutPage() {
    injectCheckoutAccountStyles();
    
    if (loggedClient && checkoutStep === 1) {
      checkoutStep = 2;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountValue = subtotal * discountPercentage;
    const totalGeral = subtotal - discountValue + selectedShippingPrice;

    appContainer.innerHTML = `
      <div style="background:#fafafa; min-height:100vh; padding-bottom:50px;">
        <!-- Header de Checkout -->
        <header style="background:white; border-bottom:1px solid #eaeaea; padding:15px 30px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
          <a href="#home" style="cursor:pointer;"><img src="/logo-purple-text.png" alt="Purple Logo" style="height:40px;"></a>
          <a href="#home" style="color:#6a3f97; font-weight:600; text-decoration:none; font-size:14px; display:flex; align-items:center; gap:6px;"><i data-lucide="arrow-left" style="width:16px; height:16px;"></i> Continuar Comprando</a>
        </header>

        <div class="checkout-layout">
          <!-- Coluna Principal (Etapas) -->
          <div class="checkout-main-col">
            <!-- Stepper Indicators -->
            <div class="checkout-stepper-header">
              <div class="checkout-step-indicator ${checkoutStep === 1 ? 'active' : (checkoutStep > 1 ? 'completed' : '')}">
                <span class="step-num">${checkoutStep > 1 ? '✓' : '1'}</span> Identificação
              </div>
              <div style="width:40px; height:1px; background:#e5e7eb;"></div>
              <div class="checkout-step-indicator ${checkoutStep === 2 ? 'active' : (checkoutStep > 2 ? 'completed' : '')}">
                <span class="step-num">${checkoutStep > 2 ? '✓' : '2'}</span> Entrega e Frete
              </div>
              <div style="width:40px; height:1px; background:#e5e7eb;"></div>
              <div class="checkout-step-indicator ${checkoutStep === 3 ? 'active' : ''}">
                <span class="step-num">3</span> Pagamento
              </div>
            </div>

            <!-- Card da Etapa Atual -->
            <div class="checkout-card" id="checkout-step-container">
              ${renderCheckoutStepFormHTML(subtotal, discountValue, totalGeral)}
            </div>
          </div>

          <!-- Coluna Resumo Lateral -->
          <div class="checkout-summary-col">
            <h3 style="margin-top:0; font-size:16px; font-weight:700; border-bottom:1px solid #eaeaea; padding-bottom:8px; margin-bottom:15px; color:#111;">Resumo da Sacola</h3>
            
            <div style="display:flex; flex-direction:column; gap:12px; max-height:220px; overflow-y:auto; padding-right:4px; margin-bottom:20px;">
              ${cart.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px;">
                  <span style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#333;">${item.quantity}x ${item.name}</span>
                  <strong style="color:#111;">R$ ${(item.price * item.quantity).toFixed(2)}</strong>
                </div>
              `).join('')}
            </div>

            <div style="border-top:1px solid #eaeaea; padding-top:15px; display:flex; flex-direction:column; gap:8px; font-size:14px; color:#555;">
              <div style="display:flex; justify-content:space-between;">
                <span>Subtotal</span>
                <span>R$ ${subtotal.toFixed(2)}</span>
              </div>
              ${discountPercentage > 0 ? `
                <div style="display:flex; justify-content:space-between; color:#10b981; font-weight:600;">
                  <span>Desconto (10%)</span>
                  <span>- R$ ${discountValue.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display:flex; justify-content:space-between;">
                <span>Frete</span>
                <span>${selectedShippingPrice > 0 ? `R$ ${selectedShippingPrice.toFixed(2)}` : 'A calcular'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-weight:700; font-size:16px; color:#6a3f97; border-top:1px solid #eaeaea; padding-top:8px; margin-top:4px;">
                <span>Total Geral</span>
                <span>R$ ${totalGeral.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="notifications-container" class="notifications-container"></div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    setupCheckoutPageEvents();
  }

  function renderCheckoutStepFormHTML(subtotal, discountValue, totalGeral) {
    if (checkoutStep === 1) {
      return `
        <h3>1. Identificação</h3>
        <div style="display:flex; gap:30px; flex-wrap:wrap; margin-top:20px;">
          <!-- Lado A: Entrar na Conta -->
          <div style="flex:1; min-width:280px; border-right:1px solid #eaeaea; padding-right:30px;">
            <h4 style="font-size:15px; font-weight:600; margin-bottom:12px; color:#111;">Já é cliente? Faça Login</h4>
            <form id="checkout-login-form" style="display:flex; flex-direction:column; gap:12px;">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label for="ch-login-email" style="font-size:12px; font-weight:600; color:#555;">E-mail</label>
                <input type="email" id="ch-login-email" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="seu-email@gmail.com">
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label for="ch-login-password" style="font-size:12px; font-weight:600; color:#555;">Senha</label>
                <input type="password" id="ch-login-password" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="••••••••">
              </div>
              <button type="submit" class="btn btn-primary" style="background:#8b5cf6; color:white; border:none; padding:10px; border-radius:6px; font-weight:600; cursor:pointer; margin-top:8px;">Entrar na Conta</button>
            </form>
          </div>

          <!-- Lado B: Continuar sem Login (Visitante) -->
          <div style="flex:1.2; min-width:280px;">
            <h4 style="font-size:15px; font-weight:600; margin-bottom:12px; color:#111;">Novo por aqui? Compre como Visitante</h4>
            <form id="checkout-guest-form" style="display:flex; flex-direction:column; gap:12px;">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label for="ch-guest-name" style="font-size:12px; font-weight:600; color:#555;">Nome Completo</label>
                <input type="text" id="ch-guest-name" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="Ex: Juliana Santos" value="${checkoutGuestData ? checkoutGuestData.name : ''}">
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label for="ch-guest-email" style="font-size:12px; font-weight:600; color:#555;">E-mail</label>
                <input type="email" id="ch-guest-email" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="juliana@email.com" value="${checkoutGuestData ? checkoutGuestData.email : ''}">
              </div>
              <div style="display:flex; gap:12px;">
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                  <label for="ch-guest-phone" style="font-size:12px; font-weight:600; color:#555;">WhatsApp / Celular</label>
                  <input type="text" id="ch-guest-phone" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="(11) 98888-7777" value="${checkoutGuestData ? checkoutGuestData.phone : ''}">
                </div>
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                  <label for="ch-guest-cpf" style="font-size:12px; font-weight:600; color:#555;">CPF ou CNPJ</label>
                  <input type="text" id="ch-guest-cpf" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="000.000.000-00" value="${checkoutGuestData ? checkoutGuestData.cpf : ''}">
                </div>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label for="ch-guest-birthday" style="font-size:12px; font-weight:600; color:#555;">Data de Nascimento</label>
                <input type="text" id="ch-guest-birthday" required class="input-sm" maxlength="10" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="DD/MM/AAAA" value="${checkoutGuestData ? checkoutGuestData.birthday : ''}">
              </div>
              <button type="submit" class="btn btn-secondary" style="border:1px solid #8b5cf6; color:#8b5cf6; padding:10px; border-radius:6px; font-weight:600; cursor:pointer; background:transparent; margin-top:8px;">Prosseguir como Visitante</button>
            </form>
          </div>
        </div>
      `;
    }

    if (checkoutStep === 2) {
      return `
        <h3>2. Entrega e Opções de Frete</h3>
        
        <!-- Seletor de Modo de Entrega -->
        <div style="display:flex; gap:12px; margin-bottom:20px;">
          <button type="button" id="btn-ch-mode-delivery" class="btn btn-sm" style="flex:1; padding:12px; border-radius:8px; border:2px solid ${selectedDeliveryMode === 'delivery' ? '#8b5cf6' : '#eaeaea'}; background:${selectedDeliveryMode === 'delivery' ? '#f5f3ff' : 'white'}; color:${selectedDeliveryMode === 'delivery' ? '#8b5cf6' : '#555'}; font-weight:bold; cursor:pointer;">
            <i data-lucide="truck" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> Receber em Casa
          </button>
          <button type="button" id="btn-ch-mode-pickup" class="btn btn-sm" style="flex:1; padding:12px; border-radius:8px; border:2px solid ${selectedDeliveryMode === 'pickup' ? '#8b5cf6' : '#eaeaea'}; background:${selectedDeliveryMode === 'pickup' ? '#f5f3ff' : 'white'}; color:${selectedDeliveryMode === 'pickup' ? '#8b5cf6' : '#555'}; font-weight:bold; cursor:pointer;">
            <i data-lucide="store" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> Retirar na Loja
          </button>
        </div>

        <form id="checkout-shipping-form" style="display:flex; flex-direction:column; gap:16px;">
          ${selectedDeliveryMode === 'delivery' ? `
            <div style="background:#fcfcfc; border:1px solid #eaeaea; padding:16px; border-radius:8px; display:flex; flex-direction:column; gap:12px;">
              <h4 style="font-size:14px; font-weight:700; margin:0; color:#333;">Endereço de Entrega</h4>
              
              <div style="display:flex; gap:12px; align-items:flex-end;">
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                  <label for="ch-shipping-cep" style="font-size:11px; font-weight:600; color:#555;">CEP</label>
                  <input type="text" id="ch-shipping-cep" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="00000-000" maxlength="9" value="${calculatedCep}">
                </div>
                <button type="button" id="btn-ch-calc-shipping" class="btn btn-secondary" style="height:36px; padding:0 16px; border-radius:6px; cursor:pointer; background:#e5e7eb; border:none; font-weight:600; color:#333;">Calcular</button>
              </div>

              <!-- Opções de Envio -->
              <div id="ch-shipping-rates" style="display:${calculatedCep ? 'flex' : 'none'}; flex-direction:column; gap:10px; margin-top:10px; background:rgba(139,92,246,0.03); border:1px solid rgba(139,92,246,0.1); padding:12px; border-radius:8px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <input type="radio" name="ch_carrier" id="ch-ship-sedex" value="18.90" data-carrier="Correios SEDEX" ${selectedShippingCarrier === 'Correios SEDEX' ? 'checked' : ''} style="cursor:pointer;" required>
                  <label for="ch-ship-sedex" style="font-size:12px; display:flex; justify-content:space-between; flex-grow:1; cursor:pointer; margin:0;">
                    <span>Correios SEDEX (2 dias)</span>
                    <strong>R$ 18,90</strong>
                  </label>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <input type="radio" name="ch_carrier" id="ch-ship-pac" value="11.50" data-carrier="Correios PAC" ${selectedShippingCarrier === 'Correios PAC' ? 'checked' : ''} style="cursor:pointer;">
                  <label for="ch-ship-pac" style="font-size:12px; display:flex; justify-content:space-between; flex-grow:1; cursor:pointer; margin:0;">
                    <span>Correios PAC (5 dias)</span>
                    <strong>R$ 11,50</strong>
                  </label>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <input type="radio" name="ch_carrier" id="ch-ship-motoboy" value="10.00" data-carrier="Motoboy Express" ${selectedShippingCarrier === 'Motoboy Express' ? 'checked' : ''} style="cursor:pointer;">
                  <label for="ch-ship-motoboy" style="font-size:12px; display:flex; justify-content:space-between; flex-grow:1; cursor:pointer; margin:0;">
                    <span>Motoboy Express (Mesmo dia)</span>
                    <strong>R$ 10,00</strong>
                  </label>
                </div>
              </div>

              <!-- Detalhes do Endereço -->
              <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:10px;">
                <div style="flex:2; display:flex; flex-direction:column; gap:4px; min-width:200px;">
                  <label for="ch-shipping-street" style="font-size:11px; font-weight:600; color:#555;">Rua / Avenida</label>
                  <input type="text" id="ch-shipping-street" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="Ex: Av. Paulista" value="${(loggedClient && loggedClient.address && !loggedClient.address.includes('Retirada')) ? loggedClient.address.split(',')[0] || '' : ''}">
                </div>
                <div style="flex:0.6; display:flex; flex-direction:column; gap:4px; min-width:60px;">
                  <label for="ch-shipping-number" style="font-size:11px; font-weight:600; color:#555;">Número</label>
                  <input type="text" id="ch-shipping-number" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="1000">
                </div>
              </div>
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                  <label for="ch-shipping-complement" style="font-size:11px; font-weight:600; color:#555;">Complemento</label>
                  <input type="text" id="ch-shipping-complement" class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="Ex: Apto 51">
                </div>
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                  <label for="ch-shipping-neighborhood" style="font-size:11px; font-weight:600; color:#555;">Bairro</label>
                  <input type="text" id="ch-shipping-neighborhood" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="Bela Vista">
                </div>
              </div>
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <div style="flex:2; display:flex; flex-direction:column; gap:4px;">
                  <label for="ch-shipping-city" style="font-size:11px; font-weight:600; color:#555;">Cidade</label>
                  <input type="text" id="ch-shipping-city" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="São Paulo">
                </div>
                <div style="flex:0.6; display:flex; flex-direction:column; gap:4px;">
                  <label for="ch-shipping-state" style="font-size:11px; font-weight:600; color:#555;">UF</label>
                  <input type="text" id="ch-shipping-state" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="SP" maxlength="2">
                </div>
              </div>
            </div>
          ` : `
            <div style="background:rgba(139,92,246,0.03); border:1px solid #8b5cf6; padding:16px; border-radius:8px; text-align:left;">
              <h4 style="margin:0 0 6px 0; color:#8b5cf6; font-size:14px; font-weight:700;"><i data-lucide="store" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> Retirada na Loja Física</h4>
              <p style="margin:0; font-size:13px; color:#555; line-height:1.5;">
                Rua Jequirituba, 600 - Jardim Colonial - São Paulo/SP - CEP: 04821-035<br>
                <strong>Frete: R$ 0,00 (Gratuito)</strong>
              </p>
            </div>
          `}

          <div style="display:flex; justify-content:space-between; margin-top:20px;">
            <button type="button" id="btn-ch-step2-back" class="btn btn-secondary" style="border:1px solid #eaeaea; padding:10px 20px; border-radius:6px; cursor:pointer; background:white; color:#555;">Voltar</button>
            <button type="submit" class="btn btn-primary" style="background:#8b5cf6; color:white; border:none; padding:10px 25px; border-radius:6px; font-weight:600; cursor:pointer;">Ir para o Pagamento</button>
          </div>
        </form>
      `;
    }

    if (checkoutStep === 3) {
      return `
        <h3>3. Método de Pagamento</h3>
        
        <div style="display:flex; flex-direction:column; gap:15px; margin-top:15px;">
          <!-- Opção Pix -->
          <label style="cursor:pointer; display:block; border:2px solid ${selectedPaymentMethod === 'pix' ? '#8b5cf6' : '#eaeaea'}; background:${selectedPaymentMethod === 'pix' ? '#f5f3ff' : 'white'}; padding:16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;">
            <div style="display:flex; align-items:center; gap:10px;">
              <input type="radio" name="ch_payment_type" value="pix" ${selectedPaymentMethod === 'pix' ? 'checked' : ''} style="cursor:pointer;">
              <div style="text-align:left;">
                <strong style="font-size:14px; color:#111;">Pix (Aprovação Instantânea)</strong>
                <br><span style="font-size:11px; color:#8b5cf6; font-weight:bold;">Ganhe aprovação imediata no sistema</span>
              </div>
            </div>
            <i data-lucide="qr-code" style="width:24px; height:24px; color:#8b5cf6;"></i>
          </label>

          <!-- Opção Cartão de Crédito -->
          <label style="cursor:pointer; display:block; border:2px solid ${selectedPaymentMethod === 'credit' ? '#8b5cf6' : '#eaeaea'}; background:${selectedPaymentMethod === 'credit' ? '#f5f3ff' : 'white'}; padding:16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;">
            <div style="display:flex; align-items:center; gap:10px;">
              <input type="radio" name="ch_payment_type" value="credit" ${selectedPaymentMethod === 'credit' ? 'checked' : ''} style="cursor:pointer;">
              <div style="text-align:left;">
                <strong style="font-size:14px; color:#111;">Cartão de Crédito</strong>
                <br><span style="font-size:11px; color:#6b7280;">Parcele em até 6x sem juros</span>
              </div>
            </div>
            <i data-lucide="credit-card" style="width:24px; height:24px; color:#8b5cf6;"></i>
          </label>
        </div>

        <form id="checkout-payment-form" style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
          ${selectedPaymentMethod === 'credit' ? `
            <div style="background:#fcfcfc; border:1px solid #eaeaea; padding:16px; border-radius:8px; display:flex; flex-direction:column; gap:12px;">
              <h4 style="font-size:14px; font-weight:700; margin:0; color:#333;">Dados do Cartão</h4>
              
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label for="ch-card-number" style="font-size:11px; font-weight:600; color:#555;">Número do Cartão</label>
                <input type="text" id="ch-card-number" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="0000 0000 0000 0000">
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label for="ch-card-name" style="font-size:11px; font-weight:600; color:#555;">Nome do Titular (Como no Cartão)</label>
                <input type="text" id="ch-card-name" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="Ex: JULIANA S SILVA">
              </div>
              <div style="display:flex; gap:12px;">
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                  <label for="ch-card-expiry" style="font-size:11px; font-weight:600; color:#555;">Validade</label>
                  <input type="text" id="ch-card-expiry" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="MM/AA" maxlength="5">
                </div>
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                  <label for="ch-card-cvv" style="font-size:11px; font-weight:600; color:#555;">CVC / CVV</label>
                  <input type="text" id="ch-card-cvv" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="123" maxlength="4">
                </div>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label for="ch-card-installments" style="font-size:11px; font-weight:600; color:#555;">Parcelamento</label>
                <select id="ch-card-installments" class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none; background:white;">
                  <option value="1">1x de R$ ${totalGeral.toFixed(2)} sem juros</option>
                  <option value="2">2x de R$ ${(totalGeral/2).toFixed(2)} sem juros</option>
                  <option value="3">3x de R$ ${(totalGeral/3).toFixed(2)} sem juros</option>
                  <option value="4">4x de R$ ${(totalGeral/4).toFixed(2)} sem juros</option>
                  <option value="5">5x de R$ ${(totalGeral/5).toFixed(2)} sem juros</option>
                  <option value="6">6x de R$ ${(totalGeral/6).toFixed(2)} sem juros</option>
                </select>
              </div>
            </div>
          ` : `
            <div style="background:rgba(16,185,129,0.03); border:1px solid #10b981; padding:16px; border-radius:8px; text-align:left;">
              <p style="margin:0; font-size:13px; color:#065f46; line-height:1.5;">
                <strong>Pix Selecionado!</strong> O QR Code e a chave copia e cola oficiais do Pix serão exibidos na próxima tela imediatamente após a confirmação.
              </p>
            </div>
          `}

          <div style="display:flex; justify-content:space-between; margin-top:20px;">
            <button type="button" id="btn-ch-step3-back" class="btn btn-secondary" style="border:1px solid #eaeaea; padding:10px 20px; border-radius:6px; cursor:pointer; background:white; color:#555;">Voltar</button>
            <button type="submit" id="btn-ch-submit-order" class="btn btn-primary" style="background:#10b981; color:white; border:none; padding:12px 30px; border-radius:6px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px;">
              <i data-lucide="check-circle" style="width:18px; height:18px;"></i> Finalizar Compra
            </button>
          </div>
        </form>
      `;
    }
  }

  function setupCheckoutPageEvents() {
    // Validador de data de aniversário nos inputs de visitante
    const birthdayInput = document.getElementById('ch-guest-birthday');
    if (birthdayInput) {
      birthdayInput.addEventListener('input', (e) => {
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

    // Máscara simples de CEP
    const cepInput = document.getElementById('ch-shipping-cep');
    if (cepInput) {
      cepInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        if (value.length > 5) {
          value = `${value.slice(0, 5)}-${value.slice(5)}`;
        }
        e.target.value = value;
      });
    }

    // Step 1: Login Form
    const loginForm = document.getElementById('checkout-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('ch-login-email').value.trim().toLowerCase();
        const password = document.getElementById('ch-login-password').value;
        const clients = getClients();
        const matched = clients.find(c => c.email.toLowerCase() === email && c.password === password);

        if (matched) {
          loggedClient = matched;
          sessionStorage.setItem('purple_ecom_logged_in_client', JSON.stringify(matched));
          showNotification('Identificado com sucesso!', 'success');
          checkoutStep = 2;
          renderCheckoutPage();
        } else {
          showNotification('E-mail ou senha incorretos!', 'error');
        }
      });
    }

    // Step 1: Guest Form
    const guestForm = document.getElementById('checkout-guest-form');
    if (guestForm) {
      guestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('ch-guest-name').value.trim();
        const email = document.getElementById('ch-guest-email').value.trim();
        const phone = document.getElementById('ch-guest-phone').value.trim();
        const cpf = document.getElementById('ch-guest-cpf').value.trim();
        const birthday = document.getElementById('ch-guest-birthday').value.trim();

        if (birthday) {
          const parts = birthday.split('/');
          if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
            showNotification('Data de nascimento inválida! Use DD/MM/AAAA', 'error');
            return;
          }
        }

        checkoutGuestData = { name, email, phone, cpf, birthday };
        checkoutStep = 2;
        showNotification('Dados de visitante salvos!', 'success');
        renderCheckoutPage();
      });
    }

    // Step 2: Mode selection
    const modeDeliveryBtn = document.getElementById('btn-ch-mode-delivery');
    const modePickupBtn = document.getElementById('btn-ch-mode-pickup');

    if (modeDeliveryBtn) {
      modeDeliveryBtn.addEventListener('click', () => {
        selectedDeliveryMode = 'delivery';
        renderCheckoutPage();
      });
    }
    if (modePickupBtn) {
      modePickupBtn.addEventListener('click', () => {
        selectedDeliveryMode = 'pickup';
        selectedShippingPrice = 0;
        selectedShippingCarrier = '';
        renderCheckoutPage();
      });
    }

    // Step 2: Calculate Shipping
    const calcShippingBtn = document.getElementById('btn-ch-calc-shipping');
    if (calcShippingBtn) {
      calcShippingBtn.addEventListener('click', () => {
        const cep = cepInput.value.trim();
        if (cep.length < 8) {
          showNotification('Por favor, informe um CEP válido!', 'warning');
          return;
        }
        calculatedCep = cep;
        selectedShippingPrice = 11.50; // PAC as default
        selectedShippingCarrier = 'Correios PAC';
        renderCheckoutPage();
      });
    }

    // Step 2: Carrier selection
    const carrierRadios = document.querySelectorAll('input[name="ch_carrier"]');
    carrierRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        selectedShippingPrice = parseFloat(radio.value);
        selectedShippingCarrier = radio.getAttribute('data-carrier');
        renderCheckoutPage(); // re-renders layout to update summary totals
      });
    });

    // Step 2: Form submit
    const shippingForm = document.getElementById('checkout-shipping-form');
    if (shippingForm) {
      shippingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (selectedDeliveryMode === 'delivery') {
          if (!selectedShippingCarrier) {
            showNotification('Por favor, calcule e selecione uma opção de frete!', 'warning');
            return;
          }
          const street = document.getElementById('ch-shipping-street').value;
          const number = document.getElementById('ch-shipping-number').value;
          const complement = document.getElementById('ch-shipping-complement').value;
          const neighborhood = document.getElementById('ch-shipping-neighborhood').value;
          const city = document.getElementById('ch-shipping-city').value;
          const state = document.getElementById('ch-shipping-state').value;
          const cep = document.getElementById('ch-shipping-cep').value;

          const completeAddress = `${street}, nº ${number}${complement ? ' (' + complement + ')' : ''} - Bairro: ${neighborhood}, ${city}/${state} - CEP: ${cep}`;
          
          if (loggedClient) {
            loggedClient.address = completeAddress;
          } else {
            checkoutGuestData.address = completeAddress;
          }
        } else {
          const pickupAddress = "Retirada na Loja Física: Rua Jequirituba, 600 - Jardim Colonial - São Paulo/SP - CEP: 04821-035";
          if (loggedClient) {
            loggedClient.address = pickupAddress;
          } else {
            checkoutGuestData.address = pickupAddress;
          }
        }
        
        checkoutStep = 3;
        renderCheckoutPage();
      });
    }

    // Step 2: Back Button
    const step2BackBtn = document.getElementById('btn-ch-step2-back');
    if (step2BackBtn) {
      step2BackBtn.addEventListener('click', () => {
        checkoutStep = 1;
        renderCheckoutPage();
      });
    }

    // Step 3: Payment method change
    const paymentRadios = document.querySelectorAll('input[name="ch_payment_type"]');
    paymentRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        selectedPaymentMethod = radio.value;
        renderCheckoutPage();
      });
    });

    // Step 3: Back Button
    const step3BackBtn = document.getElementById('btn-ch-step3-back');
    if (step3BackBtn) {
      step3BackBtn.addEventListener('click', () => {
        checkoutStep = 2;
        renderCheckoutPage();
      });
    }

    // Step 3: Finalize Order Form
    const paymentForm = document.getElementById('checkout-payment-form');
    if (paymentForm) {
      paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-ch-submit-order');
        if (submitBtn) submitBtn.disabled = true;

        let finalClientId = null;
        let finalClientName = '';
        let address = '';

        if (loggedClient) {
          finalClientId = loggedClient.id;
          finalClientName = loggedClient.name;
          address = loggedClient.address || 'Retirada na Loja Física';
        } else {
          address = checkoutGuestData.address || 'Retirada na Loja Física';
          let guestBirthday = '';
          if (checkoutGuestData.birthday) {
            const parts = checkoutGuestData.birthday.split('/');
            guestBirthday = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          const newClient = addClient({
            name: checkoutGuestData.name,
            phone: checkoutGuestData.phone,
            email: checkoutGuestData.email,
            cpfCnpj: checkoutGuestData.cpf,
            birthday: guestBirthday,
            notes: 'Visitante (sem login) via E-Commerce.',
            debt: 0
          });
          finalClientId = newClient.id;
          finalClientName = newClient.name;
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountValue = subtotal * discountPercentage;
        const finalTotalValue = subtotal - discountValue + selectedShippingPrice;

        const saleData = {
          items: cart.map(i => ({
            id: i.id,
            variationId: i.variationId,
            name: i.name,
            price: i.price,
            quantity: i.quantity
          })),
          subtotal: subtotal,
          discount: discountValue,
          shippingFee: selectedShippingPrice,
          shippingCarrier: selectedShippingCarrier || null,
          total: finalTotalValue,
          clientId: finalClientId,
          clientName: finalClientName,
          paymentMethod: selectedPaymentMethod,
          amountPaid: finalTotalValue,
          operator: 'Venda Online (E-Commerce)',
          origin: 'e-commerce',
          deliveryAddress: address,
          coupon: discountPercentage > 0 ? 'PARABENSPURPLE' : null
        };

        try {
          const completedSale = addSale(saleData);
          const config = getConfig();
          
          let customerName = finalClientName;
          let customerEmail = loggedClient ? loggedClient.email : checkoutGuestData.email;
          let customerPhone = loggedClient ? loggedClient.phone : checkoutGuestData.phone;
          let customerCpfCnpj = loggedClient ? (loggedClient.cpfCnpj || '') : checkoutGuestData.cpf;

          if (selectedPaymentMethod === 'credit') {
            // Asaas Credit Card Invoice
            try {
              const response = await fetch('/api/asaas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: completedSale.total,
                  paymentMethod: 'CREDIT_CARD',
                  customerName, customerEmail, customerPhone, customerCpfCnpj,
                  apiKey: config.asaasApiKey,
                  mode: config.asaasMode,
                  orderId: completedSale.id
                })
              });
              if (!response.ok) throw new Error("HTTP " + response.status);
              const result = await response.json();
              if (result && result.success) {
                completedSale.asaasCheckoutUrl = result.checkoutUrl;
              } else {
                throw new Error(result?.error || "Erro de API");
              }
            } catch(err) {
              console.warn("API Asaas offline/erro. Usando simulação para cartão:", err.message);
              completedSale.asaasCheckoutUrl = `https://sandbox.asaas.com/i/simulado_${completedSale.id.split('_')[1] || completedSale.id}`;
            }

            // Salva no LocalStorage
            const salesList = getSales();
            const idx = salesList.findIndex(s => s.id === completedSale.id);
            if (idx !== -1) {
              salesList[idx].asaasCheckoutUrl = completedSale.asaasCheckoutUrl;
              saveSales(salesList);
            }
          } else {
            // Asaas Pix QR code
            try {
              const response = await fetch('/api/asaas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: completedSale.total,
                  paymentMethod: 'PIX',
                  customerName, customerEmail, customerPhone, customerCpfCnpj,
                  apiKey: config.asaasApiKey,
                  mode: config.asaasMode,
                  orderId: completedSale.id
                })
              });
              if (!response.ok) throw new Error("HTTP " + response.status);
              const result = await response.json();
              if (result && result.success) {
                completedSale.asaasPixKey = result.pixKey;
                completedSale.asaasQrCode = result.qrCode;
              } else {
                throw new Error(result?.error || "Erro de API");
              }
            } catch(err) {
              console.warn("API Asaas offline/erro. Usando simulação para Pix:", err.message);
              const mockPixKey = "00020101021226930014br.gov.bcb.pix2571pix-qrcode.asaas.com/v3/simulated_purple_offline_" + Date.now();
              completedSale.asaasPixKey = mockPixKey;
              completedSale.asaasQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(mockPixKey)}`;
            }

            // Salva no LocalStorage
            const salesList = getSales();
            const idx = salesList.findIndex(s => s.id === completedSale.id);
            if (idx !== -1) {
              salesList[idx].asaasPixKey = completedSale.asaasPixKey;
              salesList[idx].asaasQrCode = completedSale.asaasQrCode;
              saveSales(salesList);
            }
          }

          // Limpa carrinho e estados locais
          cart.splice(0, cart.length);
          discountPercentage = 0;
          selectedShippingPrice = 0;
          selectedShippingCarrier = '';
          calculatedCep = '';
          checkoutStep = 1;
          checkoutGuestData = null;
          updateCartUI();

          // Atualiza estoque local
          products = getProducts();
          
          showNotification('Compra realizada com sucesso!', 'success');
          // Redireciona para rastreamento
          window.location.hash = `#pedido_${completedSale.id}`;
        } catch (err) {
          showNotification(err.message, 'error');
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }
  }

  function renderOrderTrackingPage(orderId) {
    injectCheckoutAccountStyles();
    
    const sales = getSales();
    const sale = sales.find(s => s.id === orderId || s.id.replace('s_', '') === orderId);

    if (!sale) {
      appContainer.innerHTML = `
        <div style="background:#fafafa; min-height:100vh; padding:50px 20px; font-family:'Outfit', sans-serif;">
          <div style="max-width:600px; margin:0 auto; background:white; border:1px solid #eaeaea; border-radius:12px; padding:30px; text-align:center;">
            <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin:0 auto 15px auto;"></i>
            <h3>Pedido não encontrado!</h3>
            <p style="color:#555; margin-top:8px;">Não conseguimos localizar nenhuma venda com o código informado: <strong>${orderId}</strong>.</p>
            <a href="#home" class="btn btn-primary" style="background:#8b5cf6; color:white; border:none; padding:10px 20px; border-radius:20px; text-decoration:none; display:inline-block; margin-top:15px; font-weight:bold;">Voltar para as Ofertas</a>
          </div>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const orderDate = new Date(sale.timestamp || sale.date).toLocaleString('pt-BR');
    
    // Status do pedido stepper
    const currentStatus = sale.status || 'Preparando';
    let step1Class = 'completed';
    let step2Class = 'completed';
    let step3Class = 'pending';
    let step4Class = 'pending';
    let progressWidth = '33%';

    if (currentStatus === 'Enviado' || currentStatus === 'Pronto para Retirada') {
      step3Class = 'active';
      progressWidth = '66%';
    } else if (currentStatus === 'Entregue' || currentStatus === 'Finalizada') {
      step3Class = 'completed';
      step4Class = 'completed';
      progressWidth = '100%';
    } else {
      // Preparando
      step2Class = 'active';
    }

    appContainer.innerHTML = `
      <div style="background:#fafafa; min-height:100vh; padding-bottom:50px; font-family:'Outfit', sans-serif;">
        <!-- Header -->
        <header style="background:white; border-bottom:1px solid #eaeaea; padding:15px 30px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
          <a href="#home" style="cursor:pointer;"><img src="/logo-purple-text.png" alt="Purple Logo" style="height:40px;"></a>
          <a href="#home" style="color:#6a3f97; font-weight:600; text-decoration:none; font-size:14px; display:flex; align-items:center; gap:6px;"><i data-lucide="arrow-left" style="width:16px; height:16px;"></i> Ir para a Loja</a>
        </header>

        <div style="max-width:800px; margin:40px auto; padding:0 20px;">
          <!-- Success Hero -->
          <div style="background:white; border:1px solid #eaeaea; border-radius:12px; padding:30px; box-shadow:0 4px 15px rgba(0,0,0,0.03); text-align:center;">
            <div style="background:rgba(16,185,129,0.1); width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 15px auto;">
              <i data-lucide="check-circle" style="width:36px; height:36px; color:#10b981;"></i>
            </div>
            <h2 style="font-size:24px; font-weight:800; color:#111; margin-bottom:5px;">Pedido Recebido com Sucesso!</h2>
            <p style="color:#555; font-size:14px; margin-top:0;">O pagamento foi aprovado e o estoque da Purple já foi reservado.</p>
            
            <div style="display:inline-block; margin-top:15px; background:#f5f3ff; border:1px solid rgba(139,92,246,0.15); padding:8px 16px; border-radius:8px;">
              <span style="font-size:12px; color:#6b7280; text-transform:uppercase; font-weight:600;">Nº do Pedido</span>
              <br><strong style="font-size:16px; color:#6a3f97; font-family:monospace;">#${sale.id.split('_')[1] || sale.id}</strong>
            </div>

            <!-- Stepper Progress -->
            <div class="tracking-stepper-container">
              <div class="tracking-stepper-progress-bar" style="width: ${progressWidth};"></div>
              
              <div class="tracking-step-node ${step1Class}">
                <div class="node-circle"><i data-lucide="file-text" style="width:14px; height:14px;"></i></div>
                <span>Recebido</span>
              </div>
              <div class="tracking-step-node ${step2Class}">
                <div class="node-circle"><i data-lucide="box" style="width:14px; height:14px;"></i></div>
                <span>Preparando</span>
              </div>
              <div class="tracking-step-node ${step3Class}">
                <div class="node-circle"><i data-lucide="truck" style="width:14px; height:14px;"></i></div>
                <span>A Caminho</span>
              </div>
              <div class="tracking-step-node ${step4Class}">
                <div class="node-circle"><i data-lucide="gift" style="width:14px; height:14px;"></i></div>
                <span>Entregue</span>
              </div>
            </div>

            <!-- Asaas Pix Details inside tracking screen (always show for Pix) -->
            ${sale.paymentMethod === 'pix' ? (() => {
              const pixKey = sale.asaasPixKey || ("00020101021226930014br.gov.bcb.pix2571pix-qrcode.asaas.com/v3/simulated_purple_test_" + (sale.id.split('_')[1] || sale.id) + "5204000053039865405" + Number(sale.total).toFixed(2) + "5802BR5925Purple Cosméticos6009Sao Paulo62070503***6304");
              const qrCodeUrl = sale.asaasQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixKey)}`;
              const isSimulated = !sale.asaasPixKey;
              
              return `
                <div style="background:${isSimulated ? '#f5f3ff' : '#f0fdf4'}; border:1px solid ${isSimulated ? '#8b5cf6' : '#10b981'}; border-radius:12px; padding:20px; margin-top:25px; text-align:center;">
                  <h4 style="color:${isSimulated ? '#6a3f97' : '#065f46'}; font-size:14px; font-weight:700; margin:0 0 10px 0;">
                    ${isSimulated ? 'Chave de Pagamento Pix (Simulação Offline)' : 'Chave de Pagamento Pix (Asaas)'}
                  </h4>
                  <div style="margin: 10px auto; width: 160px; height: 160px; padding: 10px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.1);">
                    <img src="${qrCodeUrl}" style="max-width:100%; max-height:100%;">
                  </div>
                  <p style="font-size:11px; color:#666; margin-bottom:8px;">
                    ${isSimulated ? 'Aviso: Esta é uma simulação de pagamento (desenvolvimento/fallback).' : 'Pix Dinâmico Oficial Asaas'}
                  </p>
                  <div style="display:flex; flex-direction:column; gap:8px; max-width:400px; margin:0 auto;">
                    <input type="text" readonly id="track-pix-copy-key" value="${pixKey}" style="width:100%; text-align:center; padding:8px; font-size:11px; font-family:monospace; background:white; border:1px solid ${isSimulated ? '#8b5cf6' : '#10b981'}; color:#333; border-radius:6px; outline:none;">
                    <button type="button" id="btn-track-copy-pix" class="btn btn-secondary btn-sm" style="width:100%; height:34px; border:none; cursor:pointer; background:${isSimulated ? '#8b5cf6' : '#10b981'}; color:white; border-radius:6px; font-weight:bold;"><i data-lucide="copy" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i> Copiar Chave Pix</button>
                  </div>
                </div>
              `;
            })() : ''}

            <!-- Asaas Credit Card Details inside tracking screen (always show for Credit Card) -->
            ${sale.paymentMethod === 'credit' ? (() => {
              const checkoutUrl = sale.asaasCheckoutUrl || `https://sandbox.asaas.com/i/simulado_${sale.id.split('_')[1] || sale.id}`;
              const isSimulated = !sale.asaasCheckoutUrl;
              
              return `
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:20px; margin-top:25px; text-align:center;">
                  <h4 style="color:#111827; font-size:14px; font-weight:700; margin:0 0 10px 0;">
                    ${isSimulated ? 'Pagamento no Cartão (Simulado)' : 'Pagamento no Cartão (Asaas)'}
                  </h4>
                  <p style="font-size:12px; color:#4b5563; margin-bottom:12px;">
                    ${isSimulated ? 'Aviso: Esta é uma simulação de link de fatura (desenvolvimento/fallback).' : 'Se você ainda não preencheu os dados do cartão, clique no botão de pagamento seguro abaixo:'}
                  </p>
                  <a href="${checkoutUrl}" target="_blank" class="btn btn-primary" style="display:inline-block; padding:10px 25px; border-radius:20px; background:#48bb78; color:white; font-weight:bold; text-decoration:none; box-shadow:0 2px 5px rgba(0,0,0,0.1);"><i data-lucide="external-link" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i> Acessar Portal de Pagamento</a>
                </div>
              `;
            })() : ''}
          </div>

          <!-- Resumo Completo do Pedido -->
          <div style="background:white; border:1px solid #eaeaea; border-radius:12px; padding:24px; box-shadow:0 4px 15px rgba(0,0,0,0.03); margin-top:20px; text-align:left;">
            <h3 style="margin-top:0; font-size:16px; font-weight:700; border-bottom:1px solid #eaeaea; padding-bottom:8px; margin-bottom:15px; color:#111;">Resumo do Pedido</h3>
            
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px;">
              ${sale.items.map(item => `
                <div style="display:flex; justify-content:space-between; font-size:13px; color:#333;">
                  <span>${item.quantity}x ${item.name}</span>
                  <strong>R$ ${(item.price * item.quantity).toFixed(2)}</strong>
                </div>
              `).join('')}
            </div>

            <div style="border-top:1px solid #eaeaea; padding-top:12px; display:flex; flex-direction:column; gap:6px; font-size:13px; color:#555;">
              <div style="display:flex; justify-content:space-between;">
                <span>Subtotal</span>
                <span>R$ ${sale.subtotal.toFixed(2)}</span>
              </div>
              ${sale.discount > 0 ? `
                <div style="display:flex; justify-content:space-between; color:#10b981;">
                  <span>Desconto Cupom</span>
                  <span>- R$ ${sale.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display:flex; justify-content:space-between;">
                <span>Valor de Envio</span>
                <span>R$ ${sale.shippingFee.toFixed(2)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-weight:700; font-size:15px; color:#6a3f97; border-top:1px solid #eaeaea; padding-top:6px; margin-top:4px;">
                <span>Total Pago</span>
                <span>R$ ${sale.total.toFixed(2)}</span>
              </div>
            </div>

            <div style="border-top:1px solid #eaeaea; margin-top:15px; padding-top:15px; font-size:13px; color:#555; display:flex; flex-direction:column; gap:6px;">
              <p style="margin:0;"><strong>Cliente da compra:</strong> ${sale.clientName}</p>
              <p style="margin:0;"><strong>Método de Pagamento:</strong> ${sale.paymentMethod.toUpperCase()}</p>
              <p style="margin:0;"><strong>Endereço de Entrega:</strong> ${sale.deliveryAddress || 'Retirada na Loja Física'}</p>
              <p style="margin:0; font-size:11px; color:#718096; margin-top:4px;">Pedido efetuado em: ${orderDate}</p>
            </div>
          </div>
        </div>
      </div>
      <div id="notifications-container" class="notifications-container"></div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Listener de cópia da chave Pix na tela de rastreamento
    const btnTrackCopy = document.getElementById('btn-track-copy-pix');
    if (btnTrackCopy) {
      btnTrackCopy.addEventListener('click', () => {
        const input = document.getElementById('track-pix-copy-key');
        input.select();
        document.execCommand('copy');
        showNotification('Chave Pix copiada com sucesso!', 'success');
      });
    }
  }

  function renderMyAccountPage() {
    injectCheckoutAccountStyles();
    
    // Se o cliente não estiver logado, exibe formulários de login/registro (Estilo Sephora)
    if (!loggedClient) {
      appContainer.innerHTML = `
        <div style="background:#fafafa; min-height:100vh; padding-bottom:50px; font-family:'Outfit', sans-serif;">
          <!-- Header -->
          <header style="background:white; border-bottom:1px solid #eaeaea; padding:15px 30px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
            <a href="#home" style="cursor:pointer;"><img src="/logo-purple-text.png" alt="Purple Logo" style="height:40px;"></a>
            <a href="#home" style="color:#6a3f97; font-weight:600; text-decoration:none; font-size:14px; display:flex; align-items:center; gap:6px;"><i data-lucide="arrow-left" style="width:16px; height:16px;"></i> Continuar Comprando</a>
          </header>

          <div style="max-width:550px; margin:50px auto; padding:0 20px;">
            <div class="checkout-card" style="box-shadow: 0 8px 30px rgba(0,0,0,0.05); border:1px solid #eaeaea;">
              <div style="display:flex; border-bottom:2px solid #f3f4f6; margin-bottom:20px;">
                <button id="btn-acc-tab-login" style="flex:1; padding:12px; background:none; border:none; font-size:16px; font-weight:700; color:#8b5cf6; border-bottom:3px solid #8b5cf6; cursor:pointer;">Entrar</button>
                <button id="btn-acc-tab-register" style="flex:1; padding:12px; background:none; border:none; font-size:16px; font-weight:600; color:#9ca3af; border-bottom:3px solid transparent; cursor:pointer;">Criar Conta</button>
              </div>

              <!-- Login Form -->
              <form id="account-login-form" style="display:flex; flex-direction:column; gap:14px; text-align:left;">
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <label for="acc-email" style="font-size:13px; font-weight:600; color:#4b5563;">E-mail</label>
                  <input type="email" id="acc-email" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:10px; outline:none;" placeholder="ana.silva@email.com">
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <label for="acc-password" style="font-size:13px; font-weight:600; color:#4b5563;">Senha</label>
                  <input type="password" id="acc-password" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:10px; outline:none;" placeholder="Sua senha">
                </div>
                <button type="submit" class="btn btn-primary btn-full" style="background:#8b5cf6; color:white; border:none; padding:12px; border-radius:6px; font-weight:700; cursor:pointer; margin-top:10px; font-size:14px;">Entrar na Conta</button>
              </form>

              <!-- Register Form -->
              <form id="account-register-form" class="hidden" style="display:none; flex-direction:column; gap:14px; text-align:left;">
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <label for="reg-acc-name" style="font-size:13px; font-weight:600; color:#4b5563;">Nome Completo</label>
                  <input type="text" id="reg-acc-name" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:10px; outline:none;" placeholder="Ex: Juliana Santos">
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <label for="reg-acc-email" style="font-size:13px; font-weight:600; color:#4b5563;">E-mail</label>
                  <input type="email" id="reg-acc-email" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:10px; outline:none;" placeholder="juliana@email.com">
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <label for="reg-acc-phone" style="font-size:13px; font-weight:600; color:#4b5563;">WhatsApp</label>
                  <input type="text" id="reg-acc-phone" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:10px; outline:none;" placeholder="(11) 98888-7777">
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <label for="reg-acc-password" style="font-size:13px; font-weight:600; color:#4b5563;">Crie uma Senha</label>
                  <input type="password" id="reg-acc-password" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:10px; outline:none;" placeholder="Mínimo 6 caracteres">
                </div>
                <button type="submit" class="btn btn-primary btn-full" style="background:#8b5cf6; color:white; border:none; padding:12px; border-radius:6px; font-weight:700; cursor:pointer; margin-top:10px; font-size:14px;">Criar minha Conta</button>
              </form>
            </div>
          </div>
        </div>
        <div id="notifications-container" class="notifications-container"></div>
      `;

      if (typeof lucide !== 'undefined') lucide.createIcons();

      // Bind login tabs actions
      const tabLogin = document.getElementById('btn-acc-tab-login');
      const tabReg = document.getElementById('btn-acc-tab-register');
      const formLogin = document.getElementById('account-login-form');
      const formReg = document.getElementById('account-register-form');

      tabLogin.addEventListener('click', () => {
        tabLogin.style.color = '#8b5cf6';
        tabLogin.style.borderBottom = '3px solid #8b5cf6';
        tabReg.style.color = '#9ca3af';
        tabReg.style.borderBottom = '3px solid transparent';
        formLogin.style.display = 'flex';
        formReg.style.display = 'none';
      });

      tabReg.addEventListener('click', () => {
        tabReg.style.color = '#8b5cf6';
        tabReg.style.borderBottom = '3px solid #8b5cf6';
        tabLogin.style.color = '#9ca3af';
        tabLogin.style.borderBottom = '3px solid transparent';
        formLogin.style.display = 'none';
        formReg.style.display = 'flex';
      });

      // Login handler
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('acc-email').value.trim().toLowerCase();
        const password = document.getElementById('acc-password').value;
        const clients = getClients();
        const matched = clients.find(c => c.email.toLowerCase() === email && c.password === password);

        if (matched) {
          loggedClient = matched;
          sessionStorage.setItem('purple_ecom_logged_in_client', JSON.stringify(matched));
          showNotification('Acesso autorizado!', 'success');
          renderMyAccountPage();
        } else {
          showNotification('E-mail ou senha incorretos!', 'error');
        }
      });

      // Registration handler
      formReg.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-acc-name').value.trim();
        const email = document.getElementById('reg-acc-email').value.trim();
        const phone = document.getElementById('reg-acc-phone').value.trim();
        const password = document.getElementById('reg-acc-password').value;

        const clients = getClients();
        if (clients.find(c => c.email.toLowerCase() === email.toLowerCase())) {
          showNotification('E-mail já está em uso por outra conta!', 'error');
          return;
        }

        const newClient = addClient({
          name, phone, email, password,
          birthday: '', notes: 'Conta criada via E-Commerce.', debt: 0
        });

        loggedClient = newClient;
        sessionStorage.setItem('purple_ecom_logged_in_client', JSON.stringify(newClient));
        showNotification('Conta criada com sucesso!', 'success');
        renderMyAccountPage();
      });
      return;
    }

    // Se estiver logado, exibe painel estilo Sephora
    appContainer.innerHTML = `
      <div style="background:#fafafa; min-height:100vh; padding-bottom:50px; font-family:'Outfit', sans-serif;">
        <!-- Header -->
        <header style="background:white; border-bottom:1px solid #eaeaea; padding:15px 30px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
          <a href="#home" style="cursor:pointer;"><img src="/logo-purple-text.png" alt="Purple Logo" style="height:40px;"></a>
          <div style="display:flex; gap:15px; align-items:center;">
            <span style="font-size:13px; color:#555;">Logado como <strong>${sanitizeHTML(loggedClient.name)}</strong></span>
            <a href="#home" style="color:#6a3f97; font-weight:600; text-decoration:none; font-size:14px; display:flex; align-items:center; gap:6px;"><i data-lucide="arrow-left" style="width:16px; height:16px;"></i> Ir para a Loja</a>
          </div>
        </header>

        <div class="account-layout">
          <!-- Sidebar Menu -->
          <div class="account-sidebar-menu">
            <h3>Olá, ${sanitizeHTML(loggedClient.name.split(' ')[0])}!</h3>
            <button class="account-menu-item ${activeAccountTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
              <i data-lucide="home" style="width:16px; height:16px;"></i> Minha Conta
            </button>
            <button class="account-menu-item ${activeAccountTab === 'dados' ? 'active' : ''}" data-tab="dados">
              <i data-lucide="user" style="width:16px; height:16px;"></i> Meus Dados
            </button>
            <button class="account-menu-item ${activeAccountTab === 'pedidos' ? 'active' : ''}" data-tab="pedidos">
              <i data-lucide="shopping-bag" style="width:16px; height:16px;"></i> Meus Pedidos
            </button>
            <button class="account-menu-item ${activeAccountTab === 'enderecos' ? 'active' : ''}" data-tab="enderecos">
              <i data-lucide="map-pin" style="width:16px; height:16px;"></i> Meus Endereços
            </button>
            <div style="margin-top:15px; border-top:1px solid #eaeaea; padding-top:15px;">
              <button id="btn-profile-logout" class="account-menu-item" style="color:#ef4444; width:100%; border:none; background:none; text-align:left; justify-content:flex-start;">
                <i data-lucide="log-out" style="width:16px; height:16px;"></i> Sair da Conta
              </button>
            </div>
          </div>

          <!-- Content Pane -->
          <div class="account-content-pane">
            <div class="checkout-card" style="box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
              ${renderAccountTabContentHTML()}
            </div>
          </div>
        </div>
      </div>
      <div id="notifications-container" class="notifications-container"></div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    setupMyAccountPageEvents();
  }

  function renderAccountTabContentHTML() {
    if (activeAccountTab === 'dashboard') {
      const sales = getSales();
      const clientSales = sales.filter(s => s.clientId === loggedClient.id);
      return `
        <!-- Beauty Club Banner -->
        <div class="loyalty-banner">
          <div>
            <h4>Purple Beauty Club</h4>
            <p style="margin:0; font-size:12px; opacity:0.8;">Faça parte do clube de vantagens e acumule benefícios em maquiagens.</p>
          </div>
          <div class="loyalty-points">
            <span>Seus pontos</span>
            <h2>${clientSales.length * 100}</h2>
          </div>
        </div>

        <h3 style="font-size:18px; font-weight:700; margin-bottom:15px;">Resumo da Conta</h3>
        <div class="dashboard-card-grid">
          <!-- Address box -->
          <div style="border:1px solid #eaeaea; border-radius:8px; padding:16px; display:flex; flex-direction:column; gap:8px;">
            <h4 style="font-size:14px; font-weight:700; color:#333; margin:0; display:flex; align-items:center; gap:6px;"><i data-lucide="map-pin" style="width:16px; height:16px; color:#8b5cf6;"></i> Endereço Principal</h4>
            <p style="font-size:13px; color:#555; margin:0; min-height:40px;">${sanitizeHTML(loggedClient.address) || 'Você não tem endereços cadastrados.'}</p>
            <button id="btn-dash-edit-address" class="btn btn-secondary btn-sm" style="border:1px solid #8b5cf6; color:#8b5cf6; padding:6px; border-radius:6px; cursor:pointer; background:transparent; width:fit-content; font-size:11px; font-weight:bold; margin-top:8px;">Editar Endereço</button>
          </div>

          <!-- Help card -->
          <div style="border:1px solid #eaeaea; border-radius:8px; padding:16px; display:flex; flex-direction:column; gap:8px;">
            <h4 style="font-size:14px; font-weight:700; color:#333; margin:0; display:flex; align-items:center; gap:6px;"><i data-lucide="help-circle" style="width:16px; height:16px; color:#8b5cf6;"></i> Precisa de Ajuda?</h4>
            <p style="font-size:13px; color:#555; margin:0; line-height:1.4;">Fale com nosso Atendimento ao Cliente:<br>E-mail: purplemakeup.contato@gmail.com<br>WhatsApp: <strong>(11) 94903-2024</strong></p>
            <a href="https://wa.me/5511949032024" target="_blank" style="color:#6a3f97; font-weight:bold; font-size:11px; text-decoration:none; margin-top:8px; display:block;">Chamar no WhatsApp ➔</a>
          </div>
        </div>
      `;
    }

    if (activeAccountTab === 'dados') {
      return `
        <h3 style="font-size:18px; font-weight:700; margin-bottom:15px; border-bottom:1px solid #f3f4f6; padding-bottom:8px;">Meus Dados Pessoais</h3>
        <form id="form-acc-update-profile" style="display:flex; flex-direction:column; gap:14px; max-width:480px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label for="prof-name" style="font-size:12px; font-weight:600; color:#4b5563;">Nome Completo</label>
            <input type="text" id="prof-name" value="${loggedClient.name}" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label for="prof-email" style="font-size:12px; font-weight:600; color:#4b5563;">E-mail</label>
            <input type="email" id="prof-email" value="${loggedClient.email}" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;">
          </div>
          <div style="display:flex; gap:12px;">
            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
              <label for="prof-phone" style="font-size:12px; font-weight:600; color:#4b5563;">Celular / WhatsApp</label>
              <input type="text" id="prof-phone" value="${loggedClient.phone}" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;">
            </div>
            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
              <label for="prof-cpf" style="font-size:12px; font-weight:600; color:#4b5563;">CPF ou CNPJ</label>
              <input type="text" id="prof-cpf" value="${loggedClient.cpfCnpj || ''}" class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="000.000.000-00">
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label for="prof-birthday" style="font-size:12px; font-weight:600; color:#4b5563;">Data de Nascimento</label>
            <input type="text" id="prof-birthday" value="${loggedClient.birthday ? loggedClient.birthday.split('-').reverse().join('/') : ''}" class="input-sm" maxlength="10" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;" placeholder="DD/MM/AAAA">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label for="prof-password" style="font-size:12px; font-weight:600; color:#4b5563;">Senha de Acesso</label>
            <input type="password" id="prof-password" value="${loggedClient.password || ''}" required class="input-sm" style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:8px; outline:none;">
          </div>
          <button type="submit" class="btn btn-primary" style="background:#8b5cf6; color:white; border:none; padding:10px 25px; border-radius:6px; font-weight:600; cursor:pointer; width:fit-content; margin-top:8px;">Salvar Alterações</button>
        </form>
      `;
    }

    if (activeAccountTab === 'pedidos') {
      const sales = getSales();
      const clientSales = sales.filter(s => s.clientId === loggedClient.id);

      return `
        <h3 style="font-size:18px; font-weight:700; margin-bottom:15px; border-bottom:1px solid #f3f4f6; padding-bottom:8px;">Meus Pedidos Realizados</h3>
        <div style="display:flex; flex-direction:column; gap:15px; margin-top:15px;">
          ${clientSales.length === 0 ? `
            <p style="color:#666; text-align:center; padding:30px 0;">Você ainda não realizou nenhuma compra online.</p>
          ` : clientSales.reverse().map(sale => {
            const orderDate = new Date(sale.timestamp || sale.date).toLocaleString('pt-BR');
            const statusBadgeColor = sale.status === 'Entregue' ? '#10b981' : (sale.status === 'Enviado' ? '#3b82f6' : '#f59e0b');
            return `
              <div style="border:1px solid #eaeaea; border-radius:8px; padding:16px; display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                  <div>
                    <span style="font-size:11px; text-transform:uppercase; color:#9ca3af; font-weight:600;">Código do Pedido</span>
                    <br><strong style="font-size:14px; color:#6a3f97; font-family:monospace;">#${sale.id.split('_')[1] || sale.id}</strong>
                  </div>
                  <span style="background:${statusBadgeColor}; color:white; font-size:11px; font-weight:bold; padding:4px 10px; border-radius:12px;">${sanitizeHTML(sale.status) || 'Preparando'}</span>
                </div>

                <div style="font-size:13px; color:#555; background:#fcfcfc; padding:10px; border-radius:6px; border:1px solid #f3f4f6;">
                  ${sale.items.map(i => `• ${i.quantity}x ${sanitizeHTML(i.name)}`).join('<br>')}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-top:1px solid #f3f4f6; padding-top:10px; font-size:12px;">
                  <span style="color:#6b7280;">Realizado em: ${orderDate}</span>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <strong style="color:#111; font-size:14px;">Total: R$ ${sale.total.toFixed(2)}</strong>
                    <a href="#pedido_${sale.id}" style="color:#8b5cf6; font-weight:bold; text-decoration:none; display:flex; align-items:center; gap:4px;">Rastrear <i data-lucide="arrow-right" style="width:14px; height:14px;"></i></a>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (activeAccountTab === 'enderecos') {
      return `
        <h3 style="font-size:18px; font-weight:700; margin-bottom:15px; border-bottom:1px solid #f3f4f6; padding-bottom:8px;">Meus Endereços</h3>
        <form id="form-acc-update-address" style="display:flex; flex-direction:column; gap:14px; max-width:480px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label for="prof-address" style="font-size:12px; font-weight:600; color:#4b5563;">Endereço de Entrega Principal</label>
            <textarea id="prof-address" required style="width:100%; border:1px solid #eaeaea; border-radius:6px; padding:10px; outline:none; height:80px; resize:none; font-family:inherit; font-size:13px;" placeholder="Ex: Av. Paulista, 1000 - Apto 51 - Bairro: Bela Vista, São Paulo/SP - CEP: 01310-100">${loggedClient.address || ''}</textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="background:#8b5cf6; color:white; border:none; padding:10px 25px; border-radius:6px; font-weight:600; cursor:pointer; width:fit-content; margin-top:8px;">Salvar Endereço</button>
        </form>
      `;
    }
  }

  function setupMyAccountPageEvents() {
    if (!loggedClient) return;

    // Logout
    const logoutBtn = document.getElementById('btn-profile-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        loggedClient = null;
        sessionStorage.removeItem('purple_ecom_logged_in_client');
        showNotification('Sessão finalizada com sucesso!', 'info');
        window.location.hash = '#home';
      });
    }

    // Eventos do Menu Lateral
    const menuButtons = document.querySelectorAll('.account-menu-item[data-tab]');
    menuButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        activeAccountTab = btn.getAttribute('data-tab');
        renderMyAccountPage();
      });
    });

    // Edição de Endereço no Dashboard trigger
    const editAddrBtn = document.getElementById('btn-dash-edit-address');
    if (editAddrBtn) {
      editAddrBtn.addEventListener('click', () => {
        activeAccountTab = 'enderecos';
        renderMyAccountPage();
      });
    }

    // Formulário de atualização cadastral
    const updateProfileForm = document.getElementById('form-acc-update-profile');
    if (updateProfileForm) {
      const birthdayField = document.getElementById('prof-birthday');
      if (birthdayField) {
        birthdayField.addEventListener('input', (e) => {
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

      updateProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('prof-name').value.trim();
        const email = document.getElementById('prof-email').value.trim();
        const phone = document.getElementById('prof-phone').value.trim();
        const cpfCnpj = document.getElementById('prof-cpf').value.trim();
        const password = document.getElementById('prof-password').value;

        const birthdayRaw = birthdayField.value.trim();
        let birthday = '';
        if (birthdayRaw) {
          const parts = birthdayRaw.split('/');
          if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            birthday = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            showNotification('Data de nascimento inválida! Use DD/MM/AAAA', 'error');
            return;
          }
        }

        const updated = updateClient(loggedClient.id, { name, email, phone, cpfCnpj, birthday, password });
        if (updated) {
          loggedClient = updated;
          sessionStorage.setItem('purple_ecom_logged_in_client', JSON.stringify(updated));
          showNotification('Perfil atualizado com sucesso!', 'success');
          renderMyAccountPage();
        } else {
          showNotification('Erro ao atualizar os dados do perfil.', 'error');
        }
      });
    }

    // Formulário de atualização do endereço
    const updateAddressForm = document.getElementById('form-acc-update-address');
    if (updateAddressForm) {
      updateAddressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const address = document.getElementById('prof-address').value.trim();
        const updated = updateClient(loggedClient.id, { address });
        if (updated) {
          loggedClient = updated;
          sessionStorage.setItem('purple_ecom_logged_in_client', JSON.stringify(updated));
          showNotification('Endereço salvo com sucesso!', 'success');
          renderMyAccountPage();
        } else {
          showNotification('Erro ao salvar endereço.', 'error');
        }
      });
    }
  }

  function router() {
    injectCheckoutAccountStyles();
    const hash = window.location.hash || '#home';
    
    // Fecha gavetas do e-commerce se estiverem abertas
    const cartDrawer = document.getElementById('ecom-cart-drawer');
    if (cartDrawer) cartDrawer.classList.remove('active');
    const favDrawer = document.getElementById('ecom-favorites-drawer');
    if (favDrawer) favDrawer.classList.remove('active');

    // Desativa autoplay do carrossel se não estiver na home
    if (hash !== '#home' && hash !== '#' && hash !== '') {
      if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
      }
    }

    if (hash.startsWith('#pedido_')) {
      const orderId = hash.replace('#pedido_', '');
      renderOrderTrackingPage(orderId);
    } else if (hash === '#carrinho' || hash === '#checkout') {
      renderCheckoutPage();
    } else if (hash.startsWith('#minha-conta')) {
      renderMyAccountPage();
    } else {
      renderLayout();
    }
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);

  function showNotification(msg, type) {
    let nContainer = document.getElementById('notifications-container');
    if (!nContainer) {
      nContainer = document.createElement('div');
      nContainer.id = 'notifications-container';
      nContainer.className = 'notifications-container';
      document.body.appendChild(nContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-msg">${msg}</span>`;
    nContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Inicializa o roteador principal
  router();
});
