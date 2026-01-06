document.addEventListener('DOMContentLoaded', () => {

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }


    const token = localStorage.getItem('token');   
    const email = localStorage.getItem('email');   
    const loginBtn = document.getElementById('lgr');
    const userNameLi = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const aiDetectionLink = document.getElementById('ai-detection');
    const goToDetectionBtn = document.querySelector('.hero .btn');

    function updateUIForLoginStatus(isLoggedIn) {
        if (isLoggedIn) {
            // User is logged in
            if (loginBtn) {
                loginBtn.style.display = 'none';
            }
            
            if (userNameLi) {
                userNameLi.style.display = 'inline-block';
                const emailSpan = userNameLi.querySelector('span');
                if (emailSpan) {
                    emailSpan.textContent = email;
                }
            }

            if (aiDetectionLink) {
                aiDetectionLink.style.display = 'inline-block';
            }

            if (goToDetectionBtn) {
                goToDetectionBtn.style.display = 'inline-block';
            }
        } else {
            // User is not logged in
            if (loginBtn) {
                loginBtn.style.display = 'inline-block';
            }
            
            if (userNameLi) {
                userNameLi.style.display = 'none';
            }

            if (aiDetectionLink) {
                aiDetectionLink.style.display = 'none';
            }

            // Hide "Go to AI Detection" button on home page if it exists
            if (goToDetectionBtn) {
                goToDetectionBtn.style.display = 'none';
            }
        }
    }

    // Check if user is logged in
    const isLoggedIn = !!(token && email);
    updateUIForLoginStatus(isLoggedIn);

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Clear all authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            
            // Redirect to home page
            window.location.href = 'index.html';
        });
    }

    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'detection.html' && !isLoggedIn) {
        alert('Please login to access AI Detection');
        window.location.href = 'register.html';
    }
});

window.addEventListener('storage', (e) => {
    if (e.key === 'token' || e.key === 'email') {
        location.reload();
    }
});