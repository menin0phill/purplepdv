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
  
  // Sincroniza em segundo plano para carregar novos operadores e configurações
  /* sync disabled */ Promise.resolve().catch(err => console.warn("Erro no sync inicial:", err));

  // Controle de Sessão de Operador do Caixa
  const activeOperator = sessionStorage.getItem('purple_pdv_active_operator');
  if (!activeOperator) {
    renderLoginScreen();
  } else {
    initializeDashboard();
  }

  function renderLoginScreen() {
    appContainer.innerHTML = `
      <div class="purple-login-page" style="display:flex; justify-content:center; align-items:center; min-height:100vh; background: #0f0a1f;">
        <div class="login-left-container" style="max-width:400px; width:100%; background:rgba(255,255,255,0.03); padding:40px; border-radius:24px; border:1px solid rgba(255,255,255,0.1); backdrop-filter:none; box-shadow:0 4px 20px rgba(0,0,0,0.5);">
          <div class="login-logo-header" style="justify-content:center; margin-bottom:30px;">
            <img src="./logo-purple.jpg" alt="Purple Logo" class="login-logo" style="width:60px; height:60px; border-radius:16px;">
          </div>
          
          <h2 style="text-align:center; font-size:24px; margin-bottom:10px; color:white;">Acesso ao PDV</h2>
          <p style="text-align:center; color:#a0aec0; font-size:14px; margin-bottom:30px;">Insira o código de acesso para continuar.</p>
          
          <form id="purple-login-form">
            <div class="login-input-group" style="margin-bottom:20px;">
              <input type="password" id="login-pin" required placeholder="Código de 6 dígitos" style="text-align:center; font-size:24px; letter-spacing:8px; padding:15px; border-radius:12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); color:white; width:100%; box-sizing:border-box;" autocomplete="off" inputmode="numeric" maxlength="6">
            </div>
            
            <button type="submit" id="btn-login-submit" class="btn-primary" style="width:100%; padding:14px; font-size:16px; font-weight:600; border-radius:10px; background:linear-gradient(135deg, #a855f7, #ec4899); color:white; border:none; cursor:pointer;">Entrar no Sistema</button>
          </form>
        </div>
      </div>
      <div id="notifications-container" class="notifications-container"></div>
    `;

    const loginForm = document.getElementById('purple-login-form');
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = document.getElementById('login-pin').value;
      
      if (pin === '080601') {
        sessionStorage.setItem('purple_pdv_active_operator', JSON.stringify({ name: 'Purple Administrador', id: 'admin' }));
        initializeDashboard();
      } else {
        const container = document.getElementById('notifications-container');
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = '<span class="toast-msg">Código inválido! Tente novamente.</span>';
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 300);
        }, 3000);
        document.getElementById('login-pin').value = '';
      }
    });
  }

  function initializeDashboard() {
    const operator = JSON.parse(sessionStorage.getItem('purple_pdv_active_operator')) || { name: 'Operador' };
    
    appContainer.innerHTML = `
      <div class="app-layout">
        <!-- Sidebar de Navegação -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <img src="./logo-purple.jpg" alt="Purple Logo" class="sidebar-logo" onerror="this.src='https://instagram.fcgh13-1.fna.fbcdn.net/v/t51.82787-19/651031849_17966874450019045_9100807247552984597_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby44NDAuYzIifQ&_nc_ht=instagram.fcgh13-1.fna.fbcdn.net&_nc_cat=101&_nc_oc=Q6cZ2gHycOL9sD5xHY5FxNSgRSX2zXUNVbGhAFMCU2-eHb6Rysf1xxtGQbgLfuARnbBShC1lgu2RruKYQIc0-pCxF8Jl&_nc_ohc=EZMEJ4HLGO4Q7kNvwGewcRG&_nc_gid=6p0a7wHTtBkcfZVdLzYGpA&edm=APoiHPcBAAAA&ccb=7-5&oh=00_AQBAhoUNv7U6FBEqNAlimY0YwkPKb_5xZ83ur54LbSVd8g&oe=6A62003B&_nc_sid=22de04'">
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
            <img src="./logo-purple.jpg" alt="Purple Logo" class="footer-logo" onerror="this.src='https://instagram.fcgh13-1.fna.fbcdn.net/v/t51.82787-19/651031849_17966874450019045_9100807247552984597_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby44NDAuYzIifQ&_nc_ht=instagram.fcgh13-1.fna.fbcdn.net&_nc_cat=101&_nc_oc=Q6cZ2gHycOL9sD5xHY5FxNSgRSX2zXUNVbGhAFMCU2-eHb6Rysf1xxtGQbgLfuARnbBShC1lgu2RruKYQIc0-pCxF8Jl&_nc_ohc=EZMEJ4HLGO4Q7kNvwGewcRG&_nc_gid=6p0a7wHTtBkcfZVdLzYGpA&edm=APoiHPcBAAAA&ccb=7-5&oh=00_AQBAhoUNv7U6FBEqNAlimY0YwkPKb_5xZ83ur54LbSVd8g&oe=6A62003B&_nc_sid=22de04'">
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
              <button id="btn-manual-sync" class="btn btn-secondary" style="margin-right: 12px; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="cloud-upload"></i> Sincronizar Loja Online
              </button>
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
        // Sincroniza em segundo plano para capturar atualizações de catálogo ou caixa feitas em outros computadores
        /* sync disabled */ Promise.resolve().catch(err => console.warn("Erro ao sincronizar na navegação:", err));
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

    
      const btnManualSync = document.getElementById('btn-manual-sync');
      if (btnManualSync) {
        // Create Sync Modal
        const syncModalHTML = `
          <div id="modal-manual-sync" class="modal-overlay">
            <div class="modal-card max-w-sm text-center scale-in">
              <h3>Sincronizando com a Nuvem</h3>
              <p class="text-muted margin-bottom-md">Enviando vendas e recebendo pedidos do site...</p>
              <div class="spinner" style="margin: 20px auto; border: 4px solid var(--border); border-top: 4px solid var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
              <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
              <p id="sync-status-text" style="font-weight: bold; margin-top: 10px;">Conectando...</p>
              <button id="btn-close-sync" class="btn btn-primary margin-top-md" style="display: none; width: 100%;">Fechar</button>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', syncModalHTML);

        const modalSync = document.getElementById('modal-manual-sync');
        const syncStatusText = document.getElementById('sync-status-text');
        const btnCloseSync = document.getElementById('btn-close-sync');
        const spinner = modalSync.querySelector('.spinner');

        btnCloseSync.addEventListener('click', () => {
          modalSync.classList.remove('active');
          if (typeof navigate === 'function' && currentScreen) navigate(currentScreen);
        });

        btnManualSync.addEventListener('click', async () => {
          modalSync.classList.add('active');
          btnCloseSync.style.display = 'none';
          spinner.style.display = 'block';
          syncStatusText.textContent = 'Sincronizando dados...';
          syncStatusText.style.color = 'var(--text)';
          
          try {
            await syncWithSupabase(true); // Pass true to bypass manual mode check
            syncStatusText.textContent = 'Sincronização concluída com sucesso!';
            syncStatusText.style.color = 'var(--success)';
          } catch (err) {
            console.error(err);
            syncStatusText.textContent = 'Erro ao sincronizar: ' + err.message;
            syncStatusText.style.color = 'var(--danger)';
          } finally {
            spinner.style.display = 'none';
            btnCloseSync.style.display = 'block';
          }
        });
      }

      // Sincronização inicial em background

    /* sync disabled */ Promise.resolve().then(() => {
      navigate(currentScreen);
      updateNavbarCashStatus();
    });

    // Dispara sincronização imediata ao acordar a tela ou voltar para o app (essencial para celulares, tablets e notebooks em modo espera)
    window.addEventListener('focus', () => {
      /* sync disabled */ Promise.resolve().catch(() => {});
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        /* sync disabled */ Promise.resolve().catch(() => {});
      }
    });

    // Sincronização via evento de reconexão de rede (o Realtime já cuida da sincronia instantânea)
    window.addEventListener('online', () => {
      console.log('🌐 Conexão restaurada! Sincronizando com a nuvem...');
      /* sync disabled */ Promise.resolve().catch(err => console.warn("Erro ao sincronizar após reconexão:", err));
    });

    // Atualizar tela quando dados mudarem de fato em background (sem interromper operador com modal aberto, digitando ou no PDV/Caixa/Produtos)
    window.addEventListener('db-synced', () => {
      updateNavbarCashStatus();
      const isModalActive = document.querySelector('.modal-overlay.active, .modal.active');
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (!isModalActive && !isTyping) {
        // We do not re-render pdv or produtos automatically to avoid interrupting the user's flow,
        // but we DO re-render the 'caixa' screen so the user immediately sees if it was opened/closed on another device.
        if (currentScreen !== 'pdv' && currentScreen !== 'produtos') {
          navigate(currentScreen);
        }
      }
    });
  }
});
