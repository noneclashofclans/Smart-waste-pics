const submitBtn = document.querySelector('button[type="submit"]');
const submitBtnText = submitBtn.querySelector(".btn-text");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("mail");
const passwordInput = document.getElementById("password");
const ageInput = document.getElementById("age");
const phoneInput = document.getElementById("phone");

submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const age = ageInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !email || !password || !age) {
        alert("Fill all fields");
        return;
    }

    if (password.length < 6) {
        alert("Password must be 6+ characters");
        return;
    }

    if (age < 16 || age > 100) {
        alert("Age must be between 16 and 100");
        return;
    }

    submitBtn.classList.add("Loading");
    submitBtn.disabled = true;

    try {
        const response = await fetch("http://localhost:5000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, phone, age, password })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.msg && data.msg.toLowerCase().includes("already exists")) {
                alert("This account already exists. Redirecting to login...");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
                return;
            }
            alert(data.msg || "Registration failed");
            submitBtn.classList.remove("Loading");
            submitBtn.disabled = false;
            return;
        }

        alert("Registration successful!");
        window.location.href = "login.html";

    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Please try again.");
        submitBtn.classList.remove("Loading");
        submitBtn.disabled = false;
    }
});