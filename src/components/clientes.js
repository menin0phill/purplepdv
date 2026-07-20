import { getClients, addClient, updateClient, deleteClient, payClientDebt, getSales } from '../db.js';

export function renderClientes(container) {
  let clients = getClients();

  container.innerHTML = `
    <div class="clientes-container fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestão de Clientes</h1>
          <p class="text-muted">Cadastre clientes, controle fiados e gerencie o histórico de compras</p>
        </div>
        <button id="btn-novo-cliente" class="btn btn-primary">
          <i data-lucide="plus"></i> Novo Cliente
        </button>
      </div>

      <div class="glass-card margin-top-md">
        <!-- Filtros e Busca -->
        <div class="filters-row">
          <div class="search-input-container">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" id="search-client" placeholder="Buscar cliente por nome, telefone ou e-mail...">
          </div>
        </div>

        <!-- Tabela de Clientes -->
        <div class="table-container margin-top-md">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato / Aniversário</th>
                <th class="text-right">Saldo Devedor (Fiado)</th>
                <th class="text-center">Compras</th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody id="clients-table-body">
              ${renderClientsTableRows(clients)}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Novo/Editar Cliente -->
    <div id="modal-cliente" class="modal-overlay">
      <div class="modal-card max-w-md">
        <h3 id="client-modal-title">Novo Cliente</h3>
        <form id="form-cliente" class="form-group margin-top-md">
          <input type="hidden" id="client-id">
          
          <label for="client-name-input">Nome Completo</label>
          <input type="text" id="client-name-input" placeholder="Ex: Juliana Santos" required>

          <label for="client-phone-input" class="margin-top-sm">Telefone / WhatsApp</label>
          <input type="text" id="client-phone-input" placeholder="Ex: (11) 98888-7777" required>

          <label for="client-email-input" class="margin-top-sm">E-mail</label>
          <input type="email" id="client-email-input" placeholder="Ex: juliana@email.com">

          <label for="client-birthday-input" class="margin-top-sm">Data de Nascimento (Aniversário)</label>
          <input type="text" id="client-birthday-input" placeholder="DD/MM/AAAA" maxlength="10">

          <label for="client-notes-input" class="margin-top-sm">Preferências / Observações</label>
          <textarea id="client-notes-input" placeholder="Ex: Prefere tons nude, possui pele sensível..." rows="3"></textarea>

          <div class="modal-actions margin-top-md">
            <button type="button" id="btn-cancel-client" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Quitação de Débito -->
    <div id="modal-quitacao" class="modal-overlay">
      <div class="modal-card max-w-md">
        <h3>Receber Pagamento (Quitar Fiado)</h3>
        <p class="text-muted text-sm margin-top-xs" id="quit-client-desc">Abatendo saldo devedor.</p>
        
        <form id="form-quitacao" class="form-group margin-top-md">
          <input type="hidden" id="quit-client-id">
          
          <label for="quit-amount">Valor Recebido (R$)</label>
          <div class="input-prefix">
            <span class="prefix">R$</span>
            <input type="number" id="quit-amount" placeholder="0,00" step="0.01" required min="0.01">
          </div>

          <label for="quit-payment-method" class="margin-top-sm">Forma de Pagamento</label>
          <select id="quit-payment-method" required>
            <option value="money">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="credit">Cartão de Crédito</option>
            <option value="debit">Cartão de Débito</option>
          </select>

          <div class="modal-actions margin-top-md">
            <button type="button" id="btn-cancel-quit" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-success">Confirmar Recebimento</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Histórico do Cliente (Perfil Financeiro e Compras) -->
    <div id="modal-historico" class="modal-overlay">
      <div class="modal-card max-w-lg">
        <div class="card-header">
          <h3 id="hist-client-name">Perfil do Cliente</h3>
          <button id="btn-close-historico" class="btn-icon" title="Fechar">
            <i data-lucide="x"></i>
          </button>
        </div>
        
        <div class="client-profile-details margin-top-sm">
          <div class="grid grid-2">
            <div>
              <p><strong>Telefone:</strong> <span id="hist-client-phone"></span></p>
              <p><strong>E-mail:</strong> <span id="hist-client-email"></span></p>
              <p><strong>Aniversário:</strong> <span id="hist-client-birthday"></span></p>
            </div>
            <div>
              <p><strong>Saldo Devedor:</strong> <span id="hist-client-debt" class="font-bold"></span></p>
            </div>
          </div>
          <div class="margin-top-sm">
            <p><strong>Preferências / Notas:</strong></p>
            <p class="text-muted text-sm italic" id="hist-client-notes"></p>
          </div>
        </div>

        <div class="receipt-divider"></div>

        <h4>Histórico de Compras</h4>
        <div class="table-container margin-top-sm max-h-caixa">
          <table class="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Itens Adquiridos</th>
                <th>Forma</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody id="hist-purchases-body">
              <!-- Preenchido via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  setupClientEvents(container);
}

function formatDate(dateStr) {
  if (!dateStr) return '<span class="text-muted">Não cadastrado</span>';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function renderClientsTableRows(clients) {
  if (clients.length === 0) {
    return `<tr><td colspan="5" class="text-center text-muted">Nenhum cliente cadastrado.</td></tr>`;
  }

  const sales = getSales();

  return clients.map(c => {
    // Calcular compras realizadas
    const clientSales = sales.filter(s => s.clientId === c.id);
    const purchasesCount = clientSales.length;
    
    const debtClass = c.debt > 0 ? 'text-danger font-bold' : 'text-muted';
    const debtDisplay = c.debt > 0 ? `R$ ${c.debt.toFixed(2)}` : 'R$ 0,00';

    return `
      <tr id="row-${c.id}">
        <td><strong>${c.name}</strong></td>
        <td>
          <div class="contact-cell">
            <span class="text-sm">${c.phone}</span>
            ${c.email ? `<br><span class="text-xs text-muted">${c.email}</span>` : ''}
            ${c.birthday ? `<br><span class="text-xs text-purple font-bold"><i data-lucide="cake" class="icon-inline" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> Aniv: ${formatDate(c.birthday)}</span>` : ''}
          </div>
        </td>
        <td class="text-right ${debtClass}">${debtDisplay}</td>
        <td class="text-center">${purchasesCount}</td>
        <td class="text-center">
          <div class="table-actions">
            <button class="btn-icon btn-history-client" data-id="${c.id}" title="Ver Perfil/Histórico">
              <i data-lucide="eye"></i>
            </button>
            ${c.debt > 0 ? `
            <button class="btn-icon text-success btn-pay-debt" data-id="${c.id}" title="Quitar Fiado">
              <i data-lucide="badge-dollar-sign"></i>
            </button>
            ` : ''}
            <button class="btn-icon btn-edit-client" data-id="${c.id}" title="Editar">
              <i data-lucide="edit"></i>
            </button>
            <button class="btn-icon text-danger btn-delete-client" data-id="${c.id}" title="Excluir">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupClientEvents(container) {
  const modalCliente = document.getElementById('modal-cliente');
  const modalTitle = document.getElementById('client-modal-title');
  const formCliente = document.getElementById('form-cliente');
  const searchInput = document.getElementById('search-client');

  const modalQuitacao = document.getElementById('modal-quitacao');
  const formQuitacao = document.getElementById('form-quitacao');

  const modalHistorico = document.getElementById('modal-historico');

  const bdayInput = document.getElementById('client-birthday-input');
  if (bdayInput) {
    bdayInput.addEventListener('input', (e) => {
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

  // Abrir Modal Criar Cliente
  document.getElementById('btn-novo-cliente').addEventListener('click', () => {
    modalTitle.textContent = 'Novo Cliente';
    formCliente.reset();
    document.getElementById('client-id').value = '';
    modalCliente.classList.add('active');
  });

  // Cancelar Cliente
  document.getElementById('btn-cancel-client').addEventListener('click', () => {
    modalCliente.classList.remove('active');
    formCliente.reset();
  });

  // Salvar Cliente
  formCliente.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('client-id').value;
    
    const birthdayRaw = document.getElementById('client-birthday-input').value.trim();
    let birthday = '';
    if (birthdayRaw) {
      const parts = birthdayRaw.split('/');
      if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        birthday = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        showNotification('Data de nascimento inválida! Use o formato DD/MM/AAAA ou deixe em branco.', 'error');
        return;
      }
    }

    const clientData = {
      name: document.getElementById('client-name-input').value,
      phone: document.getElementById('client-phone-input').value,
      email: document.getElementById('client-email-input').value,
      birthday: birthday,
      notes: document.getElementById('client-notes-input').value
    };

    if (id) {
      updateClient(id, clientData);
      showNotification('Cliente atualizado com sucesso!', 'success');
    } else {
      addClient({ ...clientData, debt: 0 });
      showNotification('Cliente cadastrado com sucesso!', 'success');
    }

    modalCliente.classList.remove('active');
    formCliente.reset();
    renderClientes(container);
  });

  // Cancelar Quitação
  document.getElementById('btn-cancel-quit').addEventListener('click', () => {
    modalQuitacao.classList.remove('active');
    formQuitacao.reset();
  });

  // Confirmar Quitação
  formQuitacao.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('quit-client-id').value;
    const amount = parseFloat(document.getElementById('quit-amount').value);
    const method = document.getElementById('quit-payment-method').value;

    try {
      const client = payClientDebt(id, amount, method);
      showNotification(`Recebimento de R$ ${amount.toFixed(2)} registrado!`, 'success');
      modalQuitacao.classList.remove('active');
      formQuitacao.reset();
      renderClientes(container);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });

  // Fechar Histórico
  document.getElementById('btn-close-historico').addEventListener('click', () => {
    modalHistorico.classList.remove('active');
  });

  // Busca em tempo real
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const allClients = getClients();

    const filtered = allClients.filter(c => {
      return c.name.toLowerCase().includes(query) || 
             c.phone.includes(query) || 
             (c.email && c.email.toLowerCase().includes(query));
    });

    document.getElementById('clients-table-body').innerHTML = renderClientsTableRows(filtered);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setupTableActions(container);
  });

  setupTableActions(container);
}

