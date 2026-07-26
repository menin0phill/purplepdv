import './style.css';
import { renderPDV } from './components/pdv.js';
import { renderCaixa, updateNavbarCashStatus } from './components/caixa.js';
import { renderProdutos } from './components/produtos.js';
import { renderDashboard } from './components/dashboard.js';
import { renderClientes } from './components/clientes.js';
import { renderConfig } from './components/config.js';
import { renderPedidos } from './components/pedidos.js';
import { getConfig, syncWithSupabase, getOperators } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  
  // Controle de Sessão de Operador do Caixa
  const activeOperator = sessionStorage.getItem('purple_pdv_active_operator');
  if (!activeOperator) {
    renderLoginScreen();
  } else {
    initializeDashboard();
  }

  function renderLoginScreen() {
    appContainer.innerHTML = `
      <div class="purple-login-page">
        <!-- Left Side: Form -->
        <div class="login-left-side">
          <div class="login-left-container">
            <div class="login-logo-header">
              <img src="/logo-purple.jpg" alt="Purple Logo" class="login-logo" onerror="this.src='https://instagram.fcgh13-1.fna.fbcdn.net/v/t51.82787-19/651031849_17966874450019045_9100807247552984597_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby44NDAuYzIifQ&_nc_ht=instagram.fcgh13-1.fna.fbcdn.net&_nc_cat=101&_nc_oc=Q6cZ2gHycOL9sD5xHY5FxNSgRSX2zXUNVbGhAFMCU2-eHb6Rysf1xxtGQbgLfuARnbBShC1lgu2RruKYQIc0-pCxF8Jl&_nc_ohc=EZMEJ4HLGO4Q7kNvwGewcRG&_nc_gid=6p0a7wHTtBkcfZVdLzYGpA&edm=APoiHPcBAAAA&ccb=7-5&oh=00_AQBAhoUNv7U6FBEqNAlimY0YwkPKb_5xZ83ur54LbSVd8g&oe=6A62003B&_nc_sid=22de04'">
              <span class="login-logo-text">Purple</span>
            </div>
            
            <div class="login-form-wrapper">
              <h2>Bem-vindo ao Purple PDV 👋</h2>
              <p class="login-subtitle">Preencha os seus dados de acesso abaixo para entrar no PDV.</p>
              
              <form id="purple-login-form">
                <div class="login-input-group">
                  <label for="login-email">Endereço de E-mail</label>
                  <input type="email" id="login-email" required placeholder="seu-email@gmail.com">
                </div>
                
                <div class="login-input-group" style="margin-bottom:20px;">
                  <label for="login-password">Senha de Acesso</label>
                  <div class="password-input-wrapper">
                    <input type="password" id="login-password" required placeholder="••••••••••••">
                    <button type="button" id="btn-toggle-login-password" class="btn-toggle-login-password">
                      <i data-lucide="eye" style="width: 18px; height: 18px;"></i>
                    </button>
                  </div>
                </div>

                <!-- Widget Real do Cloudflare Turnstile -->
                <div style="margin: 15px 0 25px 0; display: flex; justify-content: center; min-height: 65px;">
                  <div id="cf-turnstile-widget"></div>
                </div>
                
                <button type="submit" id="btn-login-submit" class="btn-login-submit" disabled style="opacity: 0.5; cursor: not-allowed; transition: all 0.3s ease;">Entrar no PDV</button>
              </form>
            </div>
            
            <div style="font-size:12px; color:#a0aec0; margin-top:30px;">
              © 2026 Purple Cosméticos. Todos os direitos reservados.
            </div>
          </div>
        </div>
        
        <!-- Right Side: Graphic Visuals -->
        <div class="login-right-side">
          <div class="login-right-card">
            <h3>Conectando Beleza e Tecnologia</h3>
            <p>Acesse o sistema de gerenciamento de vendas e controle de estoque de forma segura e rápida.</p>
          </div>
          
          <div class="login-right-slogan">
            Beleza que Inspira
          </div>
          
          <div class="login-right-dots">
            <span class="dot-arrow">&lt;</span>
            <span class="dot active"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot-arrow">&gt;</span>
          </div>
        </div>
      </div>
      <div id="notifications-container" class="notifications-container"></div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Inicialização da verificação do Cloudflare Turnstile Real com Fallback Off-line
    const btnSubmit = document.getElementById('btn-login-submit');
    let isCaptchaVerified = false;

    if (window.turnstile) {
      try {
        window.turnstile.render('#cf-turnstile-widget', {
          sitekey: import.meta.env.VITE_TURNSTILE_SITEKEY || '1x00000000000000000000AA', 
          theme: 'dark',
          callback: function(token) {
            isCaptchaVerified = true;
            if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.style.opacity = '1';
              btnSubmit.style.cursor = 'pointer';
            }
          },
          'expired-callback': function() {
            isCaptchaVerified = false;
            if (btnSubmit) {
              btnSubmit.disabled = true;
              btnSubmit.style.opacity = '0.5';
              btnSubmit.style.cursor = 'not-allowed';
            }
          },
          'error-callback': function() {
            isCaptchaVerified = false;
            if (btnSubmit) {
              btnSubmit.disabled = true;
              btnSubmit.style.opacity = '0.5';
              btnSubmit.style.cursor = 'not-allowed';
            }
          }
        });
      } catch (err) {
        console.error("Erro ao inicializar o Cloudflare Turnstile:", err);
      }
    } else {
      console.warn("Script do Cloudflare Turnstile não carregado. Ativando fallback de segurança...");
      const widget = document.getElementById('cf-turnstile-widget');
      if (widget) {
        widget.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px; padding:10px; background:rgba(255,255,255,0.05); border-radius:6px; border:1px solid rgba(255,255,255,0.1); width: 100%; justify-content: center; box-sizing: border-box;">
            <input type="checkbox" id="fallback-captcha" style="width:18px; height:18px; cursor:pointer;">
            <label for="fallback-captcha" style="font-size:13px; color:#cbd5e1; cursor:pointer; user-select:none;">Confirmar que não sou um robô (Modo de Segurança)</label>
          </div>
        `;
        document.getElementById('fallback-captcha').addEventListener('change', (e) => {
          isCaptchaVerified = e.target.checked;
          if (btnSubmit) {
            btnSubmit.disabled = !isCaptchaVerified;
            btnSubmit.style.opacity = isCaptchaVerified ? '1' : '0.5';
            btnSubmit.style.cursor = isCaptchaVerified ? 'pointer' : 'not-allowed';
          }
        });
      }
    }

    // Toggle Password Visibility Action
    const passwordInput = document.getElementById('login-password');
    const toggleBtn = document.getElementById('btn-toggle-login-password');
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleBtn.innerHTML = type === 'password'
          ? `<i data-lucide="eye" style="width: 18px; height: 18px;"></i>`
          : `<i data-lucide="eye-off" style="width: 18px; height: 18px;"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
    }

    // Submit Action
    const loginForm = document.getElementById('purple-login-form');
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!isCaptchaVerified) {
        showNotification('Por favor, marque a caixa de verificação humana!', 'error');
        return;
      }

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      
      const operators = getOperators();
      const matched = operators.find(op => op.email.toLowerCase() === email.toLowerCase() && op.password === password);
      
      if (matched) {
        sessionStorage.setItem('purple_pdv_active_operator', JSON.stringify(matched));
        if (matched.role === 'admin') {
          sessionStorage.setItem('purple_admin_authenticated', 'true');
        }
        initializeDashboard();
      } else {
        showIncorrectCredentialsPopup();
        // Reseta o captcha no login incorreto para prevenir ataques de força bruta
        if (window.turnstile) {
          try {
            window.turnstile.reset('#cf-turnstile-widget');
          } catch (e) {
            console.error("Erro ao resetar Turnstile:", e);
          }
          isCaptchaVerified = false;
          if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.style.opacity = '0.5';
            btnSubmit.style.cursor = 'not-allowed';
          }
        } else {
          const fallbackCheckbox = document.getElementById('fallback-captcha');
          if (fallbackCheckbox) {
            fallbackCheckbox.checked = false;
            isCaptchaVerified = false;
            if (btnSubmit) {
              btnSubmit.disabled = true;
              btnSubmit.style.opacity = '0.5';
              btnSubmit.style.cursor = 'not-allowed';
            }
          }
        }
      }
    });
  }

  function showIncorrectCredentialsPopup() {
    let popup = document.getElementById('login-error-popup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'login-error-popup';
      popup.className = 'modal-overlay active';
      popup.style.zIndex = '99999';
      popup.innerHTML = `
        <div class="modal-card max-w-sm text-center scale-in" style="background: #1a0f2e; color: #fff; border: 2px solid #8b5cf6; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="background: rgba(239, 68, 68, 0.15); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; border: 1px solid #ef4444;">
            <i data-lucide="alert-triangle" style="width: 32px; height: 32px; color: #ef4444;"></i>
          </div>
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Acesso Negado</h3>
          <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 20px; line-height: 1.5;">
            E-mail ou senha do operador incorretos! Por favor, verifique as suas credenciais e tente novamente.
          </p>
          <button type="button" id="btn-close-error-popup" class="btn btn-primary" style="width: 100%; height: 42px; border-radius: 8px; font-weight: 600; font-family: 'Outfit', sans-serif; background: #8b5cf6; border: none; cursor: pointer; color: white;">
            Tentar Novamente
          </button>
        </div>
      `;
      document.body.appendChild(popup);
      if (typeof lucide !== 'undefined') lucide.createIcons();

      document.getElementById('btn-close-error-popup').addEventListener('click', () => {
        popup.classList.remove('active');
        setTimeout(() => popup.remove(), 200);
      });
    }
  }

  function showNotification(msg, type) {
    const container = document.getElementById('notifications-container');
    if (!container) return;
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

  function initializeDashboard() {
    const operator = JSON.parse(sessionStorage.getItem('purple_pdv_active_operator')) || { name: 'Operador' };
    
    appContainer.innerHTML = `
      <div class="app-layout">
        <!-- Sidebar de Navegação -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <img src="/logo-purple.jpg" alt="Purple Logo" class="sidebar-logo" onerror="this.src='https://instagram.fcgh13-1.fna.fbcdn.net/v/t51.82787-19/651031849_17966874450019045_9100807247552984597_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby44NDAuYzIifQ&_nc_ht=instagram.fcgh13-1.fna.fbcdn.net&_nc_cat=101&_nc_oc=Q6cZ2gHycOL9sD5xHY5FxNSgRSX2zXUNVbGhAFMCU2-eHb6Rysf1xxtGQbgLfuARnbBShC1lgu2RruKYQIc0-pCxF8Jl&_nc_ohc=EZMEJ4HLGO4Q7kNvwGewcRG&_nc_gid=6p0a7wHTtBkcfZVdLzYGpA&edm=APoiHPcBAAAA&ccb=7-5&oh=00_AQBAhoUNv7U6FBEqNAlimY0YwkPKb_5xZ83ur54LbSVd8g&oe=6A62003B&_nc_sid=22de04'">
            <div class="sidebar-brand-text">
              <h2>Purple</h2>
              <span>Frente de Caixa</span>
              <div class="operator-badge" style="margin-top: 8px; font-size: 11px; background: rgba(139, 92, 246, 0.15); color: #c084fc; padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; gap: 6px; border: 1px solid rgba(139, 92, 246, 0.25);">
                <span>👤 ${operator.name}</span>
                <a href="#" id="btn-operator-logout" title="Sair do Caixa" style="color: #ef4444; font-weight: bold; text-decoration: none; font-size: 13px; cursor: pointer;">✕</a>
              </div>
            </div>
          </div>

          <nav class="sidebar-nav">
            <button class="nav-item active" data-screen="pdv">
              <i data-lucide="shopping-bag"></i> <span>PDV (Vendas)</span>
            </button>
            <button class="nav-item" data-screen="caixa">
              <i data-lucide="calculator"></i> <span>Caixa</span>
            </button>
            <button class="nav-item" data-screen="produtos">
              <i data-lucide="package"></i> <span>Produtos</span>
            </button>
            <button class="nav-item" data-screen="clientes">
              <i data-lucide="users"></i> <span>Clientes</span>
            </button>
            <button class="nav-item" data-screen="pedidos">
              <i data-lucide="shopping-cart"></i> <span>Pedidos E-Com</span>
            </button>
            <button class="nav-item" data-screen="dashboard">
              <i data-lucide="bar-chart-3"></i> <span>Relatórios</span>
            </button>
            <button class="nav-item" data-screen="config">
              <i data-lucide="settings"></i> <span>Configurações</span>
            </button>
          </nav>

          <div class="sidebar-footer">
            <img src="/logo-purple.jpg" alt="Purple Logo" class="footer-logo" onerror="this.src='https://instagram.fcgh13-1.fna.fbcdn.net/v/t51.82787-19/651031849_17966874450019045_9100807247552984597_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby44NDAuYzIifQ&_nc_ht=instagram.fcgh13-1.fna.fbcdn.net&_nc_cat=101&_nc_oc=Q6cZ2gHycOL9sD5xHY5FxNSgRSX2zXUNVbGhAFMCU2-eHb6Rysf1xxtGQbgLfuARnbBShC1lgu2RruKYQIc0-pCxF8Jl&_nc_ohc=EZMEJ4HLGO4Q7kNvwGewcRG&_nc_gid=6p0a7wHTtBkcfZVdLzYGpA&edm=APoiHPcBAAAA&ccb=7-5&oh=00_AQBAhoUNv7U6FBEqNAlimY0YwkPKb_5xZ83ur54LbSVd8g&oe=6A62003B&_nc_sid=22de04'">
            <span class="text-xs text-muted">© 2026 Purple Cosméticos</span>
          </div>
        </aside>

        <!-- Painel Principal de Conteúdo -->
        <main class="main-content">
          <!-- Top Navbar -->
          <header class="top-navbar">
            <div class="navbar-left">
              <button id="btn-toggle-sidebar" class="btn-icon mobile-only">
                <i data-lucide="menu"></i>
              </button>
              <h2 id="navbar-title">Frente de Caixa (PDV)</h2>
            </div>
            <div class="navbar-right">
              <div id="navbar-cash-status" class="status-indicator closed">
                Caixa Fechado
              </div>
            </div>
          </header>

          <!-- Container Dinâmico -->
          <div id="screen-container" class="screen-container"></div>
        </main>
      </div>

      <!-- Container Global para Toasts/Notificações -->
      <div id="notifications-container" class="notifications-container"></div>
    `;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    const screenContainer = document.getElementById('screen-container');
    const navItems = document.querySelectorAll('.nav-item');
    const navbarTitle = document.getElementById('navbar-title');
    const sidebar = document.querySelector('.sidebar');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnLogout = document.getElementById('btn-operator-logout');

    // Ação de Logout do Operador
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('purple_pdv_active_operator');
        sessionStorage.removeItem('purple_admin_authenticated');
        window.location.reload();
      });
    }

    // Mapa de telas e funções de renderização
    const screens = {
      pdv: { title: 'Frente de Caixa (PDV)', render: renderPDV },
      caixa: { title: 'Controle de Caixa', render: renderCaixa },
      produtos: { title: 'Cadastro de Produtos', render: renderProdutos },
      clientes: { title: 'Gestão de Clientes', render: renderClientes },
      pedidos: { title: 'Pedidos Online', render: renderPedidos },
      dashboard: { title: 'Painel de Relatórios', render: renderDashboard },
      config: { title: 'Configurações Gerais', render: renderConfig }
    };

    // Controle de Acesso Restrito (Admin)
    const restrictedScreens = ['caixa', 'produtos', 'dashboard', 'config'];

    // Injeta o modal de bloqueio Admin
    const lockModal = document.createElement('div');
    lockModal.id = 'modal-admin-lock';
    lockModal.className = 'modal-overlay';
    lockModal.innerHTML = `
      <div class="modal-card max-w-sm text-center scale-in" style="background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color);">
        <div style="background-color: var(--border-color); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
          <i data-lucide="lock" class="icon-lg text-purple" style="width: 32px; height: 32px; color: var(--primary);"></i>
        </div>
        <h3 class="text-lg font-bold">Painel Restrito (Admin)</h3>
        <p class="text-muted text-sm margin-top-xs">
          Insira o PIN Administrativo para acessar esta tela.
        </p>
        
        <form id="form-admin-lock" class="margin-top-md">
          <input type="password" id="admin-pin-input" placeholder="PIN (Padrão: 1234)" maxlength="8" required 
                 style="width: 100%; text-align: center; font-size: 20px; letter-spacing: 6px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: white; border-radius: 8px; margin-bottom: 15px;">
          <div class="modal-actions" style="display: flex; gap: 8px;">
            <button type="button" id="btn-cancel-admin-lock" class="btn btn-secondary" style="flex: 1;">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="flex: 1;">Acessar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(lockModal);

    function openAdminLockModal(targetScreen) {
      const lockModalEl = document.getElementById('modal-admin-lock');
      const formEl = document.getElementById('form-admin-lock');
      const inputEl = document.getElementById('admin-pin-input');
      const cancelBtn = document.getElementById('btn-cancel-admin-lock');
      
      inputEl.value = '';
      lockModalEl.classList.add('active');
      setTimeout(() => inputEl.focus(), 150);
      
      // Clona elementos para limpar listeners passados
      const newForm = formEl.cloneNode(true);
      formEl.parentNode.replaceChild(newForm, formEl);
      
      const newCancel = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

      newCancel.addEventListener('click', () => {
        lockModalEl.classList.remove('active');
      });

      newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pinValue = newForm.querySelector('#admin-pin-input').value;
        const currentConfig = getConfig();
        const correctPin = currentConfig.adminPin || '1234';
        
        if (pinValue === correctPin) {
          sessionStorage.setItem('purple_admin_authenticated', 'true');
          lockModalEl.classList.remove('active');
          showNotification('Acesso administrativo liberado!', 'success');
          updateAdminLockIndicator();
          navigate(targetScreen);
        } else {
          showNotification('PIN incorreto!', 'error');
          newForm.querySelector('#admin-pin-input').value = '';
          newForm.querySelector('#admin-pin-input').focus();
        }
      });
    }

    function updateAdminLockIndicator() {
      const navbarRight = document.querySelector('.navbar-right');
      if (!navbarRight) return;
      
      let statusEl = document.getElementById('navbar-admin-status');
      if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'navbar-admin-status';
        statusEl.className = 'status-indicator';
        navbarRight.insertBefore(statusEl, document.getElementById('navbar-cash-status'));
      }
      
      const isAdmin = sessionStorage.getItem('purple_admin_authenticated') === 'true';
      if (isAdmin) {
        statusEl.className = 'status-indicator success';
        statusEl.style.cursor = 'pointer';
        statusEl.style.display = 'flex';
        statusEl.style.alignItems = 'center';
        statusEl.style.gap = '4px';
        statusEl.style.marginRight = '8px';
        statusEl.title = 'Bloquear Acesso Administrativo';
        statusEl.innerHTML = `<i data-lucide="lock-open" style="width:14px; height:14px;"></i> Admin (Sair)`;
      } else {
        statusEl.className = 'status-indicator closed';
        statusEl.style.cursor = 'pointer';
        statusEl.style.display = 'flex';
        statusEl.style.alignItems = 'center';
        statusEl.style.gap = '4px';
        statusEl.style.marginRight = '8px';
        statusEl.title = 'Acessar Painel Administrativo';
        statusEl.innerHTML = `<i data-lucide="lock" style="width:14px; height:14px;"></i> Admin (Entrar)`;
      }

      // Toggle Admin Status Manual Click
      statusEl.onclick = (e) => {
        e.preventDefault();
        const isCurrentlyAdmin = sessionStorage.getItem('purple_admin_authenticated') === 'true';
        if (isCurrentlyAdmin) {
          sessionStorage.removeItem('purple_admin_authenticated');
          showNotification('Sessão de administrador encerrada.', 'info');
          updateAdminLockIndicator();
          navigate('pdv');
        } else {
          openAdminLockModal(currentScreen);
        }
      };
    }

    let currentScreen = 'pdv';

    // Função para navegar
    function navigate(screenName) {
      currentScreen = screenName;
      if (restrictedScreens.includes(screenName) && sessionStorage.getItem('purple_admin_authenticated') !== 'true') {
        openAdminLockModal(screenName);
        return;
      }

      // Remove classe ativa de todos e adiciona no atual
      navItems.forEach(item => {
        if (item.getAttribute('data-screen') === screenName) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Atualiza título do topo
      const screenInfo = screens[screenName];
      if (screenInfo) {
        navbarTitle.textContent = screenInfo.title;
        // Limpa e renderiza nova tela
        screenContainer.innerHTML = '';
        screenInfo.render(screenContainer);
      }

      // Fecha a sidebar no mobile se estiver aberta
      sidebar.classList.remove('active');
    }

    // Configuração dos itens da sidebar
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.getAttribute('data-screen');
        navigate(target);
      });
    });

    // Toggle Sidebar Mobile
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });
    }

    // Inicializa o status do caixa no navbar
    updateNavbarCashStatus();
    updateAdminLockIndicator();

    // Navega para a tela padrão (PDV)
    navigate('pdv');

    // Sincronização inicial em background
    syncWithSupabase().then(() => {
      navigate(currentScreen);
      updateNavbarCashStatus();
    });

    // Atualizar tela quando dados mudarem em background
    window.addEventListener('db-synced', () => {
      navigate(currentScreen);
      updateNavbarCashStatus();
    });
  }
});
