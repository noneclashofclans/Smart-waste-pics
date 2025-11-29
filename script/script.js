function predictWaste() {
    const fileInput = document.getElementById("fileInput");
    const resultDiv = document.getElementById("prediction-result");
    const wasteType = document.getElementById("waste-type");
    const recommendation = document.getElementById("recommendation");

    if (!fileInput.files.length) {
        alert("Please upload an image first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    wasteType.textContent = "Waste type: Detecting...";
    recommendation.textContent = "Recommended disposal: Processing...";
    resultDiv.classList.remove("hidden"); 

    fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        const category = data.category;

        let rec;
        if (category === "Biodegradable") {
            rec = "Dispose in organic/compost bin";
        } else if (category === "Non-Biodegradable") {
            rec = "Dispose in general landfill waste bin";
        } else {
            rec = `Dispose of ${category} following local guidelines.`;
        }

        wasteType.textContent = `Waste type: ${category}`;
        recommendation.textContent = `Recommended disposal: ${rec}`;
    })
    .catch(err => {
        wasteType.textContent = "Waste type: Error";
        recommendation.textContent = "Recommended disposal: Failed to connect to server.";
        alert("Error connecting to server or processing request. See console for error details.");
        console.error("Fetch error:", err);
    });
}

function handleFileChange() {
    const fileInput = document.getElementById("fileInput");
    const preview = document.getElementById("preview");
    const resultDiv = document.getElementById("prediction-result");
    const file = fileInput.files[0];

    resultDiv.classList.add("hidden"); 

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = "";
        preview.classList.add("hidden");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById("fileInput");
    const detectButton = document.getElementById('detect-button');

    if (fileInput) {
        fileInput.addEventListener("change", handleFileChange);
    }
    
    if (detectButton) {
        detectButton.addEventListener('click', predictWaste);
    }
});
