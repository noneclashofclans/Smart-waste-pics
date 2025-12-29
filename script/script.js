const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("preview");
const previewWrapper = document.getElementById("preview-wrapper");
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

const N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/61e29fbc-00ef-4ab5-9d0a-ac1c416eb8c7";
const ML_PREDICTION_URL = "http://127.0.0.1:8000/predict";

let imageUploaded = false;
let analysisRun = false;

fileInput.addEventListener("change", function () {
    const file = this.files[0];

    imageUploaded = false;
    analysisRun = false;
    resultDiv.classList.add("hidden");
    detectBtn.classList.add("hidden");
    previewWrapper.classList.add("hidden");

    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        previewImg.src = e.target.result;
        previewWrapper.classList.remove("hidden");
        detectBtn.classList.remove("hidden");
        imageUploaded = true;
    };
    reader.readAsDataURL(file);
});



async function predictWaste() {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please upload an image first.");
        return;
    }

    wasteTypeField.textContent = "Waste type: Detecting...";
    recommendationField.textContent = "Recommended disposal: Processing...";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(ML_PREDICTION_URL, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        const category = data.category || "Unknown";

        let rec;
        if (category === "Biodegradable") {
            rec = "For environmentally responsible disposal, please compost this material. Place it exclusively in the organic/food waste receptacle provided by your local waste management service.";
        } else if (category === "Non-Biodegradable") {
            rec = "Please place this item in your designated general waste bin (often labelled as trash, refuse, or residual waste). This material is not accepted by standard municipal recycling or composting facilities and must be sent to an authorized waste treatment center or landfill.";
        } else {
            rec = "Follow local disposal guidelines.";
        }

        wasteTypeField.textContent = `Waste type: ${category}`;
        recommendationField.textContent = `Recommended disposal: ${rec}`;

        detectedImg.src = previewImg.src;
        analysisRun = true;

    } catch (err) {
        wasteTypeField.textContent = "Waste type: Error";
        recommendationField.textContent = "Failed to connect to server.";
        console.error(err);
        alert("Server error. Try again.");
    }
}

detectBtn.addEventListener("click", async () => {

    resultDiv.classList.remove("hidden");
    detectedImg.src = previewImg.src;

    detectBtn.classList.add('hidden');
    

    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    

    await predictWaste();
    
 
    setTimeout(() => autoDetectLocation(), 1200);
});


function autoDetectLocation() {
    if (!navigator.geolocation) {
        locationInput.value = "Location not supported";
        return;
    }

    locationInput.value = "Detecting location...";

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18`;

        try {
            const res = await fetch(url);
            const data = await res.json();
 
            const addr = data.address;
            const parts = [];
 
            if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
            if (addr.road) parts.push(addr.road);
            if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
            if (addr.state_district) parts.push(addr.state_district);
            if (addr.state) parts.push(addr.state);

            locationInput.value = parts.length > 0 
                ? parts.join(", ") 
                : data.display_name || `${lat}, ${lon}`;
                
        } catch (e) {
            locationInput.value = `${lat}, ${lon}`;
        }
    }, (err) => {
        locationInput.value = "Location access denied.";
    }, { enableHighAccuracy: true });
}

submitBtn.addEventListener("click", async () => {
    if (!nameInput.value || !emailInput.value || !phoneInput.value || !locationInput.value || !wasteDescInput.value) {
        alert("Please fill all fields.");
        return;
    }
    const file = fileInput.files[0];
    if (!file) {
        alert("Please upload an image file.");
        return;
    }

    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;

    const submissionFormData = new FormData();
    submissionFormData.append('name', nameInput.value);
    submissionFormData.append('email', emailInput.value);
    submissionFormData.append('phone', phoneInput.value);
    submissionFormData.append('location', locationInput.value);
    submissionFormData.append('wasteType', wasteTypeField.textContent.replace("Waste type: ", ""));
    submissionFormData.append('wasteDescription', wasteDescInput.value);
    submissionFormData.append('imageFile', file); 

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            body: submissionFormData 
        });

        if (response.ok) {
            alert("Details submitted to server successfully! Report dispatched.");
            submitBtn.style.display = "none";
        } else {
            alert("Failed to submit data. Server error.");
            submitBtn.textContent = "Dispatch Report to BMC";
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        alert("Network error: Unable to reach server.");
        submitBtn.textContent = "Dispatch Report to BMC";
        submitBtn.disabled = false;
    }
});