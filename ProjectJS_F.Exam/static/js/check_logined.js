function checkLogined() {
    isLoggedIn = localStorage.getItem('isLoggedIn')
    if (isLoggedIn) {
        window.location.href = '/admin'
    }
    }
checkLogined();