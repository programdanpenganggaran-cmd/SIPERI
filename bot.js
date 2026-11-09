'use strict';
(() => {
  const API = window.SIPERI_BOT_CONFIG?.apiUrl || '';
  const $ = id => document.getElementById(id);
  const dialog = $('bot-dialog');
  let mode = 'catalog';
  let pending = false;
  let controller = null;
  const history = [];
  if(window.visualViewport) {
    const fit = () => dialog.style.setProperty('--bot-viewport-height',window.visualViewport.height+'px');
    window.visualViewport.addEventListener('resize',fit);fit();
  }
  const normalize = text => text.toLocaleLowerCase('id').replace(/[^a-z0-9]+/g,' ').trim();
  function line(text, kind='assistant') {
    const item = document.createElement('div');item.className='bot-message bot-message-'+kind;
    const label=document.createElement('strong');label.textContent=kind==='user'?'Kamu':kind==='error'?'Perlu diperiksa':'Asisten SiPERI';
    const body=document.createElement('p');body.textContent=text;item.append(label,body);$('bot-messages').append(item);
    while($('bot-messages').children.length>12) $('bot-messages').firstElementChild.remove();
    item.scrollIntoView({block:'nearest'});
    return item;
  }
  function sourceLink(source, parent) {
    let url;try {url=new URL(source.url,location.href);}catch{return;}
    if(!['https:','http:'].includes(url.protocol)) return;
    const link=document.createElement('a');link.href=url.href;link.textContent=source.title+(source.page?' · hal. '+source.page:'');parent.append(link);
  }
  function searchCatalog(question) {
    const stop=new Set(['apa','apakah','bagaimana','yang','untuk','dengan','dan','di','ke','dari','saya','cari','tolong','dokumen']);
    const terms=normalize(question).split(' ').filter(t=>t&&!stop.has(t));
    const items=window.siperiCatalog||[];
    if(!items.length){$('bot-status').textContent='Katalog belum dimuat. Tunggu sebentar lalu coba lagi.';return;}
    if(!terms.length){line('Gunakan kata seperti revisi, SBK, TOR, nama unit, atau tahun dokumen.');return;}
    const results=items.map(item=>({item,score:terms.filter(t=>normalize(item.title+' '+(item.year||'')+' '+item.stage).includes(t)).length})).filter(x=>x.score===terms.length).slice(0,8);
    const message=line(results.length?'Berikut tautan yang sesuai. Periksa tahun dan isi sumber sebelum digunakan.':'Belum ada judul yang cocok. Coba kata lebih singkat, atau jelajahi Pusat Pengetahuan. Pencarian ini belum membaca seluruh isi PDF.');
    for(const {item} of results) sourceLink({title:item.title+' · '+(item.year||'periode belum dikonfirmasi'),url:item.url},message);
    $('bot-status').textContent=results.length?`${results.length} rujukan ditampilkan, maksimal 8 hasil.`:'Tidak ada hasil yang cocok.';
  }
  function setPending(value) {
    pending=value;$('bot-send').disabled=value;$('bot-question').disabled=value;
    document.querySelectorAll('input[name="bot-mode"]').forEach(input=>input.disabled=value||(input.value==='ai'&&!API));
  }
  async function askAI(question) {
    if(!API){$('bot-status').textContent='AI belum diaktifkan. Gunakan Cari rujukan untuk menelusuri dokumen.';return;}
    if(/\b\d{16}\b/.test(question)){line('Hapus nomor identitas 16 digit dari pertanyaan sebelum mengirim.','error');return;}
    const code=$('bot-code').value.trim();
    try {if(code) sessionStorage.setItem('siperi-faq-code',code);else sessionStorage.removeItem('siperi-faq-code');}catch{}
    controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),28000);
    setPending(true);$('bot-status').textContent='Meminta jawaban ke FAQ AI...';
    try {
      const response=await fetch(API,{method:'POST',headers:{'content-type':'application/json',...(code?{'x-demo-access-code':code}:{})},body:JSON.stringify({question,history:history.slice(-8),learn_opt_in:false}),signal:controller.signal});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) {
        if(response.status===401&&!/Gemini/i.test(data.error||'')) {
          $('bot-access').open=true;
          throw Error('Kode akses AI belum diisi atau tidak sesuai. Masukkan kode dari pengelola, lalu kirim ulang. Pencarian rujukan tetap bisa digunakan.');
        }
        if(data.code==='GEMINI_AUTH_FAILED'||/Gemini.*(?:401|403)/i.test(data.error||'')) throw Error('Server FAQ belum dapat mengakses Gemini. Pengelola perlu memeriksa API key dan izin model di Netlify. Ini bukan kesalahan pertanyaanmu.');
        if(response.status===429)throw Error('Batas penggunaan AI sedang tercapai. Coba lagi nanti atau gunakan Cari rujukan.');
        throw Error(data.error||'Layanan AI belum dapat menjawab. Coba lagi nanti.');
      }
      if(typeof data.reply!=='string'||!data.reply.trim())throw Error('Server belum memberikan jawaban teks.');
      const item=line(data.reply);
      if(Array.isArray(data.sources))for(const source of data.sources.slice(0,6)) sourceLink(source,item);
      if(data.warning){const warning=document.createElement('small');warning.textContent=data.warning;item.append(warning);}
      history.push({role:'user',text:question},{role:'model',text:data.reply});
      $('bot-status').textContent=data.grounded?'Jawaban AI diterima dengan rujukan. Periksa sumbernya.':'Jawaban AI diterima; belum didukung rujukan yang cocok.';
    }catch(error){
      if(error.name==='AbortError') {$('bot-status').textContent='Permintaan dihentikan atau melewati waktu tunggu.';if(dialog.open)line('Jawaban belum diterima. Coba lagi atau gunakan Cari rujukan.','error');}
      else {line(error.message||'Koneksi gagal. Coba lagi.','error');$('bot-status').textContent='AI belum berhasil menjawab. Pencarian rujukan tetap tersedia.';}
    }finally{clearTimeout(timeout);controller=null;setPending(false);}
  }
  function openBot() {
    dialog.showModal();$('bot-launcher').setAttribute('aria-expanded','true');$('bot-question').focus();
  }
  $('bot-launcher').addEventListener('click',openBot);
  $('bot-open-from-library').addEventListener('click',openBot);
  $('bot-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{controller?.abort();$('bot-launcher').setAttribute('aria-expanded','false');$('bot-launcher').focus();});
  $('bot-library').addEventListener('click',()=>dialog.close());
  document.querySelectorAll('input[name="bot-mode"]').forEach(input=>input.addEventListener('change',()=>{
    mode=input.value;$('bot-access').hidden=mode!=='ai';$('bot-send').textContent=mode==='ai'?'Kirim':'Cari';
    $('bot-status').textContent=mode==='ai'?'AI uji coba memerlukan kode akses. Pertanyaan dikirim ke layanan FAQ PP.':'Pencarian rujukan siap digunakan.';
  }));
  $('bot-form').addEventListener('submit',async event=>{
    event.preventDefault();const question=$('bot-question').value.trim();if(!question||pending)return;
    if(question.length>1500){$('bot-status').textContent='Maksimal 1.500 karakter.';return;}
    line(question,'user');if(mode==='ai')await askAI(question);else searchCatalog(question);
  });
  try {$('bot-code').value=sessionStorage.getItem('siperi-faq-code')||'';}catch{}
  setPending(false);
})();
