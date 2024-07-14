const ShowHiddenPass = (loginPass, loginEye) =>{
    const input = document.getElementById(loginPass),
          iconEye = document.getElementById(loginEye)
 
    iconEye.addEventListener('click', () =>{
       if(input.type === 'password'){
          input.type = 'text'

          iconEye.classList.add('ri-eye-line')
          iconEye.classList.remove('ri-eye-off-line')
       } else{
  
          input.type = 'password'
 
          iconEye.classList.remove('ri-eye-line')
          iconEye.classList.add('ri-eye-off-line')
       }
    })
 }
function CheckLogin() {
   let user = document.getElementById('username').value;
   let password = document.getElementById('login-pass').value;
   if (user == 'admin' && password == 'admin') {
      window.location.href = '/admin';
      localStorage.setItem('isLoggedIn', true);
      alert('Đăng nhập thành công');
   }
   else {
      alert('Sai tài khoản hoặc mật khâu vui lòng nhập lại');
   }
}
ShowHiddenPass('login-pass','login-eye')

