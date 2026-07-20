import './style.css';
import { getProducts, addSale, getClients, addClient, getSales, getConfig } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app-ecommerce');
  const cart = [];
  let products = getProducts();
  let selectedCategory = 'Todos';
  let discountPercentage = 0; // Desconto de aniversário (10% = 0.10)
  let selectedShippingPrice = 0;
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
    { minPrice: '549,99', reward: 'UM MERGULHO NA PISCINA DE BRINDES', image: '/gift-box.png' }
  ];
  
  // Estado de login do cliente
  let loggedClient = JSON.parse(sessionStorage.getItem('purple_ecom_logged_in_client')) || null;

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
              <button class="btn-icon" style="color: #333; background:none; border:none; padding:4px;" title="Buscar"><i data-lucide="search"></i></button>
              <button class="btn-icon" style="color: #333; background:none; border:none; padding:4px;" title="Favoritos"><i data-lucide="heart"></i></button>
              <div id="ecom-auth-status" style="display: flex; align-items: center;">
                ${renderAuthStatusHTML()}
              </div>
              <button id="btn-ecom-cart" class="btn btn-secondary" style="background: #6a3f97; color: white; border: none; padding: 8px 16px; display: flex; align-items: center; gap: 6px; border-radius: 20px; font-weight: 500;">
                <i data-lucide="shopping-cart" style="width: 16px; height: 16px;"></i> Carrinho <span class="cart-badge" id="ecom-cart-badge">${cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
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
        <section class="ecom-hero" style="background: #6a3f97; padding: 60px 20px; min-height: 600px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
          <!-- Centered Content Wrapper -->
          <div style="max-width: 1350px; width: 100%; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 120px;">
            <!-- Left text -->
            <div style="flex: 1; text-align: left; max-width: 580px; display: flex; flex-direction: column; justify-content: center; gap: 15px;">
              <h2 style="font-family: 'Outfit', sans-serif; line-height: 0.85; font-weight: 900; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: -3px; display: flex; flex-direction: column;">
                <span style="font-size: 5.6rem; letter-spacing: -2px;">CONDIÇÕES</span>
                <span style="font-size: 8.4rem; letter-spacing: -4px; margin-top: -5px; color: #ffffff;">ESPECIAIS</span>
              </h2>
              <div style="background: linear-gradient(90deg, #9f7aea 0%, #b794f4 100%); color: white; padding: 8px 20px; border-radius: 6px; font-family: '42dot Sans', sans-serif; font-weight: 300; font-size: 1.1rem; width: max-content; white-space: nowrap; margin-top: 5px; box-shadow: 0 4px 15px rgba(159, 122, 234, 0.25);">
                Conecte-se com sua melhor versão e realce a beleza que existe em você.
              </div>
            </div>
            
            <!-- Right carousel container -->
            <div style="flex: 1.6; display: flex; align-items: center; justify-content: center; position: relative; max-width: 720px;">
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

        <!-- Modal de Login / Cadastro de Cliente -->
        <div id="modal-auth" class="modal-overlay">
          <div class="modal-card max-w-md">
            <div class="auth-tabs">
              <button id="tab-login" class="auth-tab-btn active">Entrar</button>
              <button id="tab-register" class="auth-tab-btn">Criar Conta</button>
            </div>

            <!-- Formulário de Login -->
            <form id="form-ecom-login" class="form-group margin-top-md">
              <label for="login-email">E-mail</label>
              <input type="email" id="login-email" placeholder="ana.silva@email.com" required>

              <label for="login-password" class="margin-top-sm">Senha</label>
              <input type="password" id="login-password" placeholder="Sua senha (ex: 123456)" required>

              <button type="submit" class="btn btn-primary btn-full margin-top-md">
                Entrar na Conta
              </button>
            </form>

            <!-- Formulário de Cadastro -->
            <form id="form-ecom-register" class="form-group margin-top-md hidden">
              <label for="reg-name">Nome Completo</label>
              <input type="text" id="reg-name" placeholder="Juliana Santos" required>

              <label for="reg-phone" class="margin-top-xs">Telefone / WhatsApp</label>
              <input type="text" id="reg-phone" placeholder="(11) 98888-7777" required>

              <label for="reg-email" class="margin-top-xs">E-mail</label>
              <input type="email" id="reg-email" placeholder="juliana@email.com" required>

              <label for="reg-cpfcnpj" class="margin-top-xs">CPF ou CNPJ</label>
              <input type="text" id="reg-cpfcnpj" placeholder="000.000.000-00" required>

              <label for="reg-birthday" class="margin-top-xs">Data de Nascimento (Aniversário)</label>
              <input type="text" id="reg-birthday" placeholder="DD/MM/AAAA" maxlength="10" required>

              <label for="reg-password" class="margin-top-xs">Criar Senha</label>
              <input type="password" id="reg-password" placeholder="Mínimo 6 caracteres" required minlength="6">

              <label for="reg-address" class="margin-top-xs">Endereço de Entrega Padrão</label>
              <input type="text" id="reg-address" placeholder="Av. Paulista, 1000 - Apto 51" required>

              <button type="submit" class="btn btn-primary btn-full margin-top-md">
                Criar Conta & Fazer Login
              </button>
            </form>

            <div class="modal-actions margin-top-md">
              <button type="button" id="btn-cancel-auth" class="btn btn-secondary">Fechar</button>
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
            <i data-lucide="user" style="width:16px; height:16px;"></i> Olá, <strong>${loggedClient.name.split(' ')[0]}</strong>
          </span>
          <button id="btn-ecom-logout" class="btn btn-clear btn-sm" title="Sair da Conta">Sair</button>
        </div>
      `;
    } else {
      return `
        <button id="btn-ecom-auth-open" class="btn btn-secondary btn-sm" style="display:flex; align-items:center; gap:4px;">
          <i data-lucide="user"></i> Entrar / Cadastrar
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

    // Tabs de Auth
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-ecom-login');
    const formRegister = document.getElementById('form-ecom-register');

    tabLogin.addEventListener('click', () => showAuthTab('login'));
    tabRegister.addEventListener('click', () => showAuthTab('register'));

    function showAuthTab(tab) {
      if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
      } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
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
        renderLayout();
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
      renderLayout();
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
        openEcomProfile();
      }
      if (e.target.closest('#btn-close-ecom-profile')) {
        document.getElementById('modal-ecom-profile').classList.remove('active');
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
    const filtered = products.filter(p => {
      if (selectedCategory === 'Todos') return true;
      if (selectedCategory === 'Maquiagem') {
        const catLower = p.category.toLowerCase();
        return catLower !== 'skincare' && 
               catLower !== 'acessórios' && 
               catLower !== 'acessorios' && 
               catLower !== 'cabelo' && 
               catLower !== 'corpo';
      }
      return p.category.toLowerCase() === selectedCategory.toLowerCase();
    });

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
      return `
        <div class="ecom-product-card-premium ${isOut ? 'out-of-stock' : ''}" data-id="${p.id}">
          <!-- Image Wrapper -->
          <div class="ecom-card-image-wrapper" style="position: relative; overflow: hidden; border-radius: 12px; width: 286px; height: 381.33px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; z-index: 1;">
            <img src="${p.image}" alt="${p.name}" class="ecom-card-main-image" id="img-${p.id}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease, filter 0.4s ease;" onerror="this.style.display='none';">
            
            <button class="ecom-favorite-btn" style="position: absolute; top: 12px; right: 12px; background: white; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; color: #777; transition: all 0.2s; z-index: 5;">
              <i data-lucide="heart" style="width: 16px; height: 16px;"></i>
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
        const icon = btn.querySelector('i');
        if (btn.classList.contains('favorited')) {
          btn.classList.remove('favorited');
          btn.style.color = '#777';
          showNotification('Removido dos favoritos', 'info');
        } else {
          btn.classList.add('favorited');
          btn.style.color = '#ef4444';
          showNotification('Adicionado aos favoritos!', 'success');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
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
      <div class="cart-summary border-top-purple pad-top-sm">
        ${discountPercentage > 0 || selectedShippingPrice > 0 ? `
          <div class="summary-row">
            <span>Subtotal</span>
            <span>R$ ${subtotal.toFixed(2)}</span>
          </div>
        ` : ''}
        ${discountPercentage > 0 ? `
          <div class="summary-row text-success font-bold" style="display:flex; justify-content:space-between;">
            <span>Desconto Aniversário (10%)</span>
            <span>- R$ ${discountValue.toFixed(2)}</span>
          </div>
        ` : ''}
        ${selectedShippingPrice > 0 ? `
          <div class="summary-row text-purple font-bold" style="display:flex; justify-content:space-between;">
            <span>Envio (${selectedShippingCarrier})</span>
            <span>+ R$ ${selectedShippingPrice.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="summary-row font-bold">
          <span>Total Geral</span>
          <span>R$ ${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <!-- Campo de Cupom de Desconto -->
      <div class="coupon-area margin-top-sm" style="background:rgba(139,92,246,0.03); border:1px dashed var(--border-color); padding:10px; border-radius:var(--radius-sm);">
        <label class="text-xs text-muted font-bold block">Cupom de Desconto</label>
        <div class="flex-row" style="display:flex; gap:8px; align-items:center; margin-top:4px;">
          <input type="text" id="ecom-coupon-input" placeholder="PARABENSPURPLE" class="input-sm" style="flex-grow:1; height:34px;" value="${discountPercentage > 0 ? 'PARABENSPURPLE' : ''}">
          <button type="button" id="btn-ecom-apply-coupon" class="btn btn-secondary btn-sm" style="height:34px; margin-top:0; padding:0 12px;">Aplicar</button>
        </div>
        <div id="ecom-coupon-message" class="text-xs margin-top-xs" style="text-align:left;">
          ${discountPercentage > 0 ? '<span class="text-success font-bold">Cupom PARABENSPURPLE aplicado: 10% de desconto!</span>' : ''}
        </div>
      </div>

      <!-- Opções de Entrega / Retirada -->
      <div class="delivery-mode-selector margin-top-sm" style="display:flex; gap:10px;">
        <label style="flex:1; cursor:pointer; margin:0;">
          <input type="radio" name="delivery_mode" value="delivery" ${selectedDeliveryMode === 'delivery' ? 'checked' : ''} style="display:none;">
          <div class="delivery-mode-card ${selectedDeliveryMode === 'delivery' ? 'active' : ''}" style="border:1.5px solid ${selectedDeliveryMode === 'delivery' ? 'var(--purple-accent)' : 'var(--border-color)'}; background: ${selectedDeliveryMode === 'delivery' ? 'rgba(139,92,246,0.08)' : 'rgba(15,10,30,0.6)'}; padding:8px 6px; border-radius:var(--radius-sm); text-align:center; transition:all 0.2s;">
            <i data-lucide="truck" style="width:16px; height:16px; stroke: ${selectedDeliveryMode === 'delivery' ? 'var(--purple-accent)' : 'var(--text-muted)'}; display:inline-block; vertical-align:middle;"></i>
            <span style="font-size:12px; font-weight:bold; margin-left:4px; vertical-align:middle; color: ${selectedDeliveryMode === 'delivery' ? 'var(--text-main)' : 'var(--text-muted)'};">Receber em Casa</span>
          </div>
        </label>
        <label style="flex:1; cursor:pointer; margin:0;">
          <input type="radio" name="delivery_mode" value="pickup" ${selectedDeliveryMode === 'pickup' ? 'checked' : ''} style="display:none;">
          <div class="delivery-mode-card ${selectedDeliveryMode === 'pickup' ? 'active' : ''}" style="border:1.5px solid ${selectedDeliveryMode === 'pickup' ? 'var(--purple-accent)' : 'var(--border-color)'}; background: ${selectedDeliveryMode === 'pickup' ? 'rgba(139,92,246,0.08)' : 'rgba(15,10,30,0.6)'}; padding:8px 6px; border-radius:var(--radius-sm); text-align:center; transition:all 0.2s;">
            <i data-lucide="store" style="width:16px; height:16px; stroke: ${selectedDeliveryMode === 'pickup' ? 'var(--purple-accent)' : 'var(--text-muted)'}; display:inline-block; vertical-align:middle;"></i>
            <span style="font-size:12px; font-weight:bold; margin-left:4px; vertical-align:middle; color: ${selectedDeliveryMode === 'pickup' ? 'var(--text-main)' : 'var(--text-muted)'};">Retirar na Loja</span>
          </div>
        </label>
      </div>

      ${selectedDeliveryMode === 'delivery' ? `
        <!-- Cálculo de Envio (Melhor Envio Style) -->
        <div class="shipping-calc-box margin-top-sm" style="background:rgba(139,92,246,0.03); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-sm); text-align:left;">
          <label class="text-xs text-muted font-bold block">Calcular Envio (Melhor Envio)</label>
          <div style="display:flex; gap:8px; align-items:center; margin-top:4px;">
            <input type="text" id="ecom-cep-input" placeholder="00000-000" class="input-sm" style="flex-grow:1; height:34px; margin:0;" maxlength="9" value="${calculatedCep}">
            <button type="button" id="btn-ecom-calc-shipping" class="btn btn-secondary btn-sm" style="height:34px; margin-top:0; padding:0 12px;">Calcular</button>
          </div>
          <div id="ecom-shipping-options" class="margin-top-xs" style="display:${calculatedCep ? 'flex' : 'none'}; flex-direction:column; gap:6px;">
            <div class="shipping-carrier-option" style="display:flex; align-items:center; gap:8px; border-bottom:1px solid rgba(139,92,246,0.05); padding:4px 0;">
              <input type="radio" name="shipping_carrier" id="ship-sedex" value="18.90" data-carrier="Correios SEDEX" ${selectedShippingCarrier === 'Correios SEDEX' ? 'checked' : ''} style="cursor:pointer;">
              <label for="ship-sedex" style="font-size:12px; display:flex; justify-content:space-between; flex-grow:1; cursor:pointer; margin:0;">
                <span>Correios SEDEX (2 dias)</span>
                <strong>R$ 18,90</strong>
              </label>
            </div>
            <div class="shipping-carrier-option" style="display:flex; align-items:center; gap:8px; border-bottom:1px solid rgba(139,92,246,0.05); padding:4px 0;">
              <input type="radio" name="shipping_carrier" id="ship-pac" value="11.50" data-carrier="Correios PAC" ${selectedShippingCarrier === 'Correios PAC' ? 'checked' : ''} style="cursor:pointer;">
              <label for="ship-pac" style="font-size:12px; display:flex; justify-content:space-between; flex-grow:1; cursor:pointer; margin:0;">
                <span>Correios PAC (5 dias)</span>
                <strong>R$ 11,50</strong>
              </label>
            </div>
            <div class="shipping-carrier-option" style="display:flex; align-items:center; gap:8px; border-bottom:1px solid rgba(139,92,246,0.05); padding:4px 0;">
              <input type="radio" name="shipping_carrier" id="ship-jadlog" value="14.20" data-carrier="Jadlog Package" ${selectedShippingCarrier === 'Jadlog Package' ? 'checked' : ''} style="cursor:pointer;">
              <label for="ship-jadlog" style="font-size:12px; display:flex; justify-content:space-between; flex-grow:1; cursor:pointer; margin:0;">
                <span>Jadlog Package (4 dias)</span>
                <strong>R$ 14,20</strong>
              </label>
            </div>
            <!-- OPÇÃO MOTOBOY -->
            <div class="shipping-carrier-option" style="display:flex; align-items:center; gap:8px; padding:4px 0;">
              <input type="radio" name="shipping_carrier" id="ship-motoboy" value="0.00" data-carrier="Motoboy (Cálculo via WhatsApp)" ${selectedShippingCarrier === 'Motoboy (Cálculo via WhatsApp)' ? 'checked' : ''} style="cursor:pointer;">
              <label for="ship-motoboy" style="font-size:12px; display:flex; justify-content:space-between; flex-grow:1; cursor:pointer; margin:0;">
                <span>Motoboy (Envio a combinar)</span>
                <strong class="text-purple">Cálculo WhatsApp</strong>
              </label>
            </div>
          </div>
        </div>
      ` : `
        <!-- Informativo de Retirada -->
        <div class="pickup-info-box margin-top-sm" style="background:rgba(139,92,246,0.03); border:1px solid var(--purple-accent); padding:12px; border-radius:var(--radius-sm); text-align:left;">
          <h5 style="margin:0 0 4px 0; color:var(--purple-accent);"><i data-lucide="store" class="icon-inline" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Retirada na Loja Física</h5>
          <p class="text-sm" style="margin:0; line-height:1.4; color:var(--text-muted);">
            Rua Jequirituba, 600 - Jardim Colonial - São Paulo/SP - CEP: 04821-035<br>
            <strong>Custo de Frete: R$ 0,00 (Gratuito)</strong>
          </p>
        </div>
      `}

      <div class="checkout-client-banner margin-top-sm">
        ${renderCheckoutClientStatusHTML()}
      </div>

      <form id="ecom-form-checkout" class="form-group margin-top-md text-left" style="display:flex; flex-direction:column; gap:16px; width:100%; padding-bottom:30px;">
        <h4 style="margin: 0 0 5px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; font-family:'Outfit', sans-serif;">Dados de Entrega & Pagamento</h4>
        
        ${loggedClient ? `
          <div class="logged-checkout-info" style="display:flex; flex-direction:column; gap:8px; background: rgba(255,255,255,0.05); padding:12px; border-radius:8px;">
            <p style="margin:0;"><strong>Nome:</strong> ${loggedClient.name}</p>
            <p style="margin:0;"><strong>WhatsApp:</strong> ${loggedClient.phone}</p>
            <p style="margin:0;"><strong>E-mail:</strong> ${loggedClient.email}</p>
            ${selectedDeliveryMode === 'delivery' ? `
              <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                <label for="ecom-address" style="font-weight:bold; font-size:12px;">Endereço de Entrega</label>
                <input type="text" id="ecom-address" value="${loggedClient.address || ''}" placeholder="Av. Paulista, 1000 - Apto 51" class="input-sm" required style="width:100%;">
              </div>
            ` : `
              <p style="margin:8px 0 0 0; font-size:12px; color:#b794f4;"><strong>Entrega:</strong> Retirada na Loja Física</p>
              <input type="hidden" id="ecom-address" value="Retirada na Loja Física">
            `}
          </div>
        ` : `
          <div id="ecom-guest-fields" style="display:flex; flex-direction:column; gap:14px; width:100%;">
            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
              <label for="ecom-name" style="font-size:13px; font-weight:500;">Nome Completo</label>
              <input type="text" id="ecom-name" placeholder="Juliana Santos" class="input-sm" required style="width:100%; margin:0;">
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
              <label for="ecom-email" style="font-size:13px; font-weight:500;">E-mail</label>
              <input type="email" id="ecom-email" placeholder="juliana@email.com" class="input-sm" required style="width:100%; margin:0;">
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
              <label for="ecom-phone" style="font-size:13px; font-weight:500;">WhatsApp / Celular</label>
              <input type="text" id="ecom-phone" placeholder="(11) 98888-7777" class="input-sm" required style="width:100%; margin:0;">
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
              <label for="ecom-cpfcnpj" style="font-size:13px; font-weight:500;">CPF ou CNPJ (Obrigatório para Emissão)</label>
              <input type="text" id="ecom-cpfcnpj" placeholder="000.000.000-00" class="input-sm" required style="width:100%; margin:0;">
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
              <label for="ecom-birthday" style="font-size:13px; font-weight:500;">Data de Nascimento (Aniversário)</label>
              <input type="text" id="ecom-birthday" placeholder="DD/MM/AAAA" class="input-sm" maxlength="10" required style="width:100%; margin:0;">
            </div>

            ${selectedDeliveryMode === 'delivery' ? `
              <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                <label for="ecom-address" style="font-size:13px; font-weight:500;">Endereço de Entrega</label>
                <input type="text" id="ecom-address" placeholder="Av. Paulista, 1000 - Apto 51" class="input-sm" required style="width:100%; margin:0;">
              </div>
            ` : `
              <input type="hidden" id="ecom-address" value="Retirada na Loja Física">
            `}
          </div>
        `}

        <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
          <label for="ecom-payment" style="font-size:13px; font-weight:500;">Método de Pagamento</label>
          <select id="ecom-payment" class="input-sm" required style="width:100%; margin:0;">
            <option value="pix">Pix (Aprovação Rápida)</option>
            <option value="credit">Cartão de Crédito Online</option>
            <option value="debit">Cartão de Débito Online</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top:10px; width:100%; font-family:'Outfit', sans-serif;">
          <i data-lucide="check"></i> Concluir Pedido
        </button>
      </form>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    setupCartCheckoutEvents(finalTotal);
  }

  function renderCheckoutClientStatusHTML() {
    if (loggedClient) {
      return `
        <div class="checkout-login-alert success">
          <span>Identificado como: <strong>${loggedClient.name}</strong></span>
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
        document.getElementById('success-order-id').textContent = completedSale.id.split('_')[1] || completedSale.id;
        
        // Resetar textos/botões para o padrão antes de alterar
        const modalTitle = modal.querySelector('h2');
        const modalSub = modal.querySelector('p.text-muted');
        const successBox = modal.querySelector('.success-order-box');
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

  function showNotification(msg, type) {
    const nContainer = document.getElementById('notifications-container');
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

  // Inicializa o layout completo
  renderLayout();
});
