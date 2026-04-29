
(function(){
  // keys
  window.PHONE_SHOP = window.PHONE_SHOP || {};
  const CART_KEY = window.PHONE_SHOP.CART_KEY || 'phoneShop_cart';
  const CART_SYNC_KEY = window.PHONE_SHOP.CART_SYNC_KEY || 'phoneShop_cart_sync';

  const POLL_INTERVAL = 300;
  const POLL_TIMEOUT = 5000;

  const log = (...a)=>{ try{ console.log.apply(console,a); }catch(e){} };
  const safeParse = s => { try{ return JSON.parse(s)||[] }catch(e){ return [] } };
  const getCart = ()=> safeParse(localStorage.getItem(CART_KEY));
  const saveCart = cart => {
    try{
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      try{ localStorage.setItem(CART_SYNC_KEY, String(Date.now())); }catch(e){}
    }catch(e){}
    updateHeaderCount();
  };

  const esc = s => s==null? '': String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const formatVND = n => {
    n = Number(n)||0;
    try{ return new Intl.NumberFormat('vi-VN').format(n) + ' VND'; }catch(e){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.') + ' VND'; }
  };

  // ensure containers
  (function ensure(){
    if(!document.getElementById('cart-items')){
      const main = document.querySelector('main') || document.body;
      const sec = document.createElement('section');
      sec.id = 'cart-page';
      sec.innerHTML = '<h1>Giỏ Hàng</h1><div id="cart-items"></div><div class="cart-footer">Tổng: <span id="cart-total">0 VND</span> <button id="checkout-btn">Thanh toán</button></div>';
      main.insertBefore(sec, main.firstChild);
    } else if(!document.getElementById('cart-total')){
      const footer = document.createElement('div');
      footer.className = 'cart-footer';
      footer.innerHTML = 'Tổng: <span id="cart-total">0 VND</span> <button id="checkout-btn">Thanh toán</button>';
      document.getElementById('cart-items').after(footer);
    }
  })();

  function updateHeaderCount(){
    const el = document.getElementById('headerCartCount'); if(!el) return;
    const total = getCart().reduce((s,i)=> s + (Number(i.quantity||i.qty||i.count)||0), 0);
    el.textContent = total;
  }

  // render cart as .cart-item with data-name and data-price
  function renderCart(){
    const container = document.getElementById('cart-items'); if(!container) return;
    const cart = getCart();
    container.innerHTML = '';
    if(!cart.length){
      container.innerHTML = '<p id="cart-empty-msg" class="empty" style="color:#666;padding:12px;text-align:center">Giỏ hàng trống. Vui lòng thêm sản phẩm từ trang chủ.</p>';
      updateTotals();
      showManualReload(true);
      return;
    }
    showManualReload(false);

    const list = document.createElement('div'); list.className = 'cart-list';
    cart.forEach(item=>{
      const id = esc(item.id||item.sku||item.code||'');
      const name = esc(item.name||item.title||'Sản phẩm');
      const price = Number(item.price||0);
      const qty = Number(item.quantity||item.qty||item.count)||1;
      const img = esc(item.image||item.img||item.picture||'images/no-image.png');
      const subtotal = price * qty;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.setAttribute('data-id', id);
      row.setAttribute('data-name', name);
      row.setAttribute('data-price', String(price));
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '12px';
      row.style.marginBottom = '12px';
      row.style.padding = '8px 0';
      row.innerHTML = `
        <div style="width:84px"><img src="${img}" alt="${name}" style="width:84px;height:84px;object-fit:cover;border-radius:8px"></div>
        <div style="flex:1">
          <div style="font-weight:600">${name}</div>
          <div style="color:#666;margin-top:6px">${formatVND(price)}</div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
            <button class="qty-decrease" data-id="${id}" aria-label="Giảm">−</button>
            <input class="qty-input" data-id="${id}" value="${qty}" type="number" min="1" style="width:56px;text-align:center" />
            <button class="qty-increase" data-id="${id}" aria-label="Tăng">+</button>
            <button class="remove-item" data-id="${id}" style="margin-left:8px;background:#ef4444;color:#fff;border:none;padding:6px 8px;border-radius:6px;cursor:pointer">Xóa</button>
          </div>
        </div>
        <div style="min-width:120px;text-align:right">${formatVND(subtotal)}</div>
      `;
      list.appendChild(row);
    });
    container.appendChild(list);
    attachHandlers();
    updateTotals();
  }

  function attachHandlers(){
    document.querySelectorAll('.qty-decrease').forEach(b=>{ if(b.__a) return; b.__a=1; b.addEventListener('click', ()=>changeQty(b.dataset.id,-1)); });
    document.querySelectorAll('.qty-increase').forEach(b=>{ if(b.__a) return; b.__a=1; b.addEventListener('click', ()=>changeQty(b.dataset.id,1)); });
    document.querySelectorAll('.qty-input').forEach(inp=>{ if(inp.__a) return; inp.__a=1; inp.addEventListener('change', ()=>setQty(inp.dataset.id, parseInt(inp.value,10)||1)); inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); setQty(inp.dataset.id, parseInt(inp.value,10)||1); } }); });
    document.querySelectorAll('.remove-item').forEach(b=>{ if(b.__a) return; b.__a=1; b.addEventListener('click', ()=>removeItem(b.dataset.id)); });
  }

  function changeQty(id, delta){
    const cart = getCart(); const idx = cart.findIndex(i=>String(i.id)===String(id)); if(idx===-1) return;
    const cur = Number(cart[idx].quantity||cart[idx].qty||cart[idx].count)||1;
    cart[idx].quantity = Math.max(1, cur + delta);
    saveCart(cart); renderCart();
  }
  function setQty(id, qty){
    const cart = getCart(); const idx = cart.findIndex(i=>String(i.id)===String(id)); if(idx===-1) return;
    cart[idx].quantity = Math.max(1, Math.floor(qty));
    saveCart(cart); renderCart();
  }
  function removeItem(id){
    let cart = getCart(); cart = cart.filter(i=>String(i.id)!==String(id)); saveCart(cart); renderCart();
  }

  function updateTotals(){
    const totalEl = document.getElementById('cart-total');
    const total = getCart().reduce((s,i)=> s + ((Number(i.price)||0) * (Number(i.quantity||i.qty||i.count)||0)), 0);
    if(totalEl) totalEl.textContent = formatVND(total);
    updateHeaderCount();
  }

  // manual reload button
  function showManualReload(show){
    let btn = document.getElementById('manualReloadCartBtn');
    if(show){
      if(!btn){
        btn = document.createElement('button');
        btn.id = 'manualReloadCartBtn';
        btn.textContent = 'Tải giỏ hàng';
        Object.assign(btn.style,{position:'fixed',right:'16px',bottom:'16px',zIndex:99998,padding:'8px 10px',background:'#0b74de',color:'#fff',border:'none',borderRadius:'6px',boxShadow:'0 6px 18px rgba(0,0,0,0.12)'});
        document.body.appendChild(btn);
        btn.addEventListener('click', attemptLoadCartOnce);
      }
      btn.style.display = 'block';
    } else if(btn) btn.style.display = 'none';
  }

  // polling loader
  function attemptLoadCartWithPolling(onSuccess,onFail){
    const start = Date.now();
    (function tryOnce(){
      const cart = getCart();
      if(cart && cart.length){ onSuccess && onSuccess(cart); return; }
      if(Date.now() - start >= POLL_TIMEOUT){ onFail && onFail(); return; }
      setTimeout(tryOnce, POLL_INTERVAL);
    })();
  }
  function attemptLoadCartOnce(){ const cart = getCart(); if(cart && cart.length) renderCart(); else attemptLoadCartWithPolling(()=>renderCart(), ()=>{}); }

  // init
  function init(){
    attemptLoadCartWithPolling(()=>renderCart(), ()=>renderCart());
    window.addEventListener('storage', e=>{
      if(!e) return;
      if(e.key === CART_KEY || e.key === CART_SYNC_KEY) try{ renderCart(); }catch(e){}
      if(e.key && e.key.indexOf('cart') !== -1) updateHeaderCount();
    });
    const checkoutBtn = document.getElementById('checkout-btn');
    if(checkoutBtn) checkoutBtn.addEventListener('click', ()=>{ const cart = getCart(); if(!cart.length){ alert('Giỏ hàng trống.'); return; } alert('Demo thanh toán. Sản phẩm: ' + cart.length); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
