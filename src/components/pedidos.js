import { getSales, updateSaleStatus, sanitizeHTML } from '../db.js';

export function renderPedidos(container) {
  function showOrderDetailModal(sale) {
    let modal = document.getElementById('modal-pdv-order-detail');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-pdv-order-detail';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    
    const orderNum = sale.id.split('_')[1] || sale.id;
    const dateStr = new Date(sale.timestamp || sale.date).toLocaleString('pt-BR');
    
    let clientDetailsHTML = '';
    if (sale.clientId) {
      const clients = JSON.parse(localStorage.getItem('purple_pdv_clients')) || [];
      const client = clients.find(c => c.id === sale.clientId);
      if (client) {
        clientDetailsHTML = `
          <p style="margin: 4px 0;"><strong>WhatsApp:</strong> ${sanitizeHTML(client.phone || 'Não informado')}</p>
          <p style="margin: 4px 0;"><strong>E-mail:</strong> ${sanitizeHTML(client.email || 'Não informado')}</p>
          <p style="margin: 4px 0;"><strong>CPF/CNPJ:</strong> ${sanitizeHTML(client.cpfCnpj || 'Não informado')}</p>
        `;
      }
    }
    
    modal.innerHTML = `
      <div class="modal-card scale-in" style="background:#120a22; color:#fff; border:2px solid #8b5cf6; border-radius:16px; padding:24px; max-width:600px; width:90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align:left; position:relative; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; margin-bottom:16px;">
          <h3 style="margin:0; font-family:'Outfit', sans-serif; font-size:1.4rem; font-weight:700; color:#b794f4;">Detalhes do Pedido #${orderNum}</h3>
          <button type="button" id="btn-close-order-detail-modal" class="btn-icon" style="background:none; border:none; color:#a0aec0; cursor:pointer; font-size:1.5rem; display:flex; align-items:center; justify-content:center; width:30px; height:30px;"><i data-lucide="x"></i></button>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:16px; font-size:14px; max-height:420px; overflow-y:auto; padding-right:6px;">
          <!-- Dados do Cliente -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:12px; border-radius:8px;">
            <h4 style="margin:0 0- 8px 0; color:#8b5cf6; font-size:14px; font-weight:700; border-bottom:1px solid rgba(139,92,246,0.2); padding-bottom:4px; margin-bottom:8px;">Dados do Cliente</h4>
            <p style="margin: 4px 0;"><strong>Nome:</strong> ${sanitizeHTML(sale.clientName) || 'Visitante'}</p>
            ${clientDetailsHTML}
            <p style="margin: 4px 0;"><strong>Data/Horário:</strong> ${dateStr}</p>
            <p style="margin: 4px 0;"><strong>Origem:</strong> ${sale.origin === 'e-commerce' ? 'E-Commerce Online' : 'Frente de Caixa (PDV)'}</p>
          </div>
          
          <!-- Endereço para envio -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:12px; border-radius:8px;">
            <h4 style="margin:0 0 8px 0; color:#8b5cf6; font-size:14px; font-weight:700; border-bottom:1px solid rgba(139,92,246,0.2); padding-bottom:4px; margin-bottom:8px;">Endereço de Envio / Retirada</h4>
            <p style="margin:0; line-height:1.4;">${sanitizeHTML(sale.deliveryAddress) || 'Retirada na Loja Física'}</p>
            ${sale.shippingCarrier ? `<p style="margin:6px 0 0 0; font-size:12px; color:#a0aec0;"><strong>Transportadora:</strong> ${sanitizeHTML(sale.shippingCarrier)}</p>` : ''}
          </div>
          
          <!-- Itens do pedido -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:12px; border-radius:8px;">
            <h4 style="margin:0 0 8px 0; color:#8b5cf6; font-size:14px; font-weight:700; border-bottom:1px solid rgba(139,92,246,0.2); padding-bottom:4px; margin-bottom:8px;">Produtos Adquiridos</h4>
            <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:#a0aec0;">
                  <th style="padding:6px 0;">Produto</th>
                  <th style="padding:6px 0; text-align:center; width:60px;">Qtd</th>
                  <th style="padding:6px 0; text-align:right; width:85px;">Unit.</th>
                  <th style="padding:6px 0; text-align:right; width:85px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items.map(item => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:8px 0; color:#cbd5e1;">${sanitizeHTML(item.name)}</td>
                    <td style="padding:8px 0; text-align:center; color:#cbd5e1;">${item.quantity}</td>
                    <td style="padding:8px 0; text-align:right; color:#cbd5e1;">R$ ${item.price.toFixed(2)}</td>
                    <td style="padding:8px 0; text-align:right; font-weight:bold; color:#fff;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Resumo Financeiro -->
          <div style="background:rgba(139,92,246,0.05); border:1px solid rgba(139,92,246,0.15); padding:12px; border-radius:8px;">
            <h4 style="margin:0 0 8px 0; color:#b794f4; font-size:14px; font-weight:700; border-bottom:1px solid rgba(139,92,246,0.2); padding-bottom:4px; margin-bottom:8px;">Resumo de Pagamento</h4>
            <div style="display:flex; flex-direction:column; gap:6px; font-size:13px;">
              <div style="display:flex; justify-content:space-between; color:#cbd5e1;">
                <span>Subtotal:</span>
                <span>R$ ${sale.subtotal.toFixed(2)}</span>
              </div>
              ${sale.discount > 0 ? `
                <div style="display:flex; justify-content:space-between; color:#10b981;">
                  <span>Desconto aplicado:</span>
                  <span>- R$ ${sale.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              ${sale.shippingFee > 0 ? `
                <div style="display:flex; justify-content:space-between; color:#cbd5e1;">
                  <span>Frete cobrado:</span>
                  <span>+ R$ ${sale.shippingFee.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px; font-weight:bold; font-size:15px; color:#fff;">
                <span>Total Geral:</span>
                <span>R$ ${sale.total.toFixed(2)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:12px; color:#cbd5e1; margin-top:4px;">
                <span>Meio de Pagamento:</span>
                <span style="text-transform:uppercase; font-weight:bold; color:#b794f4;">${sanitizeHTML(sale.paymentMethod)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    modal.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 200);
    };
    
    document.getElementById('btn-close-order-detail-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

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
                  const dateStr = new Date(sale.timestamp || sale.date || new Date()).toLocaleString('pt-BR');
                  const orderNum = sale.id.split('_')[1] || sale.id;
                  let statusClass = 'status-prep';
                  if (sale.status === 'Enviado') statusClass = 'status-env';
                  if (sale.status === 'Entregue') statusClass = 'status-ent';
                  if (sale.status === 'Cancelado') statusClass = 'status-can';
                  
                  return `
                    <tr data-id="${sale.id}">
                      <td class="order-num-link" data-id="${sale.id}" style="font-weight:bold; color:var(--primary); cursor:pointer; text-decoration:underline;" title="Ver Detalhes do Pedido">#${orderNum}</td>
                      <td>${dateStr}</td>
                      <td>
                        <strong>${sanitizeHTML(sale.clientName) || 'Visitante'}</strong>
                      </td>
                      <td style="max-width:200px; white-space:normal; font-size:12px;">
                        ${sanitizeHTML(sale.deliveryAddress) || 'Retirada na Loja'}
                      </td>
                      <td style="font-size:12px;">
                        ${sale.items.map(item => `${item.quantity}x ${sanitizeHTML(item.name)}`).join('<br>')}
                      </td>
                      <td style="font-weight:bold;">R$ ${sale.total.toFixed(2)}</td>
                      <td style="text-transform:uppercase; font-size:11px;">
                        ${sanitizeHTML(sale.paymentMethod)}
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

    // Event listener para abrir detalhes do pedido ao clicar no número do pedido
    container.querySelectorAll('.order-num-link').forEach(link => {
      link.addEventListener('click', () => {
        const saleId = link.getAttribute('data-id');
        const sales = getSales();
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
          showOrderDetailModal(sale);
        }
      });
    });

    // Event listener para mudança de status
    container.querySelectorAll('.select-order-status').forEach(select => {
      select.addEventListener('change', (e) => {
        const saleId = select.getAttribute('data-id');
        const newStatus = select.value;
        try {
          updateSaleStatus(saleId, newStatus);
          
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
