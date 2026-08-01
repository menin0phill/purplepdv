const fs = require('fs');
let code = fs.readFileSync('src/ecommerce.js', 'utf8');

const regex = /\/\/ Evento de Aplicar Cupom[\s\S]*?\}\);\s*\}/;

const replacement = // Event delegation for cart footer actions
    const drawerFooter = document.getElementById('ecom-drawer-footer');
    if (drawerFooter) {
      drawerFooter.addEventListener('click', (e) => {
        const btnApply = e.target.closest('#btn-ecom-apply-coupon');
        const btnCheckout = e.target.closest('#btn-go-to-checkout');
        
        if (btnApply) {
          const couponInput = document.getElementById('ecom-coupon-input');
          const couponMessage = document.getElementById('ecom-coupon-message');
          if (couponInput) {
            const code = couponInput.value.trim().toUpperCase();
            if (!code) return;

            if (code === 'PARABENSPURPLE') {
              if (!loggedClient) {
                if(couponMessage) couponMessage.innerHTML = '<span class="text-danger">Erro: Faça login para validar o aniversário!</span>';
                discountPercentage = 0;
              } else {
                const bdayMonth = loggedClient.birthday ? loggedClient.birthday.split('-')[1] : '';
                const curMonth = String(new Date().getMonth() + 1).padStart(2, '0');
                
                if (bdayMonth === curMonth) {
                  discountPercentage = 0.10;
                  if(couponMessage) couponMessage.innerHTML = '<span class="text-success font-bold">Cupom de Aniversário aplicado: 10% de desconto!</span>';
                  showNotification('Desconto de 10% de aniversário aplicado!', 'success');
                } else {
                  discountPercentage = 0;
                  if(couponMessage) couponMessage.innerHTML = '<span class="text-danger">Erro: Cupom válido apenas no mês do seu aniversário!</span>';
                  showNotification('Seu aniversário não é neste mês!', 'error');
                }
              }
            } else {
              discountPercentage = 0;
              if(couponMessage) couponMessage.innerHTML = '<span class="text-danger">Erro: Cupom inválido!</span>';
            }
            updateCartUI();
          }
        }

        if (btnCheckout) {
          const cartDrawer = document.getElementById('ecom-cart-drawer');
          if (cartDrawer) cartDrawer.classList.remove('active');
        }
      });
    };

code = code.replace(regex, replacement);
fs.writeFileSync('src/ecommerce.js', code);