function setupTableActions(container) {
  const modalCliente = document.getElementById('modal-cliente');
  const modalTitle = document.getElementById('client-modal-title');
  const modalQuitacao = document.getElementById('modal-quitacao');
  const modalHistorico = document.getElementById('modal-historico');

  // Quitar Débito
  document.querySelectorAll('.btn-pay-debt').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const clients = getClients();
      const client = clients.find(c => c.id === id);

      if (client) {
        document.getElementById('quit-client-id').value = client.id;
        document.getElementById('quit-client-desc').innerHTML = `Cliente: <strong>${client.name}</strong>. Saldo Devedor atual: <strong class="text-danger">R$ ${client.debt.toFixed(2)}</strong>.`;
        document.getElementById('quit-amount').value = client.debt.toFixed(2);
        modalQuitacao.classList.add('active');
      }
    });
  });

  // Editar
  document.querySelectorAll('.btn-edit-client').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const clients = getClients();
      const client = clients.find(c => c.id === id);

      if (client) {
        modalTitle.textContent = 'Editar Cliente';
        document.getElementById('client-id').value = client.id;
        document.getElementById('client-name-input').value = client.name;
        document.getElementById('client-phone-input').value = client.phone;
        document.getElementById('client-email-input').value = client.email || '';
        const bdayISO = client.birthday || '';
        let bdayFormatted = '';
        if (bdayISO) {
          const parts = bdayISO.split('-');
          if (parts.length === 3) {
            bdayFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }
        document.getElementById('client-birthday-input').value = bdayFormatted;
        document.getElementById('client-notes-input').value = client.notes || '';
        modalCliente.classList.add('active');
      }
    });
  });

  // Excluir
  document.querySelectorAll('.btn-delete-client').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Tem certeza que deseja excluir este cliente?')) {
        deleteClient(id);
        showNotification('Cliente excluído com sucesso!', 'success');
        renderClientes(container);
      }
    });
  });

  // Ver Histórico / Ficha Financeira
  document.querySelectorAll('.btn-history-client').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const clients = getClients();
      const client = clients.find(c => c.id === id);
      const sales = getSales().filter(s => s.clientId === id);

      if (client) {
        document.getElementById('hist-client-name').textContent = client.name;
        document.getElementById('hist-client-phone').textContent = client.phone;
        document.getElementById('hist-client-email').textContent = client.email || 'Não informado';
        document.getElementById('hist-client-birthday').innerHTML = formatDate(client.birthday);
        document.getElementById('hist-client-debt').textContent = client.debt > 0 ? `R$ ${client.debt.toFixed(2)}` : 'R$ 0,00';
        document.getElementById('hist-client-debt').className = client.debt > 0 ? 'text-danger font-bold' : 'text-success';
        document.getElementById('hist-client-notes').textContent = client.notes || 'Sem observações cadastradas.';

        // Renderiza lista de compras no histórico
        const purchasesBody = document.getElementById('hist-purchases-body');
        if (sales.length === 0) {
          purchasesBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhuma compra registrada para este cliente.</td></tr>`;
        } else {
          purchasesBody.innerHTML = sales.map(sale => {
            const d = new Date(sale.timestamp);
            const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const itemsList = sale.items.map(item => `${item.name} (${item.quantity}un)`).join(', ');
            
            return `
              <tr>
                <td>${dateStr}</td>
                <td><span class="text-sm">${itemsList}</span></td>
                <td><span class="badge ${sale.paymentMethod === 'fiado' ? 'badge-danger' : 'badge-secondary'}">${translatePayment(sale.paymentMethod)}</span></td>
                <td class="text-right"><strong>R$ ${sale.total.toFixed(2)}</strong></td>
              </tr>
            `;
          }).join('');
        }

        modalHistorico.classList.add('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    });
  });
}

function translatePayment(method) {
  const methods = {
    'money': 'Dinheiro',
    'credit': 'Crédito',
    'debit': 'Débito',
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
