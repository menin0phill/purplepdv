const fs = require('fs');
let code = fs.readFileSync('src/ecommerce.js', 'utf8');

// Replace the three querySelectorAll loops with one event delegation listener
const targetBlock =     drawerItems.querySelectorAll('.btn-ecom-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        const item = cart.find(i => i.cartKey === key);
        if (item && item.quantity < item.maxStock) {
          item.quantity++;
          updateCartUI();
        } else {
          showNotification('Limite de estoque atingido!', 'warning');
        }
      });
    });

    drawerItems.querySelectorAll('.btn-ecom-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        const item = cart.find(i => i.cartKey === key);
        if (item) {
          if (item.quantity > 1) {
            item.quantity--;
          } else {
            const idx = cart.findIndex(i => i.cartKey === key);
            if (idx !== -1) cart.splice(idx, 1);
          }
          updateCartUI();
        }
      });
    });

    drawerItems.querySelectorAll('.btn-ecom-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        const idx = cart.findIndex(i => i.cartKey === key);
        if (idx !== -1) cart.splice(idx, 1);
        updateCartUI();
      });
    });;

const replacement =     // Event delegation for cart actions
    drawerItems.addEventListener('click', (e) => {
      const btnPlus = e.target.closest('.btn-ecom-plus');
      const btnMinus = e.target.closest('.btn-ecom-minus');
      const btnDelete = e.target.closest('.btn-ecom-delete');

      if (btnPlus) {
        const key = btnPlus.getAttribute('data-key');
        const item = cart.find(i => i.cartKey === key);
        if (item && item.quantity < item.maxStock) {
          item.quantity++;
          updateCartUI();
        } else {
          showNotification('Limite de estoque atingido!', 'warning');
        }
      }

      if (btnMinus) {
        const key = btnMinus.getAttribute('data-key');
        const item = cart.find(i => i.cartKey === key);
        if (item) {
          if (item.quantity > 1) {
            item.quantity--;
          } else {
            const idx = cart.findIndex(i => i.cartKey === key);
            if (idx !== -1) cart.splice(idx, 1);
          }
          updateCartUI();
        }
      }

      if (btnDelete) {
        const key = btnDelete.getAttribute('data-key');
        const idx = cart.findIndex(i => i.cartKey === key);
        if (idx !== -1) cart.splice(idx, 1);
        updateCartUI();
      }
    });;

code = code.replace(targetBlock, replacement);
fs.writeFileSync('src/ecommerce.js', code);
