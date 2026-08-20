const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://vhjnvewzyfaohmdqdxzj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoam52ZXd6eWZhb2htZHFkeHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzQxODcsImV4cCI6MjEwMjE1MDE4N30.i_xMrg-4OcytJTp0Frqvp9nago0mtWCaiXAo23kDs2E');

async function run() {
  console.log('1. Buscando produtos...');
  let existingProducts = [];
  let from = 0;
  let hasMore = true;
  while(hasMore) {
    const { data, error } = await supabase.from('products').select('*').range(from, from + 999);
    if (error) { console.error(error); return; }
    existingProducts = existingProducts.concat(data);
    if (data.length < 1000) hasMore = false;
    from += 1000;
  }
  
  const existingIds = new Set(existingProducts.map(p => String(p.id)));
  const existingCodes = new Set(existingProducts.filter(p => p.code).map(p => String(p.code)));
  console.log('-> ' + existingProducts.length + ' encontrados.');
  
  const rawData = fs.readFileSync('produtos_resgate_urgente.json', 'utf8');
  const rescuedProducts = JSON.parse(rawData);
  console.log('-> ' + rescuedProducts.length + ' lidos do arquivo.');
  
  const toInsert = [];
  for (const p of rescuedProducts) {
    const idStr = String(p.id);
    const codeStr = p.code ? String(p.code) : null;
    if (existingIds.has(idStr)) continue;
    if (codeStr && existingCodes.has(codeStr)) continue;
    
    toInsert.push({
      id: idStr, code: p.code || '', name: p.name || 'Produto sem nome',
      category: p.category || 'Geral', cost_price: Number(p.costPrice) || 0,
      price: Number(p.price) || 0, stock: Number(p.stock) || 0,
      color: p.color || '', image: p.image || '', description: p.description || '',
      variations: p.variations || [], updated_at: new Date().toISOString()
    });
  }
  
  console.log('3. Inserindo ' + toInsert.length + '...');
  let successCount = 0;
  for (let i = 0; i < toInsert.length; i += 200) {
    const chunk = toInsert.slice(i, i + 200);
    const { error } = await supabase.from('products').upsert(chunk);
    if (error) console.error(error);
    else {
      successCount += chunk.length;
      console.log('-> ' + successCount + '/' + toInsert.length);
    }
  }
  console.log('CONCLUIDO');
}
run();
