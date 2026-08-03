const fs = require('fs');
let code = fs.readFileSync('src/db.js', 'utf8');

// 1. Atualizar fetchAllRows para aceitar columns
code = code.replace(
  /async function fetchAllRows\(tableName, orderBy = 'updated_at'\) \{[\s\S]*?return \{ data: allRows, error: null \};\n\}/,
  sync function fetchAllRows(tableName, orderBy = 'updated_at', columns = '*') {
  if (!supabase) return { data: null, error: 'not_configured' };
  let allRows = [];
  let from = 0;
  const step = 1000;
  let more = true;
  while (more) {
    const { data, error } = await supabase
      .from(tableName)
      .select(columns)
      .order(orderBy, { ascending: true })
      .range(from, from + step - 1);
    
    if (error || !data) {
      return { data: null, error: error || new Error("Failed to fetch paginated data") };
    }
    allRows = allRows.concat(data);
    if (data.length < step) {
      more = false;
    } else {
      from += step;
    }
  }
  return { data: allRows, error: null };
}

async function fetchFullRowsByIds(tableName, ids) {
  if (!supabase) return { data: null, error: 'not_configured' };
  let allRows = [];
  const chunkSize = 100; // Supabase/PostgREST limit for .in() is typically 100-200
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data, error } = await supabase.from(tableName).select('*').in('id', chunk);
    if (error || !data) return { data: null, error: error || new Error("Failed chunk fetch") };
    allRows = allRows.concat(data);
  }
  return { data: allRows, error: null };
}
);

// 2. Criar a lógica do Smart Sync
const smartSyncLogic = 
    // --- SMART SYNC LOGIC PARA ECONOMIA DE BANDA (99% MENOS DADOS) ---
    async function smartSyncTable(tableName, localKey, mapFn, customFilterFn = null) {
      // 1. Busca Apenas os Metadados (IDs e Datas de Atualização)
      let columns = 'id, updated_at';
      if (tableName === 'products') columns += ', code';
      
      const { data: metaData, error: errMeta } = await fetchAllRows(tableName, 'updated_at', columns);
      if (errMeta || !metaData) return false;

      const localData = JSON.parse(localStorage.getItem(localKey)) || [];
      const remoteIds = new Set(metaData.map(r => String(r.id)));
      const remoteCodes = tableName === 'products' ? new Set(metaData.map(p => String(p.code)).filter(Boolean)) : new Set();
      
      // 2. Filtra os itens locais mantendo apenas os que ainda existem no servidor (ou que não foram sincronizados)
      let activeLocalData = localData.filter(ld => !ld.synced || remoteIds.has(String(ld.id)));
      if (tableName === 'products') {
        activeLocalData = localData.filter(lp => !lp.synced || remoteIds.has(String(lp.id)) || (lp.code && remoteCodes.has(String(lp.code))));
      }

      // 3. Descobre quais IDs precisam ser baixados inteiros (Novos ou Modificados)
      const idsToFetch = [];
      for (const meta of metaData) {
        const local = activeLocalData.find(l => String(l.id) === String(meta.id));
        // Se não existe localmente OU se o updated_at mudou OU se o local ainda não rastreava updated_at
        if (!local || local.updated_at !== meta.updated_at) {
          idsToFetch.push(meta.id);
        }
      }

      // 4. Baixa APENAS as linhas que mudaram
      let fetchedFullRows = [];
      if (idsToFetch.length > 0) {
        const { data: freshRows, error: errFresh } = await fetchFullRowsByIds(tableName, idsToFetch);
        if (!errFresh && freshRows) {
          fetchedFullRows = freshRows;
        }
      }

      // 5. Mescla os dados recebidos com os dados locais inalterados
      const merged = [...activeLocalData];
      let hasChanges = false;

      for (const meta of metaData) {
        // Ignora exclusões locais pendentes
        if (tableName === 'products' && typeof deletedProductIds !== 'undefined' && deletedProductIds.includes(meta.id)) continue;

        // Se o item foi baixado agora (foi modificado)
        const fullRow = fetchedFullRows.find(f => String(f.id) === String(meta.id));
        if (fullRow) {
           const mappedObj = mapFn(fullRow);
           mappedObj.updated_at = meta.updated_at; // Salva o timestamp localmente para comparações futuras!
           mappedObj.synced = true;

           let idx = -1;
           if (tableName === 'products') {
              idx = merged.findIndex(lp => lp.id === mappedObj.id || (lp.code && lp.code === mappedObj.code));
           } else {
              idx = merged.findIndex(l => l.id === mappedObj.id);
           }

           if (idx !== -1) {
              if (merged[idx].synced) merged[idx] = { ...merged[idx], ...mappedObj, synced: true };
           } else {
              merged.push(mappedObj);
           }
           hasChanges = true;
        }
      }

      // 6. Limpa e Salva no LocalStorage se houve exclusão ou atualização
      // Se a contagem diminuiu (algo deletado), conta como mudança
      if (merged.length !== localData.length) hasChanges = true;

      const prevVal = localStorage.getItem(localKey);
      const newVal = JSON.stringify(merged);
      if (prevVal !== newVal) {
         localStorage.setItem(localKey, newVal);
         return true; // dataChanged = true
      }
      return false;
    }
