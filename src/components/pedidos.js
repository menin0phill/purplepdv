import { getSales, updateSaleStatus } from '../db.js';

export function renderPedidos(container) {
  function loadPedidos() {
    const sales = getSales();
    const ecomSales = sales.filter(s => s.origin === 'e-commerce');

    if (ecomSales.length === 0) {
      container.innerHTML = `
        <div class="card text-center pad-lg">
          <i data-lucide="shopping-bag" class="icon-lg text-muted" style="margin: 0 auto 12px auto; display:block;"></i>
          <h3>Nenhum Pedido Online</h3>
          <p class="text-muted">Os pedidos realizados no e-commerce aparecerão aqui.</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="card">
          <div class="card-header">
            <h3>Gerenciamento de Pedidos Online</h3>
          </div>
          <div class="table-container margin-top-md" style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Endereço/Modo</th>
                  <th>Itens</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                  <th>Situação (Status)</th>
                </tr>
              </thead>
              <tbody id="ecom-orders-tbody">
                ${ecomSales.reverse().map(sale => {
                  const dateStr = new Date(sale.timestamp).toLocaleString('pt-BR');
                  const orderNum = sale.id.split('_')[1] || sale.id;
                  let statusClass = 'status-prep';
                  if (sale.status === 'Enviado') statusClass = 'status-env';
                  if (sale.status === 'Entregue') statusClass = 'status-ent';
                  if (sale.status === 'Cancelado') statusClass = 'status-can';
                  
                  return `
                    <tr data-id="${sale.id}">
                      <td style="font-weight:bold; color:var(--primary);">#${orderNum}</td>
                      <td>${dateStr}</td>
                      <td>
                        <strong>${sale.clientName || 'Visitante'}</strong>
                      </td>
                      <td style="max-width:200px; white-space:normal; font-size:12px;">
                        ${sale.deliveryAddress || 'Retirada na Loja'}
                      </td>
                      <td style="font-size:12px;">
                        ${sale.items.map(item => `${item.quantity}x ${item.name}`).join('<br>')}
                      </td>
                      <td style="font-weight:bold;">R$ ${sale.total.toFixed(2)}</td>
                      <td style="text-transform:uppercase; font-size:11px;">
                        ${sale.paymentMethod}
                      </td>
                      <td>
                        <select class="select-order-status input-xs ${statusClass}" data-id="${sale.id}" style="padding:4px 8px; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); font-weight:bold;">
                          <option value="Preparando" ${sale.status === 'Preparando' || !sale.status ? 'selected' : ''}>Preparando</option>
                          <option value="Enviado" ${sale.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                          <option value="Entregue" ${sale.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
                          <option value="Cancelado" ${sale.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Event listener para mudança de status
    container.querySelectorAll('.select-order-status').forEach(select => {
      select.addEventListener('change', (e) => {
        const saleId = select.getAttribute('data-id');
        const newStatus = select.value;
        try {
          updateSaleStatus(saleId, newStatus);
          
          // Remove classes antigas e adiciona nova baseada no valor selecionado
          select.classList.remove('status-prep', 'status-env', 'status-ent', 'status-can');
          if (newStatus === 'Preparando') select.classList.add('status-prep');
          if (newStatus === 'Enviado') select.classList.add('status-env');
          if (newStatus === 'Entregue') select.classList.add('status-ent');
          if (newStatus === 'Cancelado') select.classList.add('status-can');
          
          showPDVNotification(`Situação do Pedido #${saleId.split('_')[1] || saleId} alterada para "${newStatus}"!`, 'success');
        } catch (err) {
          showPDVNotification(err.message, 'error');
        }
      });
    });
  }

  function showPDVNotification(msg, type) {
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

  loadPedidos();
}
