const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname,'public');
fs.mkdirSync(directory,{recursive:true});
for(const file of ['index.html','styles.css','app.js','catalog-sources.json','services.json','atr-bpn.png','buku-saku.js','buku-saku.json','buku-saku-revisi-2026.pdf','book-cover.webp','bot.js','bot-pertanahan.webp','.nojekyll']) fs.copyFileSync(path.join(__dirname,file),path.join(directory,file));
console.log('Static website prepared in public/');
const crypto = require('node:crypto');
const indexPath = path.join(directory,'index.html');
let html = fs.readFileSync(indexPath,'utf8');
for(const file of ['styles.css','app.js','buku-saku.js','bot.js']) {
  const version = crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,file))).digest('hex').slice(0,12);
  html = html.replace(new RegExp('(["\\\'])'+file.replaceAll('.','\\.')+'(?:\\?[^"\\\']*)?(["\\\'])','g'), '$1'+file+'?v='+version+'$2');
}
fs.writeFileSync(indexPath,html);
