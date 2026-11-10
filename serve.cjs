const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = {'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/catalog-sources.json':'catalog-sources.json','/services.json':'services.json'};
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
files['/atr-bpn.png']='atr-bpn.png';
types['.png']='image/png';
for(const file of ['buku-saku.js','buku-saku.json','buku-saku-revisi-2026.pdf']) files['/'+file]=file;
types['.pdf']='application/pdf';
files['/book-cover.webp']='book-cover.webp';
types['.webp']='image/webp';
files['/bot.js']='bot.js';files['/bot-config.js']='bot-config.js';files['/peri-asn.webp']='peri-asn.webp';
http.createServer((req,res)=>{
  const file = files[new URL(req.url,'http://localhost').pathname];
  if(!file){res.writeHead(404);res.end('Not found');return;}
  fs.readFile(path.join(__dirname,file),(error,bytes)=>{
    if(error){res.writeHead(500);res.end('Unable to read file');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});res.end(bytes);
  });
}).listen(Number(process.env.SIPERI_PREVIEW_PORT || 4173),'127.0.0.1',()=>console.log('SiPERI preview: http://127.0.0.1:'+(process.env.SIPERI_PREVIEW_PORT || 4173)));
