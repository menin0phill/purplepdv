import { getConfig, saveConfig } from '../db.js';

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

      <div class="grid grid-2 margin-top-md">
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
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

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
