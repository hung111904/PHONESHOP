// script_login.js (ngắn gọn, chuẩn hoá storage)
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const form = document.querySelector('#loginForm');
    if (!form) return;

    if (form.__attached) return;
    form.__attached = true;

    function markLoggedIn(email){
      try {
        localStorage.setItem('phoneShop_isLoggedIn', '1');
        localStorage.setItem('phoneShop_user', JSON.stringify({ email: email || '' }));
        localStorage.setItem('isLoggedIn', 'true'); // legacy
      } catch(e){}
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      const email = (document.getElementById('email')||{}).value || '';
      const password = (document.getElementById('password')||{}).value || '';

      const registeredEmail = localStorage.getItem('userEmail');
      const registeredPassword = localStorage.getItem('userPassword');
      const rawUser = localStorage.getItem('phoneShop_user') || localStorage.getItem('user');

      // simple read fallback
      let regEmail = registeredEmail, regPass = registeredPassword;
      if (!regEmail && rawUser) {
        try { const u = JSON.parse(rawUser); regEmail = u.email; regPass = u.password || u.pass || null; } catch(e){}
      }

      if (!regEmail) { alert('Bạn chưa đăng ký tài khoản. Vui lòng đăng ký trước!'); return; }

      // if stored password missing, accept by email (demo)
      if (regPass === null || regPass === undefined) {
        if (email === regEmail) { markLoggedIn(email); alert('Đăng nhập thành công!'); window.location.href = 'index.html'; }
        else alert('Email hoặc mật khẩu không đúng.');
        return;
      }

      if (email === regEmail && password === regPass) {
        markLoggedIn(email);
        alert('Đăng nhập thành công!');
        window.location.href = 'index.html';
      } else {
        alert('Email hoặc mật khẩu không đúng.');
      }
    });
  });
})();
