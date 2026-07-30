const fs = require('fs');
let code = fs.readFileSync('src/components/produtos.js', 'utf8');

// 1. Add image thumbnail
code = code.replace(/<div style="display:flex; gap:8px;">\s*<input type="text" class="var-image-input input-sm"/g, 
  '<div style="display:flex; gap:8px; align-items:center;">\n          <img class="var-image-preview" src="" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); flex-shrink:0;">\n          <input type="text" class="var-image-input input-sm"'
);

// 2. Add event listener to input to update thumbnail
code = code.replace(/const urlInput = line\.querySelector\('\.var-image-input'\);/g,
  'const urlInput = line.querySelector(\'.var-image-input\');\n    const previewImg = line.querySelector(\'.var-image-preview\');\n    urlInput.addEventListener(\'input\', () => { previewImg.src = urlInput.value || \'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=150&auto=format&fit=crop&q=60\'; });'
);

// 3. Dispatch input event when file is uploaded via Supabase
code = code.replace(/urlInput\.value = publicUrl;/g,
  'urlInput.value = publicUrl; urlInput.dispatchEvent(new Event(\'input\'));'
);

// 4. Dispatch input event when file is read as DataURL (fallback)
code = code.replace(/urlInput\.value = evt\.target\.result;/g,
  'urlInput.value = evt.target.result; urlInput.dispatchEvent(new Event(\'input\'));'
);

fs.writeFileSync('src/components/produtos.js', code);
