const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("preview");
const resultDiv = document.getElementById("prediction-result");
const detectedImg = document.getElementById("detected-image");

const wasteTypeField = document.getElementById("waste-type");
const recommendationField = document.getElementById("recommendation");

const nameInput = document.getElementById("userName");
const emailInput = document.getElementById("userEmail");
const phoneInput = document.getElementById("userPhone");
const locationInput = document.getElementById("userLocation");

const detectBtn = document.getElementById("detect-button");
const submitBtn = document.getElementById("submit-details");

const wasteDescInput = document.getElementById("wasteDescription");


fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.classList.remove("hidden");
    };
    reader.readAsDataURL(file);

    resultDiv.classList.add("hidden");
});


async function predictWaste() {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please upload an image first.");
        return;
    }

    wasteTypeField.textContent = "Waste type: Detecting...";
    recommendationField.textContent = "Recommended disposal: Processing...";
    resultDiv.classList.remove("hidden");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("https://smart-waste-pics-1.onrender.com/predict", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        const category = data.category || "Unknown";

        let rec;
        if (category === "Biodegradable") {
            rec = "For environmentally responsible disposal, please compost this material. Place it exclusively in the organic/food waste receptacle provided by your local waste management service. For environmentally responsible disposal, please compost this material. Place it exclusively in the organic/food waste receptacle provided by your local waste management service.";
        } else if (category === "Non-Biodegradable") {
            rec = "Please place this item in your designated general waste bin (often labelled as trash, refuse, or residual waste). This material is not accepted by standard municipal recycling or composting facilities and must be sent to an authorized waste treatment center or landfill.";
        } else {
            rec = "Follow local disposal guidelines.";
        }

        wasteTypeField.textContent = `Waste type: ${category}`;
        recommendationField.textContent = `Recommended disposal: ${rec}`;

        detectedImg.src = previewImg.src;

    } catch (err) {
        wasteTypeField.textContent = "Waste type: Error";
        recommendationField.textContent = "Failed to connect to server.";
        console.error(err);
        alert("Server error. Try again.");
    }
}

detectBtn.addEventListener("click", () => {
    predictWaste();
    setTimeout(() => autoDetectLocation(), 800);
});


function autoDetectLocation() {
    if (!navigator.geolocation) {
        locationInput.value = "Geolocation not supported";
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            locationInput.value = data.display_name || `${lat}, ${lon}`;
        } catch (error) {
            locationInput.value = `${lat}, ${lon}`;
        }
    });
}

submitBtn.addEventListener("click", async () => {
    if (!nameInput.value || !emailInput.value || !phoneInput.value || !locationInput.value || !wasteDescInput.value) {
        alert("Please fill all fields.");
        return;
    }

    const payload = {
        name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        location: locationInput.value,
        wasteType: wasteTypeField.textContent.replace("Waste type: ", ""),
        wasteDescription: wasteDescInput.value
    };

    try {
        const response = await fetch("http://localhost:5678/webhook-test/69e93681-fa35-47e9-a553-50e8807d4ec5", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Details submitted to server successfully!");
        } else {
            alert("Failed to submit data. Server error.");
        }
    } catch (error) {
        console.error(error);
        alert("Network error: Unable to reach server.");
    }
});

