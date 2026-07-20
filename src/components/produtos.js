import { getProducts, addProduct, updateProduct, deleteProduct, uploadProductImage, supabase } from '../db.js';

function generateBarcode39SVG(code) {
  const CHARS = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101'
  };
  const cleanCode = `*${String(code).toUpperCase().replace(/[^0-9A-Z\-.\s]/g, '')}*`;
  let pattern = '';
  for (let i = 0; i < cleanCode.length; i++) {
    pattern += (CHARS[cleanCode[i]] || CHARS[' ']) + '0';
  }
  const barWidth = 2;
  const height = 40;
  let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${pattern.length * barWidth} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      svg += `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="black" />`;
    }
  }
  svg += `</svg>`;
  return svg;
}

export function renderProdutos(container) {
  const products = getProducts();
  const categories = [...new Set(products.map(p => p.category))];

  container.innerHTML = `
    <div class="produtos-container fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Cadastro de Produtos</h1>
          <p class="text-muted">Gerencie o catálogo de cosméticos, estoque global e variações de cores/tons</p>
        </div>
        <div style="display:flex; gap:10px;">
          <input type="file" id="import-excel-file" accept=".xlsx, .xls, .csv" style="display: none;">
          <button id="btn-import-excel" class="btn btn-secondary" style="display:flex; align-items:center; gap:6px;">
            <i data-lucide="file-spreadsheet" style="width:16px; height:16px;"></i> Importar Planilha
          </button>
          <button id="btn-novo-produto" class="btn btn-primary">
            <i data-lucide="plus"></i> Novo Produto
          </button>
        </div>
      </div>

      <div class="glass-card margin-top-md">
        <!-- Filtros e Pesquisa -->
        <div class="filters-row flex-row justify-between gap-md">
          <div class="search-input-container flex-grow">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" id="search-product" placeholder="Buscar por nome ou código de barras...">
          </div>
          <div class="filter-select-container">
            <select id="filter-category" class="input-sm">
              <option value="">Todas as Categorias</option>
              ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Tabela de Produtos -->
        <div class="table-container margin-top-md">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto / Variações</th>
                <th>Categoria</th>
                <th class="text-right">Preço Custo</th>
                <th class="text-right">Preço Venda</th>
                <th class="text-center">Margem</th>
                <th class="text-center">Estoque Total</th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody id="products-table-body">
              ${renderProductsTableRows(products)}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Novo/Editar Produto -->
    <div id="modal-produto" class="modal-overlay">
      <div class="modal-card max-w-lg">
        <h3 id="product-modal-title">Novo Produto</h3>
        <form id="form-produto" class="form-grid margin-top-md">
          <input type="hidden" id="prod-id">
          
          <div class="form-col-6">
            <label for="prod-code">Código de Barras</label>
            <input type="text" id="prod-code" placeholder="Ex: 7891000000..." required>
          </div>
          
          <div class="form-col-6">
            <label for="prod-name">Nome do Produto</label>
            <input type="text" id="prod-name" placeholder="Ex: Batom Matte Purple" required>
          </div>

          <div class="form-col-6">
            <label for="prod-category">Categoria</label>
            <input type="text" id="prod-category" placeholder="Ex: Labios, Rosto..." required list="categories-list">
            <datalist id="categories-list">
              ${categories.map(cat => `<option value="${cat}">`).join('')}
            </datalist>
          </div>

          <div class="form-col-6">
            <label for="prod-color">Cor Visual / Identificador</label>
            <input type="color" id="prod-color" value="#8b5cf6">
          </div>

          <div class="form-col-4">
            <label for="prod-cost">Preço Custo (R$)</label>
            <input type="number" id="prod-cost" placeholder="0,00" step="0.01" required min="0">
          </div>

          <div class="form-col-4">
            <label for="prod-price">Preço Venda (R$)</label>
            <input type="number" id="prod-price" placeholder="0,00" step="0.01" required min="0">
          </div>

          <div class="form-col-4">
            <label for="prod-stock">Estoque Geral</label>
            <input type="number" id="prod-stock" placeholder="0" required min="0">
          </div>

          <div class="form-col-12" style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 600; margin-bottom: 2px;">Imagem do Produto</label>
            <div style="display: flex; gap: 15px; align-items: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);">
              <div id="prod-image-preview" style="width: 60px; height: 60px; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                <i data-lucide="image" style="width: 24px; height: 24px; color: rgba(255,255,255,0.4);"></i>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px; flex-grow: 1;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="file" id="prod-image-file" accept="image/*" style="display: none;">
                  <button type="button" id="btn-upload-prod-image" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="upload" style="width: 14px; height: 14px;"></i> Upload Foto
                  </button>
                  <span id="prod-image-filename" class="text-xs text-muted" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Nenhum arquivo selecionado</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="text-xs text-muted">ou URL:</span>
                  <input type="url" id="prod-image" placeholder="https://exemplo.com/imagem.png" class="input-sm" style="flex-grow: 1; padding: 4px 8px; font-size: 12px; border-radius:4px; border:1px solid rgba(255,255,255,0.12); background:rgba(0,0,0,0.2); color:white;">
                </div>
              </div>
            </div>
          </div>

          <!-- Seção de Variações de Cores/Tons -->
          <div class="form-col-12 border-top-purple pad-top-sm margin-top-sm">
            <div class="flex-row justify-between align-center" style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="margin:0;">Variações (Cores / Tons / Subcategorias)</h4>
              <button type="button" id="btn-add-variation" class="btn btn-secondary btn-sm">
                <i data-lucide="plus"></i> Add Variação
              </button>
            </div>
            <p class="text-muted text-xs margin-top-xs">
              Se cadastrar variações abaixo, o estoque geral acima será calculado automaticamente como a soma dos estoques de cada variação.
            </p>
            
            <div id="variations-form-list" class="margin-top-sm">
              <!-- Injetado dinamicamente -->
            </div>
          </div>

          <div class="modal-actions form-col-12 margin-top-lg">
            <button type="button" id="btn-cancel-product" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar Produto</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  setupProductEvents(container);
}

function renderProductsTableRows(products) {
  if (products.length === 0) {
    return `<tr><td colspan="8" class="text-center text-muted">Nenhum produto cadastrado.</td></tr>`;
  }

  return products.map(p => {
    const margin = p.price > 0 ? ((p.price - p.costPrice) / p.price * 100) : 0;
    const stockClass = p.stock <= 5 ? 'text-danger font-bold' : (p.stock <= 15 ? 'text-warning' : 'text-success');
    const hasVars = p.variations && p.variations.length > 0;
    
    return `
      <tr id="row-${p.id}">
        <td><code class="barcode">${p.code}</code></td>
        <td>
          <div class="product-cell">
            <span class="product-color-indicator" style="background-color: ${p.color || '#8b5cf6'}"></span>
            <div>
              <span class="product-name"><strong>${p.name}</strong></span>
              ${hasVars ? `<br><span class="text-xs text-purple italic font-bold">Cores: ${p.variations.map(v => `${v.name} (${v.stock}un)`).join(', ')}</span>` : ''}
            </div>
          </div>
        </td>
        <td><span class="badge badge-secondary">${p.category}</span></td>
        <td class="text-right text-muted">R$ ${p.costPrice.toFixed(2)}</td>
        <td class="text-right"><strong>R$ ${p.price.toFixed(2)}</strong></td>
        <td class="text-center text-muted">${margin.toFixed(0)}%</td>
        <td class="text-center ${stockClass}">${p.stock}</td>
        <td class="text-center">
          <div class="table-actions">
            <button class="btn-icon btn-barcode-prod" data-id="${p.id}" title="Gerar Etiquetas de Código de Barras">
              <i data-lucide="barcode"></i>
            </button>
            <button class="btn-icon btn-edit-prod" data-id="${p.id}" title="Editar">
              <i data-lucide="edit"></i>
            </button>
            <button class="btn-icon text-danger btn-delete-prod" data-id="${p.id}" title="Excluir">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupProductEvents(container) {
  const modal = document.getElementById('modal-produto');
  const modalTitle = document.getElementById('product-modal-title');
  const form = document.getElementById('form-produto');
  const searchInput = document.getElementById('search-product');
  const categoryFilter = document.getElementById('filter-category');
  const btnAddVar = document.getElementById('btn-add-variation');
  const varsList = document.getElementById('variations-form-list');

  // Lógica de importação de planilha Excel
  const fileInput = document.getElementById('import-excel-file');
  const importBtn = document.getElementById('btn-import-excel');
  
  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => {
      if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = () => {
          fileInput.click();
        };
        script.onerror = () => {
          showNotification('Erro ao carregar biblioteca de planilhas do CDN. Verifique a conexão.', 'error');
        };
        document.head.appendChild(script);
      } else {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (rows.length < 2) {
            showNotification('Planilha vazia ou sem linhas de dados!', 'error');
            return;
          }

          const headers = rows[0].map(h => String(h).trim().toLowerCase());
          
          // Mapeamento de colunas em português e inglês:
          // "código", "codigo", "code"
          // "produto", "produto/variação", "name", "nome"
          // "custo", "cost", "preço custo"
          // "valor de venda", "valor", "preço", "price"
          // "estoque", "stock", "quantidade", "qtd"
          // "categoria", "category"
          const idxCode = headers.findIndex(h => h.includes('código') || h.includes('codigo') || h.includes('code') || h.includes('barras'));
          const idxName = headers.findIndex(h => h.includes('produto') || h.includes('name') || h.includes('nome'));
          const idxCost = headers.findIndex(h => h.includes('custo') || h.includes('cost') || h.includes('preço custo'));
          const idxPrice = headers.findIndex(h => h.includes('venda') || h.includes('price') || h.includes('preço venda') || h.includes('valor'));
          const idxStock = headers.findIndex(h => h.includes('estoque') || h.includes('stock') || h.includes('qtd') || h.includes('quantidade'));
          const idxCat = headers.findIndex(h => h.includes('categoria') || h.includes('category'));

          if (idxName === -1 || idxPrice === -1) {
            showNotification('Planilha inválida! As colunas "Produto" e "Valor de Venda" são obrigatórias.', 'error');
            return;
          }

          const currentProducts = getProducts();
          let importedCount = 0;

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const name = String(row[idxName] || '').trim();
            if (!name) continue;

            const code = idxCode !== -1 ? String(row[idxCode] || '').trim() : '';
            const costPrice = idxCost !== -1 ? parseFloat(String(row[idxCost] || '0').replace('R$', '').replace(/\s/g, '').replace('.', '').replace(',', '.')) || 0 : 0;
            const price = parseFloat(String(row[idxPrice] || '0').replace('R$', '').replace(/\s/g, '').replace('.', '').replace(',', '.')) || 0;
            const stock = idxStock !== -1 ? parseInt(String(row[idxStock] || '0')) || 0 : 0;
            const category = idxCat !== -1 ? String(row[idxCat] || 'Geral').trim() : 'Geral';

            const exists = currentProducts.some(p => (code && p.code === code) || p.name.toLowerCase() === name.toLowerCase());
            if (!exists) {
              addProduct({
                code: code || ('p_bar_' + Date.now() + Math.random().toString(36).substr(2, 4)),
                name,
                category,
                costPrice,
                price,
                stock,
                description: 'Importado de planilha Excel.',
                image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
                variations: []
              });
              importedCount++;
            }
          }

          // Reset do valor do input file para permitir novo upload do mesmo arquivo
          fileInput.value = '';

          if (importedCount > 0) {
            showNotification(`${importedCount} produtos importados com sucesso!`, 'success');
            renderProdutos(container);
          } else {
            showNotification('Nenhum produto novo importado (todos já existem)!', 'warning');
          }

        } catch (err) {
          showNotification('Erro ao processar planilha: ' + err.message, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Função auxiliar para criar linhas de variação no formulário
  function addVariationLine(name = '', stock = 0, varId = '') {
    const uniqueId = varId || 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const line = document.createElement('div');
    line.className = 'variation-form-line margin-bottom-xs';
    line.id = `var-line-${uniqueId}`;
    line.style.display = 'flex';
    line.style.gap = '8px';
    line.style.alignItems = 'center';
    
    line.innerHTML = `
      <input type="hidden" class="var-id-input" value="${uniqueId}">
      <input type="text" class="var-name-input input-sm" placeholder="Nome da variação (Ex: Cor 01)" value="${name}" required style="flex-grow: 1;">
      <input type="number" class="var-stock-input input-sm" placeholder="Qtd" value="${stock}" required min="0" style="width: 80px;">
      <button type="button" class="btn-icon text-danger btn-delete-var-line" data-id="${uniqueId}">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    
    varsList.appendChild(line);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Adiciona listener para recalcular estoque total ao editar
    line.querySelector('.var-stock-input').addEventListener('input', updatePrincipalStockCalculations);
    
    // Adiciona listener para excluir
    line.querySelector('.btn-delete-var-line').addEventListener('click', () => {
      line.remove();
      updatePrincipalStockCalculations();
    });

    updatePrincipalStockCalculations();
  }

  function updatePrincipalStockCalculations() {
    const stockInput = document.getElementById('prod-stock');
    const varLines = varsList.querySelectorAll('.variation-form-line');
    
    if (varLines.length > 0) {
      stockInput.disabled = true;
      let sum = 0;
      varLines.forEach(line => {
        sum += parseInt(line.querySelector('.var-stock-input').value) || 0;
      });
      stockInput.value = sum;
    } else {
      stockInput.disabled = false;
    }
  }

  // Listener do botão de adicionar variação
  btnAddVar.addEventListener('click', () => {
    addVariationLine('', 0);
  });

  // Função auxiliar para atualizar preview de imagem
  const updateImagePreview = (src) => {
    const preview = document.getElementById('prod-image-preview');
    if (!preview) return;
    if (src) {
      preview.innerHTML = `<img src="${src}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      preview.innerHTML = `<i data-lucide="image" style="width: 24px; height: 24px; color: rgba(255,255,255,0.4);"></i>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  };

  const fileImgInput = document.getElementById('prod-image-file');
  const uploadImgBtn = document.getElementById('btn-upload-prod-image');
  const filenameImgSpan = document.getElementById('prod-image-filename');
  const urlImgInput = document.getElementById('prod-image');

  if (uploadImgBtn && fileImgInput) {
    uploadImgBtn.addEventListener('click', () => fileImgInput.click());
    fileImgInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      filenameImgSpan.textContent = `Carregando: ${file.name}`;
      
      // Mostrar preview local imediatamente
      const localReader = new FileReader();
      localReader.onload = (evt) => {
        updateImagePreview(evt.target.result);
      };
      localReader.readAsDataURL(file);

      if (supabase) {
        filenameImgSpan.textContent = 'Enviando para o Supabase...';
        uploadImgBtn.disabled = true;
        const oldText = uploadImgBtn.textContent;
        uploadImgBtn.textContent = 'Enviando...';
        
        try {
          const publicUrl = await uploadProductImage(file);
          urlImgInput.value = publicUrl;
          filenameImgSpan.textContent = 'Salvo na nuvem!';
          showNotification('Foto enviada com sucesso para a nuvem!', 'success');
        } catch (err) {
          console.error("Supabase Storage Error:", err);
          showNotification('Erro ao enviar para nuvem. Salvando localmente.', 'warning');
          
          // Fallback para Base64 local
          const reader = new FileReader();
          reader.onload = (evt) => {
            urlImgInput.value = evt.target.result;
            filenameImgSpan.textContent = 'Salvo localmente (Base64)';
          };
          reader.readAsDataURL(file);
        } finally {
          uploadImgBtn.disabled = false;
          uploadImgBtn.textContent = oldText;
        }
      } else {
        // Fallback síncrono local se Supabase não configurado
        const reader = new FileReader();
        reader.onload = (evt) => {
          urlImgInput.value = evt.target.result;
          filenameImgSpan.textContent = 'Salvo localmente (Base64)';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (urlImgInput) {
    urlImgInput.addEventListener('input', (e) => {
      updateImagePreview(e.target.value);
      if (filenameImgSpan) filenameImgSpan.textContent = 'Nenhum arquivo selecionado';
      if (fileImgInput) fileImgInput.value = '';
    });
  }

  // Listener para inputs de variação
  varsList.addEventListener('input', (e) => {
    if (e.target.classList.contains('var-stock-input')) {
      updatePrincipalStockCalculations();
    }
  });

  // Abrir Modal de Criação
  document.getElementById('btn-novo-produto').addEventListener('click', () => {
    modalTitle.textContent = 'Novo Produto';
    form.reset();
    document.getElementById('prod-id').value = '';
    varsList.innerHTML = '';
    updatePrincipalStockCalculations();
    updateImagePreview('');
    if (filenameImgSpan) filenameImgSpan.textContent = 'Nenhum arquivo selecionado';
    if (fileImgInput) fileImgInput.value = '';
    modal.classList.add('active');
  });

  // Fechar Modal
  document.getElementById('btn-cancel-product').addEventListener('click', () => {
    modal.classList.remove('active');
    form.reset();
    updateImagePreview('');
    if (filenameImgSpan) filenameImgSpan.textContent = 'Nenhum arquivo selecionado';
    if (fileImgInput) fileImgInput.value = '';
  });

  // Submissão do Formulário
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    
    // Extrai variações
    const variations = [];
    varsList.querySelectorAll('.variation-form-line').forEach(line => {
      variations.push({
        id: line.querySelector('.var-id-input').value,
        name: line.querySelector('.var-name-input').value,
        stock: parseInt(line.querySelector('.var-stock-input').value) || 0
      });
    });

    const productData = {
      code: document.getElementById('prod-code').value,
      name: document.getElementById('prod-name').value,
      category: document.getElementById('prod-category').value,
      color: document.getElementById('prod-color').value,
      costPrice: parseFloat(document.getElementById('prod-cost').value) || 0,
      price: parseFloat(document.getElementById('prod-price').value) || 0,
      stock: parseInt(document.getElementById('prod-stock').value) || 0,
      image: document.getElementById('prod-image').value || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=150&auto=format&fit=crop&q=60',
      variations: variations
    };

    if (id) {
      updateProduct(id, productData);
      showNotification('Produto atualizado com sucesso!', 'success');
    } else {
      addProduct(productData);
      showNotification('Produto cadastrado com sucesso!', 'success');
    }

    modal.classList.remove('active');
    form.reset();
    renderProdutos(container);
  });

  // Filtragem e Pesquisa em tempo real
  const handleFilter = () => {
    const query = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const allProducts = getProducts();

    const filtered = allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(query) || p.code.includes(query);
      const matchesCategory = category === '' || p.category === category;
      return matchesSearch && matchesCategory;
    });

    document.getElementById('products-table-body').innerHTML = renderProductsTableRows(filtered);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setupRowActions(container);
  };

  searchInput.addEventListener('input', handleFilter);
  categoryFilter.addEventListener('change', handleFilter);

  // Ações das Linhas (Editar/Excluir)
  setupRowActions(container);
}

function setupRowActions(container) {
  const modal = document.getElementById('modal-produto');
  const modalTitle = document.getElementById('product-modal-title');
  const form = document.getElementById('form-produto');
  const varsList = document.getElementById('variations-form-list');

  // Função auxiliar herdada para popular variações ao editar
  function addVariationLine(name = '', stock = 0, varId = '') {
    const uniqueId = varId || 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const line = document.createElement('div');
    line.className = 'variation-form-line margin-bottom-xs';
    line.id = `var-line-${uniqueId}`;
    line.style.display = 'flex';
    line.style.gap = '8px';
    line.style.alignItems = 'center';
    
    line.innerHTML = `
      <input type="hidden" class="var-id-input" value="${uniqueId}">
      <input type="text" class="var-name-input input-sm" placeholder="Nome da variação (Ex: Cor 01)" value="${name}" required style="flex-grow: 1;">
      <input type="number" class="var-stock-input input-sm" placeholder="Qtd" value="${stock}" required min="0" style="width: 80px;">
      <button type="button" class="btn-icon text-danger btn-delete-var-line" data-id="${uniqueId}">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    
    varsList.appendChild(line);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Adiciona recalculadores
    line.querySelector('.var-stock-input').addEventListener('input', () => {
      const stockInput = document.getElementById('prod-stock');
      let sum = 0;
      varsList.querySelectorAll('.variation-form-line').forEach(l => {
        sum += parseInt(l.querySelector('.var-stock-input').value) || 0;
      });
      stockInput.value = sum;
    });
    
    // Adiciona deletores
    line.querySelector('.btn-delete-var-line').addEventListener('click', () => {
      line.remove();
      const stockInput = document.getElementById('prod-stock');
      const varLines = varsList.querySelectorAll('.variation-form-line');
      if (varLines.length > 0) {
        stockInput.disabled = true;
        let sum = 0;
        varLines.forEach(l => {
          sum += parseInt(l.querySelector('.var-stock-input').value) || 0;
        });
        stockInput.value = sum;
      } else {
        stockInput.disabled = false;
      }
    });
  }

  // Editar
  document.querySelectorAll('.btn-edit-prod').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const products = getProducts();
      const product = products.find(p => p.id === id);

      if (product) {
        modalTitle.textContent = 'Editar Produto';
        document.getElementById('prod-id').value = product.id;
        document.getElementById('prod-code').value = product.code;
        document.getElementById('prod-name').value = product.name;
        document.getElementById('prod-category').value = product.category;
        document.getElementById('prod-color').value = product.color || '#8b5cf6';
        document.getElementById('prod-cost').value = product.costPrice;
        document.getElementById('prod-price').value = product.price;
        document.getElementById('prod-stock').value = product.stock;
        document.getElementById('prod-image').value = product.image || '';
        
        // Atualiza a pré-visualização da imagem no modal
        const previewEl = document.getElementById('prod-image-preview');
        const filenameEl = document.getElementById('prod-image-filename');
        if (previewEl) {
          if (product.image) {
            previewEl.innerHTML = `<img src="${product.image}" style="width: 100%; height: 100%; object-fit: cover;">`;
            if (filenameEl) {
              filenameEl.textContent = product.image.startsWith('data:') ? 'Foto Carregada (Base64)' : 'URL Externa';
            }
          } else {
            previewEl.innerHTML = `<i data-lucide="image" style="width: 24px; height: 24px; color: rgba(255,255,255,0.4);"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            if (filenameEl) filenameEl.textContent = 'Nenhum arquivo selecionado';
          }
        }
        
        // Limpa e injeta variações do produto
        varsList.innerHTML = '';
        if (product.variations && product.variations.length > 0) {
          product.variations.forEach(v => {
            addVariationLine(v.name, v.stock, v.id);
          });
          document.getElementById('prod-stock').disabled = true;
        } else {
          document.getElementById('prod-stock').disabled = false;
        }

        modal.classList.add('active');
      }
    });
  });

  // Gerador de Etiquetas de Código de Barras
  document.querySelectorAll('.btn-barcode-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const products = getProducts();
      const product = products.find(p => p.id === id);
      if (product) {
        openBarcodeGeneratorModal(product);
      }
    });
  });

  function openBarcodeGeneratorModal(product) {
    const existing = document.getElementById('modal-barcode-print');
    if (existing) existing.remove();

    const hasVars = product.variations && product.variations.length > 0;

    const modalHTML = `
      <div id="modal-barcode-print" class="modal-overlay active">
        <div class="modal-card max-w-lg" style="background: var(--card-bg); color: var(--text-main);">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
            <h3 style="margin:0;">Gerador de Etiquetas</h3>
            <button id="btn-close-barcode-modal" class="btn-icon"><i data-lucide="x"></i></button>
          </div>
          
          <div class="margin-top-md form-group" style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <strong>Produto:</strong> ${product.name}
            </div>
            
            ${hasVars ? `
              <div>
                <label for="barcode-var-select" class="text-xs text-muted font-bold block margin-bottom-xs">Selecionar Variação / Cor (Opcional):</label>
                <select id="barcode-var-select" class="input-sm" style="width:100%;">
                  <option value="main">Produto Principal (Código: ${product.code})</option>
                  ${product.variations.map(v => `<option value="${v.id}">${v.name} (Código: ${product.code}-${v.id})</option>`).join('')}
                </select>
              </div>
            ` : ''}

            <div style="display:flex; gap:15px; align-items:center;">
              <div style="flex-grow:1;">
                <label for="barcode-qty-input" class="text-xs text-muted font-bold block margin-bottom-xs">Quantidade de Etiquetas (Grade):</label>
                <input type="number" id="barcode-qty-input" value="12" min="1" max="120" class="input-sm" style="width:100px;">
              </div>
              
              <button id="btn-print-barcodes-action" class="btn btn-primary" style="height:36px; margin-top:16px;">
                <i data-lucide="printer" class="icon-inline" style="width:16px; height:16px;"></i> Imprimir Etiquetas
              </button>
            </div>

            <div class="receipt-divider"></div>
            
            <div>
              <span class="text-xs text-muted font-bold">Pré-visualização:</span>
              <div id="barcode-preview-area" class="margin-top-xs" style="background:#fff; padding:15px; border-radius:var(--radius-md); overflow-y:auto; max-height:260px; border:1px solid var(--border-color);">
                <!-- Grid de etiquetas preenchido via JS -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const m = document.getElementById('modal-barcode-print');
    const qtyInput = document.getElementById('barcode-qty-input');
    const varSelect = document.getElementById('barcode-var-select');
    const previewArea = document.getElementById('barcode-preview-area');

    function updatePreview() {
      const qty = parseInt(qtyInput.value) || 12;
      const selectedVarId = varSelect ? varSelect.value : 'main';
      
      let activeCode = product.code;
      let activeName = product.name;
      
      if (selectedVarId !== 'main') {
        const v = product.variations.find(va => va.id === selectedVarId);
        if (v) {
          activeCode = `${product.code}-${v.id}`;
          activeName = `${product.name} - ${v.name}`;
        }
      }

      previewArea.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px;">
          ${Array.from({ length: qty }).map(() => `
            <div class="label-preview-card" style="background:#f9fafb; border:1px solid #d1d5db; border-radius:6px; padding:6px; display:flex; flex-direction:column; justify-content:space-between; width:100%; box-sizing:border-box; color:#000;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; gap:4px;">
                <div style="text-align:left;">
                  <div style="font-size:9px; font-weight:700; color:#111827; line-height:1.1; max-width:80px; word-break:break-word;">${activeName}</div>
                  <div style="font-size:7px; color:#4b5563; margin-top:2px;">${product.category}</div>
                </div>
                <div style="font-size:12px; font-weight:800; color:#000; white-space:nowrap;">R$ ${product.price.toFixed(2)}</div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:center; margin-top:4px;">
                <div style="width:100%; height:26px; overflow:hidden; display:flex; justify-content:center; align-items:center;">
                  ${generateBarcode39SVG(activeCode)}
                </div>
                <span style="font-size:7px; font-family:'JetBrains Mono', monospace; color:#374151; margin-top:2px; letter-spacing:1px;">${activeCode}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    qtyInput.addEventListener('input', updatePreview);
    if (varSelect) varSelect.addEventListener('change', updatePreview);

    updatePreview();

    document.getElementById('btn-close-barcode-modal').addEventListener('click', () => {
      m.remove();
    });

    document.getElementById('btn-print-barcodes-action').addEventListener('click', () => {
      const qty = parseInt(qtyInput.value) || 12;
      const selectedVarId = varSelect ? varSelect.value : 'main';
      
      let activeCode = product.code;
      let activeName = product.name;
      
      if (selectedVarId !== 'main') {
        const v = product.variations.find(va => va.id === selectedVarId);
        if (v) {
          activeCode = `${product.code}-${v.id}`;
          activeName = `${product.name} - ${v.name}`;
        }
      }

      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        showNotification('Erro: O bloqueador de pop-ups impediu a impressão. Por favor, ative os pop-ups para este site.', 'error');
        return;
      }

      const labelsHTML = Array.from({ length: qty }).map(() => `
        <div class="label-card">
          <div class="label-header">
            <div>
              <div class="label-title">${activeName}</div>
              <div class="label-category">${product.category}</div>
            </div>
            <div class="label-price">R$ ${product.price.toFixed(2)}</div>
          </div>
          <div class="label-barcode-container">
            <div class="label-barcode-svg">
              ${generateBarcode39SVG(activeCode)}
            </div>
            <span class="label-code">${activeCode}</span>
          </div>
        </div>
      `).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Etiquetas - Purple Cosmetics</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
            <style>
              body {
                margin: 0;
                padding: 10mm;
                background: white;
                color: black;
                font-family: 'Outfit', sans-serif;
              }
              .print-grid {
                display: grid;
                grid-template-columns: repeat(4, 46mm);
                gap: 4mm;
                justify-content: center;
              }
              .label-card {
                width: 46mm;
                height: 30mm;
                border: 0.2mm solid #a1a1a1;
                border-radius: 1.5mm;
                padding: 2mm;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-sizing: border-box;
                background: white;
                color: black;
                page-break-inside: avoid;
              }
              .label-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1mm;
              }
              .label-title {
                font-size: 8pt;
                font-weight: 700;
                color: black;
                line-height: 1.2;
                max-width: 28mm;
                word-break: break-word;
                text-align: left;
              }
              .label-category {
                font-size: 6pt;
                color: #555;
                margin-top: 1mm;
                text-align: left;
              }
              .label-price {
                font-size: 10pt;
                font-weight: 800;
                color: black;
                white-space: nowrap;
              }
              .label-barcode-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin-top: auto;
              }
              .label-barcode-svg {
                width: 100%;
                height: 8mm;
                overflow: hidden;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .label-code {
                font-size: 6.5pt;
                font-family: 'JetBrains Mono', monospace;
                color: black;
                margin-top: 1mm;
                letter-spacing: 0.8px;
              }
              @media print {
                body {
                  padding: 0;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-grid">
              ${labelsHTML}
            </div>
            <script>
              window.addEventListener('load', () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 250);
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });
  }

  // Excluir
  document.querySelectorAll('.btn-delete-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Tem certeza que deseja excluir este produto?')) {
        deleteProduct(id);
        showNotification('Produto excluído com sucesso!', 'success');
        renderProdutos(container);
      }
    });
  });
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
