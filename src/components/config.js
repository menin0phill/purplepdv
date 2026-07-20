import { getConfig, saveConfig, getOperators, addOperator, saveOperators } from '../db.js';

export function renderConfig(container) {
  const currentConfig = getConfig();

  container.innerHTML = `
    <div class="config-container fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Configurações Gerais</h1>
          <p class="text-muted">Ajuste as preferências de operação do Purple PDV</p>
        </div>
      </div>

      <!-- Card de Status de Sincronização Nuvem -->
      <div class="glass-card margin-bottom-md" style="border: 1px solid rgba(139, 92, 246, 0.25);">
        <h3 style="font-size: 15px; font-weight: 700; color: white; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="cloud-lightning" style="width: 18px; height: 18px; color: var(--primary);"></i> Status de Sincronização Nuvem (Supabase)
        </h3>
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 12px; padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color);">
          <div id="sync-diagnostic-badge" style="width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; background-color: #a0aec0;"></div>
          <div>
            <strong id="sync-diagnostic-status" style="display: block; font-size: 13px; color: white;">Carregando diagnóstico...</strong>
            <span id="sync-diagnostic-details" style="font-size: 11px; color: var(--text-muted); line-height: 1.4; display: block; margin-top: 2px;">Verificando conexão com o banco de dados...</span>
          </div>
        </div>
        
        <details style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 15px; color: var(--text-main);">
          <summary style="cursor: pointer; font-size: 13px; font-weight: 600; color: var(--primary);">🔧 Configurar Supabase Manualmente (Se a Vercel falhar)</summary>
          <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 10px;">
            <p class="text-muted text-xs">Se as variáveis da Vercel falharem, você pode colar suas chaves do Supabase diretamente aqui. Elas serão salvas de forma segura localmente.</p>
            <div>
              <label for="fallback-sb-url" style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 4px;">Supabase URL</label>
              <input type="text" id="fallback-sb-url" placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co" style="width: 100%; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-color); border-radius: 6px; height: 32px; padding: 0 8px; font-size: 12px;">
            </div>
            <div>
              <label for="fallback-sb-key" style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 4px;">Supabase Anon Key</label>
              <input type="password" id="fallback-sb-key" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." style="width: 100%; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-color); border-radius: 6px; height: 32px; padding: 0 8px; font-size: 12px;">
            </div>
            <div style="display: flex; gap: 8px; margin-top: 5px;">
              <button type="button" id="btn-save-fallback-sb" class="btn btn-primary btn-sm" style="font-size: 11px; padding: 6px 12px;">Salvar Conexão</button>
              <button type="button" id="btn-clear-fallback-sb" class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 6px 12px; border-color: #ef4444; color: #ef4444; background: transparent;">Limpar Chaves</button>
            </div>
          </div>
        </details>
      </div>

      <div class="grid grid-2">
        <!-- Card de Configurações de Vendas -->
        <div class="glass-card">
          <h3>Fluxo de Venda & Segurança</h3>
          <p class="text-muted text-sm margin-top-xs">Defina regras de caixa e PIN de proteção de acessos.</p>
          
          <form id="form-config" class="form-group margin-top-md">
            <div class="toggle-control-row margin-bottom-md">
              <div class="toggle-info">
                <span class="toggle-title">Obrigar Identificação de Cliente</span>
                <p class="text-muted text-xs">Exige que uma venda no PDV seja associada a um cliente cadastrado (bloqueia vendas para o Consumidor Geral).</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="config-require-client" ${currentConfig.requireClientCheckout ? 'checked' : ''}>
                <span class="slider round"></span>
              </label>
            </div>

            <div class="receipt-divider"></div>
            
            <div class="margin-bottom-md" style="margin-top: 15px;">
              <label for="config-admin-pin" style="font-weight: 600;">PIN de Acesso Admin (4 a 8 dígitos)</label>
              <input type="text" id="config-admin-pin" value="${currentConfig.adminPin || '1234'}" maxlength="8" class="input-sm" style="width: 150px; text-align: center; font-size: 16px; letter-spacing: 2px; font-weight: bold; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-color); border-radius: 6px; margin-top: 5px;" placeholder="1234">
              <p class="text-muted text-xs margin-top-xs">Protege o acesso a relatórios, configurações, caixa e produtos no menu lateral.</p>
            </div>

            <button type="submit" class="btn btn-primary margin-top-sm">
              <i data-lucide="save"></i> Salvar Preferências
            </button>
          </form>
        </div>
        
        <!-- Card de Sistema -->
        <div class="glass-card">
          <h3>Campanhas e Integrações</h3>
          <p class="text-muted text-sm margin-top-xs">Ferramentas de marketing, fiscais e cópias de segurança.</p>
          
          <div class="margin-top-md system-info-panel">
            <div class="info-row">
              <span>Mensagens de Aniversário:</span>
              <span class="badge badge-success">Ativo (Simulado)</span>
            </div>
            <p class="text-muted text-xs margin-top-xs">O sistema está configurado para programar alertas de aniversariantes mensais.</p>
            
            <div class="receipt-divider"></div>
            
            <div class="info-row">
              <span>Emissão Fiscal (NFC-e):</span>
              <span class="badge badge-secondary">Ambiente de Testes</span>
            </div>
            <p class="text-muted text-xs margin-top-xs">Para emitir cupons válidos, é necessário o upload do Certificado A1.</p>

            <div class="receipt-divider"></div>
            
            <div class="backup-section" style="margin-top: 15px;">
              <span style="font-weight: 600; display: block; margin-bottom: 5px;">Segurança dos Dados (Local)</span>
              <p class="text-muted text-xs margin-bottom-sm">Os dados ficam salvos localmente. Faça cópias de segurança para evitar perdas.</p>
              <div style="display: flex; gap: 10px; margin-top: 8px;">
                <button type="button" id="btn-export-backup" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="download" style="width: 14px; height: 14px;"></i> Exportar JSON
                </button>
                <input type="file" id="import-backup-file" accept=".json" style="display: none;">
                <button type="button" id="btn-import-backup" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="upload" style="width: 14px; height: 14px;"></i> Importar JSON
                </button>
                <button type="button" id="btn-clear-sales" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 4px; border: 1px solid #ef4444 !important; color: #ef4444 !important; background: transparent !important;">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px; color: #ef4444 !important;"></i> Zerar Vendas/Caixa (Produção)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Card de Integração Asaas -->
      <div class="glass-card margin-top-lg">
        <h3>Integração de Pagamentos - Asaas</h3>
        <p class="text-muted text-sm margin-top-xs">Configure o processamento de vendas com cartão e Pix dinâmico no e-commerce.</p>
        
        <form id="form-config-asaas" class="form-group margin-top-md">
          <div class="grid grid-2">
            <div>
              <label for="config-asaas-mode" style="font-weight:600; display:block; margin-bottom:5px;">Modo do Checkout</label>
              <select id="config-asaas-mode" style="width:100%; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--border-color); border-radius:6px; height:38px; padding:0 8px; font-family:var(--font-sans);">
                <option value="simulated" ${currentConfig.asaasMode === 'simulated' ? 'selected' : ''}>Apenas Simulação (Padrão)</option>
                <option value="production" ${currentConfig.asaasMode === 'production' ? 'selected' : ''}>Integração Real (Asaas)</option>
              </select>
            </div>
            
            <div>
              <label for="config-asaas-apikey" style="font-weight:600; display:block; margin-bottom:5px;">Chave de API (AccessToken)</label>
              <input type="password" id="config-asaas-apikey" value="${currentConfig.asaasApiKey || ''}" style="width:100%; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--border-color); border-radius:6px; height:38px; padding:0 8px; font-family:var(--font-sans);" placeholder="aact_prod_...">
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary margin-top-md" style="width:max-content;">
            <i data-lucide="save"></i> Salvar Configuração de Pagamento
          </button>
        </form>
      <!-- Card de Gerenciamento de Operadores -->
      <div class="glass-card margin-top-lg">
        <h3>Gerenciamento de Operadores do Caixa</h3>
        <p class="text-muted text-sm margin-top-xs">Cadastre e remova operadores autorizados a acessar a frente de caixa.</p>
        
        <div class="grid grid-2 margin-top-md" style="gap: 20px;">
          <!-- Lista de Operadores -->
          <div>
            <h4 style="margin-bottom: 12px; color: var(--text-main);">Operadores Cadastrados</h4>
            <div id="operators-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto; padding-right: 8px;">
              <!-- Gerado via JS -->
            </div>
          </div>
          
          <!-- Formulário Novo Operador -->
          <div>
            <h4 style="margin-bottom: 12px; color: var(--text-main);">Cadastrar Novo Operador</h4>
            <form id="form-add-operator" class="form-group" style="display: flex; flex-direction: column; gap: 10px;">
              <div>
                <label for="op-name" style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Nome</label>
                <input type="text" id="op-name" required placeholder="Ex: Ana Silva" style="width:100%; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--border-color); border-radius:6px; height:36px; padding:0 8px;">
              </div>
              <div>
                <label for="op-email" style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">E-mail (Login)</label>
                <input type="email" id="op-email" required placeholder="ana.silva@email.com" style="width:100%; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--border-color); border-radius:6px; height:36px; padding:0 8px;">
              </div>
              <div>
                <label for="op-password" style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Senha</label>
                <input type="password" id="op-password" required placeholder="Senha de acesso" style="width:100%; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--border-color); border-radius:6px; height:36px; padding:0 8px;">
              </div>
              <div>
                <label for="op-role" style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Função (Cargo)</label>
                <select id="op-role" style="width:100%; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--border-color); border-radius:6px; height:36px; padding:0 8px; font-family:var(--font-sans);">
                  <option value="operator">Operador de Caixa</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary btn-sm margin-top-xs" style="width:max-content;">
                <i data-lucide="plus"></i> Adicionar Operador
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Função para renderizar lista de operadores
  function updateOperatorsList() {
    const listEl = document.getElementById('operators-list');
    if (!listEl) return;
    
    const operators = getOperators();
    listEl.innerHTML = operators.map(op => {
      const isSelf = op.email.toLowerCase() === 'henriqueelsilva@gmail.com';
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div>
            <div style="font-weight: 600; font-size: 14px; color: white;">${op.name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${op.email} • <span style="text-transform: capitalize;">${op.role}</span></div>
          </div>
          ${isSelf ? `
            <span style="font-size: 11px; color: var(--primary); font-weight: 600; padding: 4px 8px; background: rgba(139, 92, 246, 0.15); border-radius: 4px;">Admin Raiz</span>
          ` : `
            <button type="button" class="btn-delete-operator" data-id="${op.id}" style="background: none; border: none; color: #f56565; cursor: pointer; padding: 4px; display: flex; align-items: center;">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          `}
        </div>
      `;
    }).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Configura remoção de operadores
    listEl.querySelectorAll('.btn-delete-operator').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const operators = getOperators();
        const updated = operators.filter(o => o.id !== id);
        saveOperators(updated);
        updateOperatorsList();
        showNotification('Operador removido com sucesso!', 'success');
      });
    });
  }
  
  // Executa listagem inicial
  updateOperatorsList();
  
  // Submit para adicionar novo operador
  document.getElementById('form-add-operator').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('op-name').value.trim();
    const email = document.getElementById('op-email').value.trim();
    const password = document.getElementById('op-password').value;
    const role = document.getElementById('op-role').value;
    
    const operators = getOperators();
    if (operators.find(op => op.email.toLowerCase() === email.toLowerCase())) {
      showNotification('Já existe um operador cadastrado com este e-mail!', 'error');
      return;
    }
    
    addOperator({ name, email, password, role });
    
    document.getElementById('op-name').value = '';
    document.getElementById('op-email').value = '';
    document.getElementById('op-password').value = '';
    
    updateOperatorsList();
    showNotification('Novo operador cadastrado com sucesso!', 'success');
  });

  // Ações de salvar configurações
  document.getElementById('form-config').addEventListener('submit', (e) => {
    e.preventDefault();
    const requireClient = document.getElementById('config-require-client').checked;
    const adminPin = document.getElementById('config-admin-pin').value.trim() || '1234';
    
    // Ler config existente para não perder campos da InfinitePay
    const existing = getConfig();
    saveConfig({
      ...existing,
      requireClientCheckout: requireClient,
      adminPin: adminPin
    });
    
    showNotification('Configurações salvas com sucesso!', 'success');
  });

  // Ações de salvar configurações do Asaas
  document.getElementById('form-config-asaas').addEventListener('submit', (e) => {
    e.preventDefault();
    const mode = document.getElementById('config-asaas-mode').value;
    const apiKey = document.getElementById('config-asaas-apikey').value.trim();
    
    // Ler config existente para mesclar
    const existing = getConfig();
    saveConfig({
      ...existing,
      asaasMode: mode,
      asaasApiKey: apiKey
    });
    
    showNotification('Configurações de pagamento Asaas salvas!', 'success');
  });

  // Exportar Backup JSON
  const btnExport = document.getElementById('btn-export-backup');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const keys = ['purple_pdv_products', 'purple_pdv_sales', 'purple_pdv_cash_sessions', 'purple_pdv_clients', 'purple_pdv_config'];
      const data = {};
      keys.forEach(k => {
        data[k] = localStorage.getItem(k);
      });
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `purple_pdv_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('Backup exportado com sucesso!', 'success');
    });
  }

  // Importar Backup JSON
  const fileInput = document.getElementById('import-backup-file');
  const btnImport = document.getElementById('btn-import-backup');
  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!confirm('Deseja restaurar esse backup? Todos os dados atuais do navegador serão substituídos!')) {
        fileInput.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          const keys = ['purple_pdv_products', 'purple_pdv_sales', 'purple_pdv_cash_sessions', 'purple_pdv_clients', 'purple_pdv_config'];
          
          let successCount = 0;
          keys.forEach(k => {
            if (data[k]) {
              localStorage.setItem(k, data[k]);
              successCount++;
            }
          });
          
          fileInput.value = '';
          if (successCount > 0) {
            showNotification('Dados restaurados com sucesso! Recarregando...', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            showNotification('Arquivo de backup inválido!', 'error');
          }
        } catch (err) {
          showNotification('Erro ao processar backup: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Limpar Vendas e Caixa para Produção
  const btnClearSales = document.getElementById('btn-clear-sales');
  if (btnClearSales) {
    btnClearSales.addEventListener('click', async () => {
      if (!confirm('ATENÇÃO: Isso apagará permanentemente TODO o histórico de vendas, relatórios e sessões de caixa (tanto local quanto no Supabase)! Esta ação não pode ser desfeita. Tem certeza que deseja prosseguir para iniciar o sistema em produção?')) {
        return;
      }
      
      // Limpa LocalStorage
      localStorage.setItem('purple_pdv_sales', JSON.stringify([]));
      localStorage.setItem('purple_pdv_cash_sessions', JSON.stringify([]));
      
      // Limpa Supabase
      import('../db.js').then(async ({ supabase }) => {
        if (supabase) {
          try {
            showNotification('Limpando base de dados na nuvem...', 'info');
            // Deleta tudo das tabelas sales e cash_sessions
            const { error: errSales } = await supabase.from('sales').delete().neq('id', '0');
            const { error: errSessions } = await supabase.from('cash_sessions').delete().neq('id', '0');
            
            if (errSales || errSessions) {
              console.error("Erro ao apagar tabelas:", errSales, errSessions);
              showNotification('Aviso: Limpo localmente, mas ocorreu um erro ao apagar na nuvem.', 'warning');
            } else {
              showNotification('Banco de dados da nuvem zerado com sucesso!', 'success');
            }
          } catch(e) {
            console.error("Erro na requisição do Supabase:", e);
            showNotification('Limpo localmente. Falha ao comunicar com a nuvem.', 'warning');
          }
        } else {
          showNotification('Limpo localmente (Supabase não configurado).', 'success');
        }
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      });
    });
  }

  // Lógica de Diagnóstico de Sincronização
  const diagBadge = document.getElementById('sync-diagnostic-badge');
  const diagStatus = document.getElementById('sync-diagnostic-status');
  const diagDetails = document.getElementById('sync-diagnostic-details');

  if (diagBadge && diagStatus && diagDetails) {
    import('../db.js').then(({ supabase }) => {
      if (!supabase) {
        diagBadge.style.backgroundColor = '#a0aec0'; // cinza
        diagStatus.textContent = 'Modo Local (Supabase não configurado)';
        diagStatus.style.color = '#a0aec0';
        diagDetails.textContent = 'Cadastre as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel para ativar a nuvem.';
      } else {
        const lastError = localStorage.getItem('purple_pdv_last_sync_error');
        if (lastError) {
          diagBadge.style.backgroundColor = '#ef4444'; // vermelho
          diagStatus.textContent = 'Erro na Sincronização';
          diagStatus.style.color = '#ef4444';
          diagDetails.textContent = `Falha: ${lastError}. Certifique-se de ter criado todas as 5 tabelas (products, clients, sales, cash_sessions, operators) no SQL Editor do Supabase.`;
        } else {
          diagBadge.style.backgroundColor = '#10b981'; // verde
          diagStatus.textContent = 'Conectado e Sincronizado';
          diagStatus.style.color = '#10b981';
          diagDetails.textContent = 'Todas as vendas, produtos e operadores estão salvos na nuvem em tempo real!';
        }
      }
    });
  }

  // Preenche inputs com configuração manual existente (se houver)
  const manualConfig = JSON.parse(localStorage.getItem('purple_pdv_supabase_config')) || {};
  const inputUrl = document.getElementById('fallback-sb-url');
  const inputKey = document.getElementById('fallback-sb-key');
  const btnSaveManual = document.getElementById('btn-save-fallback-sb');
  const btnClearManual = document.getElementById('btn-clear-fallback-sb');

  if (inputUrl && inputKey && btnSaveManual && btnClearManual) {
    inputUrl.value = manualConfig.url || '';
    inputKey.value = manualConfig.anonKey || '';

    // Salvar configuração manual
    btnSaveManual.addEventListener('click', () => {
      const url = inputUrl.value.trim();
      const anonKey = inputKey.value.trim();

      if (!url || !anonKey) {
        showNotification('Por favor, preencha a URL e a Anon Key do Supabase!', 'error');
        return;
      }

      localStorage.setItem('purple_pdv_supabase_config', JSON.stringify({ url, anonKey }));
      showNotification('Conexão configurada manualmente! Recarregando...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    });

    // Limpar configuração manual
    btnClearManual.addEventListener('click', () => {
      localStorage.removeItem('purple_pdv_supabase_config');
      showNotification('Configuração manual removida. Voltando a ler chaves da Vercel...', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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
