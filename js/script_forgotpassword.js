document.getElementById('forgotPasswordForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const registeredEmail = localStorage.getItem('userEmail');
    console.log("Email nhập vào:", email);
    console.log("Email đã đăng ký:", registeredEmail);
    if (!email) {
        alert("Vui lòng nhập email.");
        return;
    }
    if (email !== registeredEmail) {
        alert("Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại.");
        return;
    }
    alert("Đã gửi email khôi phục mật khẩu đến " + email);
    console.log("Chuyển hướng về trang đăng nhập...");
    window.location.href = "login.html";
});

