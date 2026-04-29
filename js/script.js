// js/script.js — integrated, slideshow + cart & auth helpers
(function(){
  // Namespace and keys
  window.PHONE_SHOP = window.PHONE_SHOP || {};
  const KEYS = {
    CART: window.PHONE_SHOP.CART_KEY || 'phoneShop_cart',
    CART_SYNC: window.PHONE_SHOP.CART_SYNC_KEY || 'phoneShop_cart_sync',
    LOGIN_FLAG: window.PHONE_SHOP.LOGIN_FLAG_KEY || 'phoneShop_isLoggedIn',
    USER: window.PHONE_SHOP.USER_KEY || 'phoneShop_user'
  };
  window.PHONE_SHOP.CART_KEY = KEYS.CART;
  window.PHONE_SHOP.CART_SYNC_KEY = KEYS.CART_SYNC;
  window.PHONE_SHOP.LOGIN_FLAG_KEY = KEYS.LOGIN_FLAG;
  window.PHONE_SHOP.USER_KEY = KEYS.USER;

  // Small helpers
  const safeParse = s => { try { return JSON.parse(s) || []; } catch (e) { return []; } };
  const readCart = () => safeParse(localStorage.getItem(KEYS.CART));
  const writeCart = cart => {
    try {
      localStorage.setItem(KEYS.CART, JSON.stringify(cart));
      try { localStorage.setItem(KEYS.CART_SYNC, String(Date.now())); } catch (e) {}
    } catch (e) {}
    updateHeader();
  };
  const qs = sel => document.getElementById(sel) || document.querySelector(sel);
  const num = v => Number(v) || 0;

  // Header cart count
  function updateHeader(){
    try {
      const el = document.getElementById('headerCartCount');
      if(!el) return;
      const count = readCart().reduce((s,i) => s + (num(i.quantity || i.qty || i.count)), 0);
      el.textContent = count;
    } catch (e) {}
  }

  // Normalize product object
  function normalizeProductObject(p){
    if(!p) return null;
    const id = String(p.id || p.code || p.sku || Date.now());
    const name = (p.name || p.title || '').trim();
    const price = num(p.price || p.priceRaw || 0);
    const image = p.image || p.img || p.picture || '';
    const quantity = Math.max(1, Math.floor(num(p.qty || p.quantity || p.count || 1)));
    return { id, name, price, image, quantity };
  }

  // Add to cart (merge)
  function addToCartObj(p){
    const n = normalizeProductObject(p);
    if(!n || !n.id) return;
    const cart = readCart();
    const idx = cart.findIndex(x => String(x.id) === String(n.id));
    if(idx > -1){
      cart[idx].quantity = (num(cart[idx].quantity) || 0) + n.quantity;
    } else {
      cart.push({ id: n.id, name: n.name, price: n.price, image: n.image, quantity: n.quantity });
    }
    writeCart(cart);
    if(typeof window.showToast === 'function') window.showToast('Đã thêm: ' + (n.name || n.id));
  }

  // Read product info from .phone-item element
  function normalizeFromElement(el){
    if(!el) return null;
    const id = el.dataset.id || el.getAttribute('data-id') || Date.now();
    const name = el.dataset.name || el.querySelector('.phone-name')?.textContent?.trim() || '';
    const priceAttr = el.dataset.price || el.getAttribute('data-price') || (el.querySelector('.phone-price')?.textContent || '');
    const price = Number(String(priceAttr).replace(/\D/g,'')) || 0;
    const img = el.dataset.img || el.getAttribute('data-img') || el.querySelector('img')?.src || '';
    return { id, name, price, image: img, qty: 1 };
  }

  // Public API
  window.addToCart = function(product){
    try {
      const p = product instanceof Element ? normalizeFromElement(product) : product;
      addToCartObj(p);
    } catch (e) { console.error('addToCart error', e); }
  };

  // Event delegation for add buttons
  document.addEventListener('click', function(e){
    const btn = e.target.closest && (e.target.closest('.add-small-btn') || e.target.closest('.add-to-cart'));
    if(!btn) return;
    const item = btn.closest && btn.closest('.phone-item');
    let product = item ? normalizeFromElement(item) : null;
    if(!product && btn.dataset && (btn.dataset.id || btn.dataset.name)){
      product = { id: btn.dataset.id, name: btn.dataset.name, price: num(btn.dataset.price), image: btn.dataset.img || '' };
    }
    addToCartObj(product);
    const h = document.getElementById('headerCartCount');
    if(h){ h.style.transition = 'transform .12s'; h.style.transform = 'scale(1.12)'; setTimeout(()=>{ h.style.transform = ''; }, 120); }
  });

  // Toast helper
  (function(){
    function createContainer(){
      if(document.getElementById('ps-toast-container')) return;
      const c = document.createElement('div');
      c.id = 'ps-toast-container';
      Object.assign(c.style, { position:'fixed', right:'16px', top:'16px', zIndex:99999, display:'flex', flexDirection:'column', gap:'8px' });
      document.body.appendChild(c);
    }
    function showToast(message, opts){
      createContainer();
      const container = document.getElementById('ps-toast-container');
      const toast = document.createElement('div');
      toast.className = 'ps-toast';
      toast.textContent = message;
      Object.assign(toast.style, {
        background: (opts && opts.bg) || 'rgba(0,0,0,0.85)',
        color: (opts && opts.color) || '#fff',
        padding: '10px 14px',
        borderRadius: '8px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
        fontSize: '14px',
        opacity: '0',
        transform: 'translateY(-6px)',
        transition: 'opacity .18s ease, transform .18s ease'
      });
      container.appendChild(toast);
      requestAnimationFrame(()=>{ toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
      const duration = (opts && opts.duration) || 1400;
      setTimeout(()=>{
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        setTimeout(()=>{ try{ container.removeChild(toast); }catch(e){} }, 200);
      }, duration);
    }
    window.showToast = showToast;
  })();

  // Auth UI helpers
  function parseUser(){ try{ const raw = localStorage.getItem(KEYS.USER); return raw ? JSON.parse(raw) : null; }catch(e){ return null; } }
  function isLoggedIn(){ try{ const v = localStorage.getItem(KEYS.LOGIN_FLAG); if(!v) return false; const s = String(v).trim().toLowerCase(); return s === '1' || s === 'true' || s === 'yes'; }catch(e){ return false; } }

  function showUserUI(user){
    const loginLink = qs('#loginLink') || qs('[href="login.html"]');
    const registerLink = qs('#registerLink') || qs('[href="register.html"]');
    const avatar = qs('#userAvatar') || qs('.avatar-container');
    const avatarImg = avatar ? (avatar.querySelector('img') || qs('#userAvatarImg')) : null;
    if(loginLink) loginLink.style.display = 'none';
    if(registerLink) registerLink.style.display = 'none';
    if(avatar){
      avatar.style.display = '';
      avatar.setAttribute('aria-hidden','false');
      if(avatarImg && user && user.avatar) avatarImg.src = user.avatar;
      if(user && (user.name || user.email)) avatar.title = user.name || user.email;
    }
    attachLogout();
  }

  function showGuestUI(){
    const loginLink = qs('#loginLink') || qs('[href="login.html"]');
    const registerLink = qs('#registerLink') || qs('[href="register.html"]');
    const avatar = qs('#userAvatar') || qs('.avatar-container');
    const avatarImg = avatar ? (avatar.querySelector('img') || qs('#userAvatarImg')) : null;
    if(loginLink) loginLink.style.display = '';
    if(registerLink) registerLink.style.display = '';
    if(avatar){
      avatar.style.display = 'none';
      avatar.setAttribute('aria-hidden','true');
      if(avatarImg) avatarImg.src = 'images/avatar.png';
      avatar.title = '';
      avatar.classList && avatar.classList.remove('open');
    }
  }

  function attachLogout(){
    const logoutBtn = qs('#logoutBtn') || document.querySelector('.logout-menu a[href*="logout"]') || document.querySelector('.logout-menu a');
    if(!logoutBtn || logoutBtn.__logoutAttached) return;
    logoutBtn.__logoutAttached = true;
    logoutBtn.addEventListener('click', function(ev){
      ev.preventDefault();
      try{ localStorage.removeItem(KEYS.LOGIN_FLAG); localStorage.removeItem(KEYS.USER); }catch(e){}
      showGuestUI();
      updateHeader();
      window.location.href = 'index.html';
    });
  }

  // Avatar menu (keyboard accessible)
  (function initAvatarMenu(){
    function init(){
      const avatarContainer = qs('#userAvatar') || qs('.avatar-container');
      if(!avatarContainer) return;
      const avatarImg = avatarContainer.querySelector('img') || avatarContainer.querySelector('.avatar-img');
      const menu = avatarContainer.querySelector('.logout-menu') || qs('#avatarMenu');
      if(avatarImg){
        avatarImg.tabIndex = avatarImg.tabIndex || 0;
        avatarImg.setAttribute('role','button');
        avatarImg.setAttribute('aria-haspopup','true');
        avatarImg.setAttribute('aria-expanded', String(avatarContainer.classList.contains('open')));
      }
      if(menu) menu.setAttribute('aria-hidden', String(!avatarContainer.classList.contains('open')));
      function openMenu(){ avatarContainer.classList.add('open'); if(avatarImg) avatarImg.setAttribute('aria-expanded','true'); if(menu) menu.setAttribute('aria-hidden','false'); }
      function closeMenu(){ avatarContainer.classList.remove('open'); if(avatarImg) avatarImg.setAttribute('aria-expanded','false'); if(menu) menu.setAttribute('aria-hidden','true'); }
      function toggleMenu(){ avatarContainer.classList.contains('open') ? closeMenu() : openMenu(); }
      avatarImg && avatarImg.addEventListener('click', e=>{ e.stopPropagation(); toggleMenu(); });
      avatarImg && avatarImg.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggleMenu(); } else if(e.key==='Escape'){ closeMenu(); } });
      menu && menu.addEventListener('click', e=> e.stopPropagation());
      document.addEventListener('click', e=> { if(!avatarContainer.contains(e.target)) closeMenu(); });
      document.addEventListener('keydown', e=> { if(e.key === 'Escape') closeMenu(); });
      const logoutBtn = menu ? (menu.querySelector('#logoutBtn') || menu.querySelector('a')) : null;
      if(logoutBtn) logoutBtn.addEventListener('click', function(ev){ ev.preventDefault(); try{ localStorage.removeItem(KEYS.LOGIN_FLAG); localStorage.removeItem(KEYS.USER); }catch(err){} showGuestUI(); updateHeader(); avatarContainer.classList.remove('open'); window.location.href = 'index.html'; });
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  })();

  // Demo helper to set a demo user
  window.__phoneShop_setDemoUser = function(userObj){
    try{
      localStorage.setItem(KEYS.LOGIN_FLAG, '1');
      localStorage.setItem(KEYS.USER, JSON.stringify(userObj || { name: 'Người dùng', email: '', avatar: 'images/avatar.png' }));
      window.location.reload();
    }catch(e){ console.error(e); }
  };

  // Slideshow class-based + click-on-active -> scroll to product
  (function(){
    try{
      const container = document.querySelector('.slideshow-container');
      if(!container) return;
      const slides = Array.from(container.querySelectorAll('.slide'));
      if(!slides.length) return;

      // SCROLL_OFFSET: set to header height if you have fixed header
      const SCROLL_OFFSET = 0;

      // ensure one active slide (prefer existing .active)
      let current = slides.findIndex(s => s.classList.contains('active'));
      if(current < 0) current = 0;
      slides.forEach((s,i)=> s.classList.toggle('active', i === current));

      const intervalMs = 3500; // rotate interval
      let timer = null;
      let paused = false;

      function show(index){
        index = (index + slides.length) % slides.length;
        slides.forEach((s,i)=> s.classList.toggle('active', i === index));
        current = index;
      }
      function next(){ show(current + 1); }
      function prev(){ show(current - 1); }

      function start(){ stop(); timer = setInterval(()=>{ if(!paused) next(); }, intervalMs); }
      function stop(){ if(timer){ clearInterval(timer); timer = null; } }

      const btnPrev = container.querySelector('.prev');
      const btnNext = container.querySelector('.next');
      if(btnPrev) btnPrev.addEventListener('click', e=>{ e.preventDefault(); prev(); start(); });
      if(btnNext) btnNext.addEventListener('click', e=>{ e.preventDefault(); next(); start(); });

      container.addEventListener('mouseenter', ()=>{ paused = true; });
      container.addEventListener('mouseleave', ()=>{ paused = false; });
      container.addEventListener('focusin', ()=>{ paused = true; });
      container.addEventListener('focusout', ()=>{ paused = false; });

      container.addEventListener('keydown', function(e){
        if(e.key === 'ArrowLeft'){ e.preventDefault(); prev(); start(); }
        else if(e.key === 'ArrowRight'){ e.preventDefault(); next(); start(); }
      });

      // helper: extract filename
      const fileNameFromUrl = url => String(url||'').split('/').pop().split('?')[0].toLowerCase();

      // click on active slide -> scroll to product
      container.addEventListener('click', function(ev){
        const a = ev.target.closest('a');
        const img = ev.target.closest('img');
        if(!img && !a) return;
        const slide = (img && img.closest('.slide')) || (a && a.closest('.slide'));
        if(!slide) return;
        if(!slide.classList.contains('active')) return; // allow default for non-active slides
        ev.preventDefault();

        // 1) If slide has data-target, prefer that (target can be id or data-id)
        const targetKey = slide.getAttribute('data-target') || slide.dataset.target;
        let productEl = null;
        if(targetKey){
          // try [data-id="..."] then #id
          productEl = document.querySelector(`[data-id="${targetKey}"]`) || document.getElementById(targetKey) || document.querySelector(`.${targetKey}`);
        }

        // 2) If not found, match by image filename
        if(!productEl){
          const imgEl = slide.querySelector('img');
          const imgUrl = imgEl ? imgEl.src : (a ? a.href : null);
          const targetName = fileNameFromUrl(imgUrl);
          if(targetName){
            const items = Array.from(document.querySelectorAll('.phone-item'));
            for(const it of items){
              const di = (it.getAttribute('data-img') || '').toLowerCase();
              if(di && fileNameFromUrl(di) === targetName){ productEl = it; break; }
              const pimg = it.querySelector('img');
              if(pimg && fileNameFromUrl(pimg.src) === targetName){ productEl = it; break; }
            }
          }
        }

        // 3) If found, scroll into view with offset and highlight
        if(productEl){
          const top = productEl.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
          window.scrollTo({ top, behavior: 'smooth' });
          const prevBox = productEl.style.boxShadow;
          productEl.style.transition = 'box-shadow .28s ease';
          productEl.style.boxShadow = '0 8px 30px rgba(14,165,233,0.18)';
          setTimeout(()=>{ productEl.style.boxShadow = prevBox || ''; }, 900);
          return;
        }

        // 4) fallback: follow slide link if any
        const href = (slide.querySelector('a') || {}).href;
        if(href) window.location.href = href;
      }, false);


      // init
      show(current);
      start();
    }catch(err){
      try{ console.error('slideshow init error', err); }catch(e){}
    }
  })();

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    updateHeader();
    if(isLoggedIn()) showUserUI(parseUser()); else showGuestUI();
  });

  // Storage listener: sync header and auth UI across tabs
  window.addEventListener('storage', function(e){
    if(!e) return;
    if(e.key === KEYS.CART || e.key === KEYS.CART_SYNC) updateHeader();
    if(e.key === KEYS.LOGIN_FLAG || e.key === KEYS.USER){
      if(isLoggedIn()) showUserUI(parseUser()); else showGuestUI();
    }
  });

})();
