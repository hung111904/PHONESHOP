(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const parse = s => { if(!s) return null; const n=String(s).replace(/\D/g,''); return n?+n:null; };

  const readFromPhoneItem = el => {
    const name = (el.querySelector('.phone-name')||{}).textContent||'';
    const brand = el.dataset.brand || '';
    const price = el.dataset.price ? +el.dataset.price : parse((el.querySelector('.phone-price')||{}).textContent);
    return { el, name: (name||'').toLowerCase(), brand: (brand||'').toLowerCase(), price };
  };

  const readFromCartItem = el => {
    // cart-item should expose data-name and data-price; fallback to text nodes
    const name = el.getAttribute('data-name') || (el.querySelector('.title') && el.querySelector('.title').textContent) || '';
    const brand = el.getAttribute('data-brand') || '';
    const priceAttr = el.getAttribute('data-price') || (el.querySelector('.price') && el.querySelector('.price').textContent) || '';
    const price = Number(String(priceAttr).replace(/\D/g,'')) || null;
    return { el, name: (name||'').toLowerCase(), brand: (brand||'').toLowerCase(), price };
  };

  const match = (q,p) => {
    if(!q) return true;
    q=q.trim().toLowerCase();
    // price queries: >10000000, <20000000, 10000000-20000000, exact number
    const pr = q.match(/^(?:([<>])\s*)?([\d\.]+)(?:\s*-\s*([\d\.]+))?$/);
    if(pr){
      const op = pr[1] || null;
      const a = +String(pr[2]).replace(/\./g,'');
      const b = pr[3] ? +String(pr[3]).replace(/\./g,'') : null;
      if(op === '>') return p.price && p.price > a;
      if(op === '<') return p.price && p.price < a;
      if(b !== null) return p.price && p.price >= Math.min(a,b) && p.price <= Math.max(a,b);
      return p.price && p.price === a;
    }
    // text search: match all tokens in name+brand
    const hay = (p.name + ' ' + (p.brand||'')).toLowerCase();
    return q.split(/\s+/).filter(Boolean).every(token => hay.includes(token));
  };

  const ensureStatus = () => {
    let s = document.getElementById('searchStatusLive');
    if(s) return s;
    s = document.createElement('div'); s.id='searchStatusLive';
    s.style.cssText = 'text-align:center;margin:12px auto;padding:8px;display:none;font-weight:600;max-width:1100px';
    const ref = document.querySelector('main') || document.body;
    ref.insertBefore(s, ref.firstChild);
    return s;
  };

  document.addEventListener('DOMContentLoaded', ()=>{
    const input = document.getElementById('searchInput') || document.querySelector('.search-box');
    if(!input) return;
    const status = ensureStatus();
    const slide = document.querySelector('.slideshow-container');

    let t;

    const update = () => {
      const q = (input.value||'').trim();
      // phone items on index
      const phoneItems = $$('.phone-item');
      let found = 0;

      if(phoneItems.length){
        phoneItems.forEach(el => {
          const p = readFromPhoneItem(el);
          const ok = match(q,p);
          el.style.display = ok ? '' : 'none';
          if(ok) found++;
        });
      }

      // cart items on cart page
      const cartItems = $$('.cart-item');
      if(cartItems.length){
        cartItems.forEach(el => {
          const p = readFromCartItem(el);
          const ok = match(q,p);
          el.style.display = ok ? '' : 'none';
          if(ok) found++;
        });
      }

      // UI feedback
      const anyListPresent = phoneItems.length || cartItems.length;
      if(!q){
        status.style.display = 'none';
        if(slide) slide.style.display = '';
        // show all sections (index)
        $$('.phone-section').forEach(s=>s.style.display = '');
      } else if(found === 0){
        status.textContent = 'Không tìm thấy sản phẩm phù hợp.'; status.style.color = '#ef4444'; status.style.display = '';
        if(slide) slide.style.display = 'none';
        $$('.phone-section').forEach(s=>s.style.display = 'none');
      } else {
        status.textContent = `Tìm thấy ${found} sản phẩm phù hợp.`; status.style.color = ''; status.style.display = '';
        if(slide) slide.style.display = '';
        $$('.phone-section').forEach(s=>s.style.display = '');
        // scroll to first visible list container if on index
        const gallery = document.querySelector('.phone-gallery') || document.getElementById('cart-items');
        if(gallery) gallery.scrollIntoView({behavior:'smooth',block:'start'});
      }
    };

    input.addEventListener('input', ()=>{ clearTimeout(t); t = setTimeout(update, 120); });

    const form = input.closest('form') || document.getElementById('searchForm');
    if(form) form.addEventListener('submit', e => {
      e.preventDefault();
      const q=(input.value||'').trim();
      // preserve existing behavior: redirect to timkiem.html when submitting from header
      location.href = 'timkiem.html' + (q?('?q='+encodeURIComponent(q)):'' );
    });
  });
})();
