// Componente para Simulação e Emissão de Cupom Não Fiscal

export function showReceipt(sale) {
  // Remove modal existente se houver
  const existingModal = document.getElementById('receipt-modal');
  if (existingModal) existingModal.remove();

  const d = new Date(sale.timestamp);
  const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  const itemsHTML = sale.items.map(item => `
    <div class="receipt-item">
      <div class="receipt-item-row">
        <span>${item.name}</span>
        <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
      </div>
      <div class="receipt-item-details">
        ${item.quantity} un x R$ ${item.price.toFixed(2)}
      </div>
    </div>
  `).join('');

  const changeDue = sale.amountPaid ? Math.max(0, sale.amountPaid - sale.total) : 0;

  const modalHTML = `
    <div id="receipt-modal" class="modal-overlay active">
      <div class="receipt-container scale-in">
        <div class="receipt-header">
          <div class="receipt-logo-container">
            <img src="/logo-purple.jpg" alt="Purple Logo" class="receipt-logo" onerror="this.src='https://instagram.fcgh13-1.fna.fbcdn.net/v/t51.82787-19/651031849_17966874450019045_9100807247552984597_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby44NDAuYzIifQ&_nc_ht=instagram.fcgh13-1.fna.fbcdn.net&_nc_cat=101&_nc_oc=Q6cZ2gHycOL9sD5xHY5FxNSgRSX2zXUNVbGhAFMCU2-eHb6Rysf1xxtGQbgLfuARnbBShC1lgu2RruKYQIc0-pCxF8Jl&_nc_ohc=EZMEJ4HLGO4Q7kNvwGewcRG&_nc_gid=6p0a7wHTtBkcfZVdLzYGpA&edm=APoiHPcBAAAA&ccb=7-5&oh=00_AQBAhoUNv7U6FBEqNAlimY0YwkPKb_5xZ83ur54LbSVd8g&oe=6A62003B&_nc_sid=22de04'">
          </div>
          <h3 style="font-size: 14px;">56.926.739 MARIA EDUARDA LANA DA COSTA</h3>
          <p style="font-size: 12px; font-weight: bold; color: var(--purple-accent); margin: 2px 0;">Purple Cosméticos - Beleza que Inspira</p>
          <p class="receipt-sub">Rua Jequirituba, 600 - Jardim Colonial - São Paulo/SP - CEP: 04821-035</p>
          <p class="receipt-sub">CNPJ: 56.926.739/0001-83 | IE: 150.561.424.113</p>
          <p class="receipt-sub">Tel: (11) 94903-2024 | E-mail: purplemakeup.contato@gmail.com</p>
        </div>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-info">
          <p><strong>CUPOM NÃO FISCAL</strong></p>
          <p>Venda: #${sale.id.split('_')[1] || sale.id}</p>
          <p>Data: ${formattedDate}</p>
          <p>Operador: ${sale.operator || 'Operador Purple'}</p>
          ${sale.clientName ? `<p>Cliente: ${sale.clientName}</p>` : ''}
        </div>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-items">
          ${itemsHTML}
        </div>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-totals">
          <div class="receipt-total-row">
            <span>Subtotal:</span>
            <span>R$ ${(sale.subtotal || (sale.total + (sale.discount || 0) - (sale.shippingFee || 0))).toFixed(2)}</span>
          </div>
          ${sale.discount > 0 ? `
          <div class="receipt-total-row discount">
            <span>Desconto ${sale.coupon ? `(Cupom: ${sale.coupon})` : ''}:</span>
            <span>- R$ ${sale.discount.toFixed(2)}</span>
          </div>
          ` : ''}
          ${sale.shippingFee > 0 ? `
          <div class="receipt-total-row shipping">
            <span>Frete ${sale.shippingCarrier ? `(${sale.shippingCarrier})` : ''}:</span>
            <span>+ R$ ${sale.shippingFee.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="receipt-total-row grand-total">
            <span>TOTAL:</span>
            <span>R$ ${sale.total.toFixed(2)}</span>
          </div>
          <div class="receipt-total-row">
            <span>Forma de Pagamento:</span>
            <span>${translatePayment(sale.paymentMethod)}</span>
          </div>
          ${sale.amountPaid ? `
          <div class="receipt-total-row">
            <span>Valor Pago:</span>
            <span>R$ ${sale.amountPaid.toFixed(2)}</span>
          </div>
          <div class="receipt-total-row">
            <span>Troco:</span>
            <span>R$ ${changeDue.toFixed(2)}</span>
          </div>
          ` : ''}
        </div>
        
        ${sale.deliveryAddress ? `
        <div class="receipt-divider"></div>
        <div class="receipt-info" style="font-size:12px; text-align:left;">
          <p><strong>ENDEREÇO DE ENTREGA:</strong></p>
          <p>${sale.deliveryAddress}</p>
        </div>
        ` : ''}
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-footer">
          <p>Obrigado pela preferência!</p>
          <p>Acesse nosso Instagram: @purple.cosmeticos</p>
          <div class="receipt-barcode">||||| | |||| || ||| ||||</div>
        </div>

        <div class="receipt-actions no-print">
          <button id="btn-print-receipt" class="btn btn-primary">
            <i data-lucide="printer"></i> Imprimir
          </button>
          <button id="btn-close-receipt" class="btn btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Ações
  document.getElementById('btn-close-receipt').addEventListener('click', () => {
    document.getElementById('receipt-modal').remove();
  });

  document.getElementById('btn-print-receipt').addEventListener('click', () => {
    window.print();
  });
}

function translatePayment(method) {
  const methods = {
    'money': 'Dinheiro',
    'credit': 'Cartão de Crédito',
    'debit': 'Cartão de Débito',
    'pix': 'Pix'
  };
  return methods[method] || method;
}
