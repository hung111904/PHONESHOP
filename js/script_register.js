document.querySelector(".login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.querySelector('input[type="email"]').value;
  const password = document.querySelector('input[type="password"]').value;
  const confirmPassword = document.querySelector('input[placeholder="Xác nhận mật khẩu"]').value;
  if (!email || !password || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
  }
  if (password !== confirmPassword) {
      alert("Mật khẩu và xác nhận mật khẩu không khớp!");
      return;
  }
  if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
  }

 
  localStorage.setItem("isRegistered", true); 
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userPassword", password);
  alert("Đăng ký thành công!");
  window.location.href = "login.html";
});
