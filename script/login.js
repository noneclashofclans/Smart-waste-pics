const submit_btn = document.querySelector('.auth-btn');

submit_btn.addEventListener('click', async () => {
    const email = document.getElementById('mail').value;
    const password = document.getElementById('password').value;

    if (!email || !password){
        alert('Please fill all credentials');
        return;
    }

    try {
        const response = await fetch('https://smart-waste-pics-authentication-user.onrender.com/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }) 
        });

        const data = await response.json();

        if (response.ok){
            alert('Login successful!');
            localStorage.setItem('token', data.token);
            localStorage.setItem('email', email);
            window.location.href = 'index.html';
        } else {
            alert(data.msg || 'Login failed');
        } 
    } catch (err) {
        console.error(err);
        alert('Server error');
    }
});
