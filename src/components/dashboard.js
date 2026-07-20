import { getSales, getProducts, getClients } from '../db.js';
import { showReceipt } from './receipt.js';

export function renderDashboard(container) {
  const sales = getSales();
  const products = getProducts();
  const clients = getClients();

  // Cálculos gerais
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCost = sales.reduce((sum, s) => {
    const saleCost = s.items.reduce((costSum, item) => {
      const prod = products.find(p => p.id === item.id);
      const itemCost = prod ? prod.costPrice : 0;
      return costSum + (itemCost * item.quantity);
    }, 0);
    return sum + saleCost;
  }, 0);

  const profit = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;
  const totalSalesCount = sales.length;
  const ticketMedio = totalSalesCount > 0 ? (totalRevenue / totalSalesCount) : 0;

  // Faturamento por canal
  const posSalesTotal = sales.filter(s => s.origin !== 'e-commerce').reduce((sum, s) => sum + s.total, 0);
  const ecomSalesTotal = sales.filter(s => s.origin === 'e-commerce').reduce((sum, s) => sum + s.total, 0);

  // Distribuição de pagamento
  const paymentDistribution = sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
    return acc;
  }, { money: 0, credit: 0, debit: 0, pix: 0, fiado: 0 });

  // Produtos mais vendidos
  const productSalesMap = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSalesMap[item.id]) {
        productSalesMap[item.id] = {
          name: item.name,
          quantity: 0,
          total: 0
        };
      }
      productSalesMap[item.id].quantity += item.quantity;
      productSalesMap[item.id].total += (item.price * item.quantity);
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="dashboard-container fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Relatórios e Estatísticas</h1>
          <p class="text-muted">Desempenho de vendas Omnichannel da Purple Cosméticos</p>
        </div>
      </div>

      <!-- Métricas Principais -->
      <div class="grid grid-4 margin-top-md">
        <div class="glass-card stat-card border-left-purple">
          <span class="stat-label">Faturamento Total</span>
          <h3 class="stat-value">R$ ${totalRevenue.toFixed(2)}</h3>
          <span class="stat-sub">Loja: R$ ${posSalesTotal.toFixed(2)} | Online: R$ ${ecomSalesTotal.toFixed(2)}</span>
        </div>
        <div class="glass-card stat-card border-left-green">
          <span class="stat-label">Lucro Bruto Estimado</span>
          <h3 class="stat-value">R$ ${profit.toFixed(2)}</h3>
          <span class="stat-sub">Margem média: ${marginPercentage.toFixed(1)}%</span>
        </div>
        <div class="glass-card stat-card border-left-blue">
          <span class="stat-label">Total de Vendas</span>
          <h3 class="stat-value">${totalSalesCount}</h3>
          <span class="stat-sub">Transações finalizadas</span>
        </div>
        <div class="glass-card stat-card border-left-pink">
          <span class="stat-label">Ticket Médio</span>
          <h3 class="stat-value">R$ ${ticketMedio.toFixed(2)}</h3>
          <span class="stat-sub">Média por transação</span>
        </div>
      </div>

      <!-- Gráficos e Rankings -->
      <div class="grid grid-2 margin-top-md">
        
        <!-- Meios de Pagamento e Canais -->
        <div class="glass-card flex-col gap-md">
          <div class="dashboard-split-charts">
            <div class="chart-section">
              <h3>Faturamento por Meio de Pagamento</h3>
              <div class="chart-container margin-top-md">
                ${renderPaymentChart(paymentDistribution, totalRevenue)}
              </div>
            </div>
            
            <div class="receipt-divider mobile-only"></div>
            
            <div class="chart-section border-left-divider">
              <h3>Faturamento por Canal</h3>
              <div class="chart-container margin-top-md">
                ${renderChannelChart(posSalesTotal, ecomSalesTotal, totalRevenue)}
              </div>
            </div>
          </div>
        </div>

        <!-- Produtos Mais Vendidos -->
        <div class="glass-card">
          <h3>Top 5 Produtos Mais Vendidos</h3>
          <p class="text-muted text-sm margin-top-xs">Ranking por quantidade vendida</p>
          <div class="ranking-container margin-top-md">
            ${renderTopProducts(topProducts)}
          </div>
        </div>

      </div>

      <!-- Histórico de Transações Recentes -->
      <div class="glass-card margin-top-md">
        <div class="card-header">
          <h3>Vendas Recentes</h3>
        </div>
        <div class="table-container margin-top-sm max-h-recent-sales">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código/ID</th>
                <th>Data / Hora</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th class="text-center">Origem</th>
                <th>Forma Pagto.</th>
                <th class="text-right">Total</th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${renderRecentSalesTable(sales)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Relatório Sics de Aniversariantes (Marketing & Campanhas) -->
      <div class="glass-card margin-top-md">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <h3>Relatório de Aniversariantes (Sics Style)</h3>
            <p class="text-muted text-sm">Filtre clientes aniversariantes e envie o cupom <strong>PARABENSPURPLE</strong> de 10% por WhatsApp</p>
          </div>
          <div class="flex-row gap-sm align-center" style="display:flex; gap:10px; align-items:center;">
            <select id="bday-filter-type" class="input-sm">
              <option value="month" selected>Filtrar por Mês</option>
              <option value="day">Filtrar por Dia</option>
            </select>
            
            <select id="bday-month-select" class="input-sm">
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>

            <input type="date" id="bday-date-select" class="input-sm hidden" value="${todayStr}">
          </div>
        </div>

        <div class="table-container margin-top-sm">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Data de Nascimento</th>
                <th>Celular / WhatsApp</th>
                <th>E-mail</th>
                <th class="text-center">Ações / Campanha</th>
              </tr>
            </thead>
            <tbody id="bday-table-body">
              <!-- Preenchido dinamicamente -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Define os valores iniciais dos filtros de aniversário
  const filterTypeSelect = document.getElementById('bday-filter-type');
  const monthSelect = document.getElementById('bday-month-select');
  const dateSelect = document.getElementById('bday-date-select');
  
  // Set current month in selector
  monthSelect.value = currentMonthStr;

  // Renderiza aniversariantes inicial
  updateBirthdayReport();

  // Listeners para os filtros de aniversário
  filterTypeSelect.addEventListener('change', () => {
    const val = filterTypeSelect.value;
    if (val === 'month') {
      monthSelect.classList.remove('hidden');
      dateSelect.classList.add('hidden');
    } else {
      monthSelect.classList.add('hidden');
      dateSelect.classList.remove('hidden');
    }
    updateBirthdayReport();
  });

  monthSelect.addEventListener('change', updateBirthdayReport);
  dateSelect.addEventListener('change', updateBirthdayReport);

  function updateBirthdayReport() {
    const type = filterTypeSelect.value;
    const value = type === 'month' ? monthSelect.value : dateSelect.value;
    const container = document.getElementById('bday-table-body');
    
    const bdays = clients.filter(c => {
      if (!c.birthday) return false;
      const parts = c.birthday.split('-'); // YYYY-MM-DD
      if (parts.length !== 3) return false;
      
      if (type === 'month') {
        return parts[1] === value;
      } else {
        const valParts = value.split('-'); // YYYY-MM-DD
        return parts[1] === valParts[1] && parts[2] === valParts[2];
      }
    });

    if (bdays.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted pad-md">Nenhum aniversariante encontrado para este filtro.</td>
        </tr>
      `;
      return;
    }

    container.innerHTML = bdays.map(c => {
      const birthParts = c.birthday.split('-');
      const formattedBday = `${birthParts[2]}/${birthParts[1]}/${birthParts[0]}`;
      const cleanPhone = c.phone.replace(/\D/g, '');
      const textMessage = encodeURIComponent(`Olá, ${c.name.split(' ')[0]}! A Purple Cosméticos deseja a você um feliz aniversário! 🎂💜 Preparamos um presente especial: 10% de desconto em qualquer compra na nossa loja online este mês! Use o cupom PARABENSPURPLE no checkout. Aproveite aqui: http://localhost:5173/ecommerce.html`);
      const waUrl = `https://wa.me/55${cleanPhone}?text=${textMessage}`;

      return `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td><span class="text-purple font-bold"><i data-lucide="cake" class="icon-inline" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> ${formattedBday}</span></td>
          <td>${c.phone}</td>
          <td>${c.email || '<span class="text-muted">Não informado</span>'}</td>
          <td class="text-center">
            <div class="flex-row gap-xs justify-center" style="display:flex; gap:8px; justify-content:center;">
              <a href="${waUrl}" target="_blank" class="btn btn-secondary btn-sm text-success" title="Parabenizar via WhatsApp">
                <i data-lucide="send" class="icon-inline" style="width:12px;height:12px;"></i> Parabéns
              </a>
              <button class="btn btn-primary btn-sm btn-copy-coupon" data-coupon="PARABENSPURPLE" title="Copiar Cupom Aniversário">
                Copiar Cupom
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Adiciona listener para botões de copiar cupom
    container.querySelectorAll('.btn-copy-coupon').forEach(btn => {
      btn.addEventListener('click', () => {
        const coupon = btn.getAttribute('data-coupon');
        navigator.clipboard.writeText(coupon).then(() => {
          showNotification('Cupom PARABENSPURPLE copiado!', 'success');
        });
      });
    });
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Eventos de clique para ver cupom de vendas recentes
  document.querySelectorAll('.btn-view-receipt').forEach(btn => {
    btn.addEventListener('click', () => {
      const saleId = btn.getAttribute('data-id');
      const sale = sales.find(s => s.id === saleId);
      if (sale) {
        showReceipt(sale);
      }
    });
  });
}

function renderPaymentChart(dist, total) {
  const methods = [
    { key: 'money', label: 'Dinheiro', color: '#10b981' },
    { key: 'pix', label: 'Pix', color: '#06b6d4' },
    { key: 'credit', label: 'C. Crédito', color: '#8b5cf6' },
    { key: 'debit', label: 'C. Débito', color: '#ec4899' },
    { key: 'fiado', label: 'Fiado (Conta)', color: '#ef4444' }
  ];

  return methods.map(m => {
    const amount = dist[m.key] || 0;
    const percentage = total > 0 ? (amount / total * 100) : 0;
    
    return `
      <div class="chart-item margin-bottom-sm">
        <div class="chart-label-row">
          <span><strong>${m.label}</strong></span>
          <span>R$ ${amount.toFixed(2)} (${percentage.toFixed(0)}%)</span>
        </div>
        <div class="chart-bar-bg">
          <div class="chart-bar-fill" style="width: ${percentage}%; background-color: ${m.color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderChannelChart(pos, ecom, total) {
  const channels = [
    { label: 'Loja Física (POS)', amount: pos, color: '#a78bfa' },
    { label: 'E-Commerce (Online)', amount: ecom, color: '#f472b6' }
  ];

  return channels.map(c => {
    const percentage = total > 0 ? (c.amount / total * 100) : 0;
    
    return `
      <div class="chart-item margin-bottom-sm">
        <div class="chart-label-row">
          <span><strong>${c.label}</strong></span>
          <span>R$ ${c.amount.toFixed(2)} (${percentage.toFixed(0)}%)</span>
        </div>
        <div class="chart-bar-bg">
          <div class="chart-bar-fill" style="width: ${percentage}%; background-color: ${c.color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTopProducts(products) {
  if (products.length === 0) {
    return `<div class="text-center text-muted pad-md">Nenhuma venda registrada ainda.</div>`;
  }

  return products.map((p, idx) => `
    <div class="ranking-item">
      <div class="ranking-rank">${idx + 1}</div>
      <div class="ranking-info">
        <span class="ranking-name">${p.name}</span>
        <span class="ranking-qty text-muted">${p.quantity} unidades vendidas</span>
      </div>
      <div class="ranking-value">
        <strong>R$ ${p.total.toFixed(2)}</strong>
      </div>
    </div>
  `).join('');
}

function renderRecentSalesTable(sales) {
  if (sales.length === 0) {
    return `<tr><td colspan="8" class="text-center text-muted">Nenhuma venda registrada ainda.</td></tr>`;
  }

  const sortedSales = [...sales].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return sortedSales.map(sale => {
    const itemsCount = sale.items.reduce((sum, i) => sum + i.quantity, 0);
    const d = new Date(sale.timestamp);
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    const isEcom = sale.origin === 'e-commerce';
    
    return `
      <tr>
        <td><code class="barcode">${sale.id.split('_')[1] || sale.id}</code></td>
        <td>${dateStr}</td>
        <td>${sale.clientName || '<span class="text-muted">Consumidor Geral</span>'}</td>
        <td>${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'}</td>
        <td class="text-center">
          <span class="badge ${isEcom ? 'badge-info' : 'badge-primary'}">${isEcom ? 'E-Commerce' : 'Loja Física'}</span>
        </td>
        <td><span class="badge badge-secondary">${translatePayment(sale.paymentMethod)}</span></td>
        <td class="text-right"><strong>R$ ${sale.total.toFixed(2)}</strong></td>
        <td class="text-center">
          <button class="btn-icon btn-view-receipt" data-id="${sale.id}" title="Visualizar Cupom">
            <i data-lucide="eye"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function translatePayment(method) {
  const methods = {
    'money': 'Dinheiro',
    'credit': 'C. Crédito',
    'debit': 'C. Débito',
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
