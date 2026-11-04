const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname,'public');
fs.mkdirSync(directory,{recursive:true});
for(const file of ['index.html','styles.css','app.js','catalog-sources.json','services.json','atr-bpn.png','.nojekyll']) fs.copyFileSync(path.join(__dirname,file),path.join(directory,file));
console.log('Static website prepared in public/');
