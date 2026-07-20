import { getCurrentCashSession, openCash, addCashTransaction, closeCash, getCashSessions, getSales, updateCashOperator } from '../db.js';

export function renderCaixa(container) {
  const session = getCurrentCashSession();

  if (!session) {
    renderCaixaFechado(container);
  } else {
    renderCaixaAberto(container, session);
  }
}

function renderCaixaFechado(container) {
  container.innerHTML = `
    <div class="caixa-fechado-container fade-in">
      <div class="glass-card text-center pad-lg max-w-md margin-auto">
        <div class="lock-icon-container">
          <i data-lucide="lock" class="icon-lg text-purple"></i>
        </div>
        <h2>O Caixa está Fechado</h2>
        <p class="text-muted">Para iniciar as vendas do dia na Purple Cosméticos, abra o caixa informando o saldo inicial.</p>
        
        <form id="form-abrir-caixa" class="form-group margin-top-md">
          <label for="operador-caixa">Nome do Operador de Caixa</label>
          <input type="text" id="operador-caixa" placeholder="Ex: Maria Eduarda" required style="margin-bottom: 12px; width: 100%;">

          <label for="saldo-inicial">Valor Inicial em Caixa (Fundo)</label>
          <div class="input-prefix">
            <span class="prefix">R$</span>
            <input type="number" id="saldo-inicial" placeholder="0,00" step="0.01" required min="0">
          </div>
          <button type="submit" class="btn btn-primary btn-full margin-top-md">
            <i data-lucide="unlock"></i> Abrir Caixa
          </button>
        </form>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  document.getElementById('form-abrir-caixa').addEventListener('submit', (e) => {
    e.preventDefault();
    const saldo = parseFloat(document.getElementById('saldo-inicial').value) || 0;
    const operador = document.getElementById('operador-caixa').value.trim();
    try {
      openCash(saldo, operador);
      showNotification('Caixa aberto com sucesso!', 'success');
      // Atualiza a tela
      renderCaixa(container);
      // Atualiza status do caixa no navbar
      updateNavbarCashStatus();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });
}

function renderCaixaAberto(container, session) {
  // Buscar todas as vendas da sessão atual para calcular métodos de pagamento
  const sales = getSales().filter(sale => {
    return new Date(sale.timestamp) >= new Date(session.openedAt);
  });

  const totals = sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
    acc.total += sale.total;
    return acc;
  }, { money: 0, credit: 0, debit: 0, pix: 0, fiado: 0, total: 0 });


  // Calcular suprimentos e sangrias
  const suprimentos = session.transactions
    .filter(t => t.type === 'suprimento')
    .reduce((sum, t) => sum + t.amount, 0);

  const sangrias = session.transactions
    .filter(t => t.type === 'sangria')
    .reduce((sum, t) => sum + t.amount, 0);

  // Dinheiro esperado em caixa físico: inicial + vendas dinheiro + suprimentos - sangrias
  const expectedPhysicalMoney = session.initialAmount + totals.money + suprimentos - sangrias;

  // Total geral esperado (Dinheiro + Pix + Cartões)
  const totalExpected = session.initialAmount + totals.total + suprimentos - sangrias;

  const d = new Date(session.openedAt);
  const openedDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  container.innerHTML = `
    <div class="caixa-aberto-container fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Controle de Caixa</h1>
          <p class="text-muted">
            Aberto em ${openedDateStr} por <strong id="current-operator-display">${session.operator}</strong>
            <button id="btn-edit-operator" class="btn-icon" title="Alterar Operador de Caixa" style="display:inline-block; margin-left:6px; vertical-align:middle; cursor:pointer; color:var(--text-muted); background:none; border:none; padding:4px;">
              <i data-lucide="user-cog" style="width:16px; height:16px; display:inline-block; vertical-align:middle;"></i>
            </button>
          </p>
        </div>
        <div class="status-badge success">
          <span class="pulse-indicator"></span> Caixa Aberto
        </div>
      </div>

      <div class="grid grid-4 margin-top-md">
        <div class="glass-card stat-card border-left-purple">
          <span class="stat-label">Saldo Inicial</span>
          <h3 class="stat-value">R$ ${session.initialAmount.toFixed(2)}</h3>
        </div>
        <div class="glass-card stat-card border-left-green">
          <span class="stat-label">Dinheiro em Caixa</span>
          <h3 class="stat-value">R$ ${expectedPhysicalMoney.toFixed(2)}</h3>
          <span class="stat-sub">Vendas Dinheiro + Entradas - Saídas</span>
        </div>
        <div class="glass-card stat-card border-left-blue">
          <span class="stat-label">Vendas Outros Meios</span>
          <h3 class="stat-value">R$ ${(totals.pix + totals.credit + totals.debit + totals.fiado).toFixed(2)}</h3>
          <span class="stat-sub">Pix: R$ ${totals.pix.toFixed(2)} | Cartões: R$ ${(totals.credit + totals.debit).toFixed(2)} | Fiado: R$ ${totals.fiado.toFixed(2)}</span>
        </div>

        <div class="glass-card stat-card border-left-pink">
          <span class="stat-label">Faturamento Total Geral</span>
          <h3 class="stat-value">R$ ${totalExpected.toFixed(2)}</h3>
          <span class="stat-sub">Valor Total Estimado</span>
        </div>
      </div>

      <div class="grid grid-caixa margin-top-md">
        <!-- Histórico e Transações -->
        <div class="glass-card span-caixa-main">
          <div class="card-header">
            <h3>Movimentações do Caixa</h3>
            <div class="actions">
              <button id="btn-suprimento" class="btn btn-secondary btn-sm">
                <i data-lucide="plus"></i> Suprimento (Entrada)
              </button>
              <button id="btn-sangria" class="btn btn-danger-outline btn-sm">
                <i data-lucide="minus"></i> Sangria (Retirada)
              </button>
            </div>
          </div>
          
          <div class="table-container margin-top-sm max-h-caixa">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th class="text-right">Valor</th>
                </tr>
              </thead>
              <tbody id="caixa-transactions-body">
                ${renderTransactionsList(session, sales, suprimentos, sangrias)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Painel de Fechamento -->
        <div class="glass-card border-danger">
          <h3>Fechamento de Caixa</h3>
          <p class="text-muted text-sm margin-top-xs">Confirme os valores fisicamente presentes na gaveta para encerrar o caixa.</p>
          
          <form id="form-fechar-caixa" class="form-group margin-top-md">
            <label for="saldo-real">Dinheiro Físico na Gaveta (R$)</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input type="number" id="saldo-real" placeholder="0,00" step="0.01" required min="0">
            </div>
            
            <label for="fechamento-obs" class="margin-top-sm">Observações do Fechamento</label>
            <textarea id="fechamento-obs" placeholder="Ex: Diferença de troco de 10 centavos, sangria depositada..." rows="3"></textarea>
            
            <div class="closing-summary margin-top-sm">
              <div class="closing-row">
                <span>Dinheiro Esperado:</span>
                <strong>R$ ${expectedPhysicalMoney.toFixed(2)}</strong>
              </div>
            </div>

            <button type="submit" class="btn btn-danger btn-full margin-top-md">
              <i data-lucide="check-square"></i> Fechar Caixa
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Modais de Sangria/Suprimento -->
    <div id="modal-movimentacao" class="modal-overlay">
      <div class="modal-card">
        <h3 id="mov-modal-title">Movimentação de Caixa</h3>
        <form id="form-movimentacao" class="form-group margin-top-md">
          <input type="hidden" id="mov-type">
          
          <label for="mov-amount">Valor (R$)</label>
          <div class="input-prefix">
            <span class="prefix">R$</span>
            <input type="number" id="mov-amount" placeholder="0,00" step="0.01" required min="0.01">
          </div>
          
          <label for="mov-desc" class="margin-top-sm">Motivo / Descrição</label>
          <input type="text" id="mov-desc" placeholder="Ex: Compra de embalagem, Troco adicional..." required>
          
          <div class="modal-actions margin-top-md">
            <button type="button" id="btn-cancel-mov" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  setupCaixaAbertoEvents(container, session, expectedPhysicalMoney);
}

function renderTransactionsList(session, sales, suprimentos, sangrias) {
  const items = [];

  // Adicionar o saldo inicial como primeira movimentação
  items.push({
    time: new Date(session.openedAt),
    type: 'abertura',
    description: 'Abertura de Caixa (Saldo Inicial)',
    amount: session.initialAmount,
    class: 'text-purple'
  });

  // Adicionar vendas
  sales.forEach(sale => {
    items.push({
      time: new Date(sale.timestamp),
      type: 'venda',
      description: `Venda #${sale.id.split('_')[1]} (${translatePayment(sale.paymentMethod)})`,
      amount: sale.total,
      class: 'text-green'
    });
  });

  // Adicionar suprimentos e sangrias da sessão
  session.transactions.forEach(t => {
    items.push({
      time: new Date(t.time),
      type: t.type,
      description: t.description || (t.type === 'suprimento' ? 'Suprimento' : 'Sangria'),
      amount: t.type === 'sangria' ? -t.amount : t.amount,
      class: t.type === 'sangria' ? 'text-danger' : 'text-purple'
    });
  });

  // Ordenar por hora crescente
  items.sort((a, b) => b.time - a.time);

  if (items.length === 0) {
    return `<tr><td colspan="4" class="text-center text-muted">Nenhuma movimentação registrada.</td></tr>`;
  }

  return items.map(item => `
    <tr>
      <td>${item.time.toLocaleTimeString('pt-BR')}</td>
      <td><span class="badge ${getBadgeClass(item.type)}">${item.type.toUpperCase()}</span></td>
      <td>${item.description}</td>
      <td class="text-right ${item.class}"><strong>R$ ${item.amount.toFixed(2)}</strong></td>
    </tr>
  `).join('');
}

function getBadgeClass(type) {
  const classes = {
    'abertura': 'badge-primary',
    'venda': 'badge-success',
    'suprimento': 'badge-info',
    'sangria': 'badge-danger'
  };
  return classes[type] || 'badge-secondary';
}

function translatePayment(method) {
  const methods = {
    'money': 'Dinheiro',
    'credit': 'Crédito',
    'debit': 'Débito',
    'pix': 'Pix'
  };
  return methods[method] || method;
}

function setupCaixaAbertoEvents(container, session, expectedPhysicalMoney) {
  const modalMov = document.getElementById('modal-movimentacao');
  const movTitle = document.getElementById('mov-modal-title');
  const movTypeInput = document.getElementById('mov-type');
  const formMov = document.getElementById('form-movimentacao');

  document.getElementById('btn-suprimento').addEventListener('click', () => {
    movTitle.textContent = 'Adicionar Suprimento (Entrada)';
    movTypeInput.value = 'suprimento';
    modalMov.classList.add('active');
  });

  document.getElementById('btn-sangria').addEventListener('click', () => {
    movTitle.textContent = 'Realizar Sangria (Retirada)';
    movTypeInput.value = 'sangria';
    modalMov.classList.add('active');
  });

  document.getElementById('btn-cancel-mov').addEventListener('click', () => {
    modalMov.classList.remove('active');
    formMov.reset();
  });

  formMov.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = movTypeInput.value;
    const amount = parseFloat(document.getElementById('mov-amount').value);
    const desc = document.getElementById('mov-desc').value;

    try {
      addCashTransaction(type, amount, desc);
      showNotification(`${type === 'suprimento' ? 'Suprimento' : 'Sangria'} registrado!`, 'success');
      modalMov.classList.remove('active');
      formMov.reset();
      // Atualiza tela
      renderCaixa(container);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });

  // Fechamento de caixa
  document.getElementById('form-fechar-caixa').addEventListener('submit', (e) => {
    e.preventDefault();
    const actual = parseFloat(document.getElementById('saldo-real').value) || 0;
    const obs = document.getElementById('fechamento-obs').value;

    if (confirm('Tem certeza que deseja fechar o caixa?')) {
      try {
        const closedSession = closeCash(actual, obs);
        showNotification('Caixa fechado com sucesso!', 'success');
        
        // Exibir relatório de fechamento em um modal bonito
        showClosingReport(closedSession);

        // Atualiza tela
        renderCaixa(container);
        // Atualiza status do caixa no navbar
        updateNavbarCashStatus();
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  });

  const btnEditOperator = document.getElementById('btn-edit-operator');
  if (btnEditOperator) {
    btnEditOperator.addEventListener('click', (e) => {
      e.stopPropagation();
      const newOperator = prompt('Digite o nome do novo operador de caixa:', session.operator);
      if (newOperator !== null && newOperator.trim()) {
        try {
          updateCashOperator(newOperator.trim());
          showNotification('Operador de caixa atualizado com sucesso!', 'success');
          renderCaixa(container);
        } catch (err) {
          showNotification(err.message, 'error');
        }
      }
    });
  }
}

function showClosingReport(session) {
  const existingReport = document.getElementById('closing-report-modal');
  if (existingReport) existingReport.remove();

  const diffClass = session.difference < 0 ? 'text-danger' : (session.difference > 0 ? 'text-green' : 'text-muted');
  const diffWord = session.difference < 0 ? 'FALTA' : (session.difference > 0 ? 'SOBRA' : 'CONFORME');

  const reportHTML = `
    <div id="closing-report-modal" class="modal-overlay active">
      <div class="receipt-container scale-in fechamento-modal">
        <div class="receipt-header">
          <h3 style="font-size: 13px;">56.926.739 MARIA EDUARDA LANA DA COSTA</h3>
          <p style="font-size: 11px; font-weight: bold; color: var(--purple-accent); margin: 2px 0;">Purple Cosméticos - Relatório de Fechamento</p>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-info">
          <p><strong>Caixa #${session.id.split('_')[1]}</strong></p>
          <p>Abertura: ${(() => {
            const d = new Date(session.openedAt);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
          })()}</p>
          <p>Fechamento: ${(() => {
            const d = new Date(session.closedAt);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
          })()}</p>
          <p>Operador: ${session.operator}</p>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-totals">
          <div class="receipt-total-row">
            <span>Saldo Inicial:</span>
            <span>R$ ${session.initialAmount.toFixed(2)}</span>
          </div>
          <div class="receipt-total-row">
            <span>Dinheiro Esperado:</span>
            <span>R$ ${session.expectedAmount.toFixed(2)}</span>
          </div>
          <div class="receipt-total-row">
            <span>Dinheiro Informado:</span>
            <span>R$ ${session.actualAmount.toFixed(2)}</span>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-total-row grand-total">
            <span>Diferença (${diffWord}):</span>
            <span class="${diffClass}">R$ ${session.difference.toFixed(2)}</span>
          </div>
        </div>
        ${session.notes ? `
        <div class="receipt-divider"></div>
        <div class="receipt-info">
          <p><strong>Observações:</strong></p>
          <p class="text-sm">${session.notes}</p>
        </div>
        ` : ''}
        <div class="receipt-divider"></div>
        <div class="receipt-actions no-print">
          <button id="btn-print-closing" class="btn btn-primary"><i data-lucide="printer"></i> Imprimir</button>
          <button id="btn-close-closing" class="btn btn-secondary">Fechar</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', reportHTML);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  document.getElementById('btn-close-closing').addEventListener('click', () => {
    document.getElementById('closing-report-modal').remove();
  });

  document.getElementById('btn-print-closing').addEventListener('click', () => {
    window.print();
  });
}

// Funções utilitárias acessadas globalmente para atualização
function showNotification(msg, type) {
  const container = document.getElementById('notifications-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-msg">${msg}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function updateNavbarCashStatus() {
  const cashStatusEl = document.getElementById('navbar-cash-status');
  if (cashStatusEl) {
    const session = getCurrentCashSession();
    if (session) {
      cashStatusEl.className = 'status-indicator open';
      cashStatusEl.innerHTML = '<span class="pulse"></span> Caixa Aberto';
    } else {
      cashStatusEl.className = 'status-indicator closed';
      cashStatusEl.innerHTML = 'Caixa Fechado';
    }
  }
}
export { updateNavbarCashStatus };
