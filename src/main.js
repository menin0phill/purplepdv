import './style.css';
import { renderPDV } from './components/pdv.js';
import { renderCaixa, updateNavbarCashStatus } from './components/caixa.js';
import { renderProdutos } from './components/produtos.js';
import { renderDashboard } from './components/dashboard.js';
import { renderClientes } from './components/clientes.js';
import { renderConfig } from './components/config.js';
import { renderPedidos } from './components/pedidos.js';
import { getConfig } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o layout básico no index.html (gerenciado dinamicamente via JS)
  const appContainer = document.getElementById('app');
  
  appContainer.innerHTML = `
    <div class="app-layout">
      <!-- Sidebar de Navegação -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <img src="/logo-purple.jpg" alt="Purple Logo" class="sidebar-logo" onerror="this.src='https://instagram.fcgh13-1.fna.fbcdn.net/v/t51.82787-19/651031849_17966874450019045_9100807247552984597_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby44NDAuYzIifQ&_nc_ht=instagram.fcgh13-1.fna.fbcdn.net&_nc_cat=101&_nc_oc=Q6cZ2gHycOL9sD5xHY5FxNSgRSX2zXUNVbGhAFMCU2-eHb6Rysf1xxtGQbgLfuARnbBShC1lgu2RruKYQIc0-pCxF8Jl&_nc_ohc=EZMEJ4HLGO4Q7kNvwGewcRG&_nc_gid=6p0a7wHTtBkcfZVdLzYGpA&edm=APoiHPcBAAAA&ccb=7-5&oh=00_AQBAhoUNv7U6FBEqNAlimY0YwkPKb_5xZ83ur54LbSVd8g&oe=6A62003B&_nc_sid=22de04'">
          <div class="sidebar-brand-text">
            <h2>Purple</h2>
            <span>Frente de Caixa</span>
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

  // Renderiza ícones do Lucide após montar
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  const screenContainer = document.getElementById('screen-container');
  const navItems = document.querySelectorAll('.nav-item');
  const navbarTitle = document.getElementById('navbar-title');
  const sidebar = document.querySelector('.sidebar');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');

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
      statusEl.style.cursor = 'default';
      statusEl.style.display = 'flex';
      statusEl.style.alignItems = 'center';
      statusEl.style.gap = '4px';
      statusEl.style.marginRight = '8px';
      statusEl.title = 'Modo Operador (Restrito)';
      statusEl.innerHTML = `<i data-lucide="lock" style="width:14px; height:14px;"></i> Operador`;
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (isAdmin) {
      const newStatus = statusEl.cloneNode(true);
      statusEl.parentNode.replaceChild(newStatus, statusEl);
      newStatus.addEventListener('click', () => {
        sessionStorage.removeItem('purple_admin_authenticated');
        showNotification('Modo administrativo bloqueado!', 'warning');
        updateAdminLockIndicator();
        navigate('pdv');
      });
    }
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

  // Função para navegar
  function navigate(screenName) {
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
});
