const submit_btn = document.querySelector('.auth-btn');

submit_btn.addEventListener('click', async () => {
    const email = document.getElementById('mail').value;
    const password = document.getElementById('password').value;

    if (!email || !password){
        alert('Please fill all credentials');
        return;
    }

    try{
        const response = await fetch('http://localhost:7000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }) 
        });

        const data = await response.json();

        if (response.ok){ 
            alert(data.msg);
            return;
        } else {
            alert(data.msg || 'Error in registration');
        } 
    } catch (err) {
        console.error(err);
        alert('Server error');
    }
});

