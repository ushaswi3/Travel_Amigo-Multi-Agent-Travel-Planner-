document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email && password) {
        document.getElementById("message").textContent =
            "Login Successful!";
    } else {
        document.getElementById("message").textContent =
            "Please fill all fields.";
    }
});