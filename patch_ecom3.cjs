const fs = require('fs');
let code = fs.readFileSync('src/ecommerce.js', 'utf8');

const regex = /\/\/ Ações de alteração de sacola[\s\S]*?updateCartUI\(\);\s*\}\);\s*\}/;
code = code.replace(regex, '// Antigos listeners de sacola removidos (agora em setupLayoutEvents)');

fs.writeFileSync('src/ecommerce.js', code);