;

// Substituir o bloco "2. PULL FRESH TABLES FROM REMOTE AND OVERWRITE LOCAL" por completo.
const regexPull = /\/\/ 2\. PULL FRESH TABLES FROM REMOTE AND OVERWRITE LOCAL[\s\S]*?(?=console\.log\("Supabase: Background synchronization completed successfully)/;

const newPullCode = \// 2. PULL FRESH TABLES FROM REMOTE AND OVERWRITE LOCAL (SMART SYNC - 99% LESS BANDWIDTH)
    let dataChanged = false;
    
    \

    // Fetch Products
    const prodChanged = await smartSyncTable('products', KEY_PRODUCTS, (p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      costPrice: Number(p.cost_price),
      price: Number(p.price),
      stock: Number(p.stock),
      color: p.color,
      image: p.image,
      description: p.description,
      variations: p.variations || []
    }));
    if (prodChanged) dataChanged = true;

    // Fetch Clients
    const clientChanged = await smartSyncTable('clients', KEY_CLIENTS, (c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      password: c.password,
      birthday: c.birthday,
      notes: c.notes,
      cpfCnpj: c.cpf_cnpj,
      zipCode: c.zip_code,
      address: c.address,
      number: c.number,
      neighborhood: c.neighborhood,
      city: c.city,
      state: c.state,
      debt: Number(c.debt)
    }));
    if (clientChanged) dataChanged = true;

    // Fetch Operators
    try {
      const opChanged = await smartSyncTable('operators', 'purple_pdv_operators', (o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        password: o.password,
        role: o.role || 'operator'
      }));
      if (opChanged) dataChanged = true;
    } catch (e) {
      console.warn("Supabase Operators sync failed or table missing:", e);
    }

    // Fetch Sales
    const salesChanged = await smartSyncTable('sales', KEY_SALES, (s) => ({
      id: s.id,
      clientId: s.client_id,
      clientName: s.client_name,
      date: s.date,
      timestamp: s.date,
      items: s.items || [],
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      total: Number(s.total),
      paymentMethod: s.payment_method,
      payments: s.payments,
      status: s.status,
      origin: s.origin
    }));
    if (salesChanged) dataChanged = true;

    // Fetch Cash Sessions
    const cashChanged = await smartSyncTable('cash_sessions', KEY_CASH_SESSIONS, (s) => ({
      id: s.id,
      operator: s.operator,
      openedAt: s.open_time,
      closedAt: s.close_time,
      initialAmount: Number(s.initial_cash),
      actualAmount: Number(s.final_cash),
      status: s.status,
      transactions: s.transactions || []
    }));
    if (cashChanged) dataChanged = true;

    \;

code = code.replace(regexPull, newPullCode);
fs.writeFileSync('src/db.js', code);
