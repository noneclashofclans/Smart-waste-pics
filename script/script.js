const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("preview");
const previewWrapper = document.getElementById("preview-wrapper");
const resultDiv = document.getElementById("prediction-result");
const detectedImg = document.getElementById("detected-image");
const warning = document.querySelector('.warning');
const wasteTypeField = document.getElementById("waste-type");
const recommendationField = document.getElementById("recommendation");
const nameInput = document.getElementById("userName");
const emailInput = document.getElementById("userEmail");
const phoneInput = document.getElementById("userPhone");
const locationInput = document.getElementById("userLocation");
const detectBtn = document.getElementById("detect-button");
const submitBtn = document.getElementById("submit-details");
const wasteDescInput = document.getElementById("wasteDescription");
const trackEmailInput = document.getElementById("track-email");
const submitText = document.getElementById("submit-text");
const submitSpinner = document.getElementById("submit-spinner");


const N8N_WEBHOOK_URL = "https://n8n-1-9uun.onrender.com/webhook/61e29fbc-00ef-4ab5-9d0a-ac1c416eb8c7";
const ML_PREDICTION_URL = "https://smart-waste-pics-1.onrender.com/predict";

let imageUploaded = false;
let analysisRun = false;
let imgbb = null;

if (fileInput) {
    fileInput.addEventListener("change", function () {
        const file = this.files[0];
        imageUploaded = false;
        analysisRun = false;
        imgbb = null;
        if (resultDiv) resultDiv.classList.add("hidden");
        if (detectBtn) detectBtn.classList.add("hidden");
        if (previewWrapper) previewWrapper.classList.add("hidden");
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
}

async function predictWaste() {
    const file = fileInput.files[0];
    if (!file) return;

    wasteTypeField.textContent = "Waste type: Detecting...";
    recommendationField.textContent = "Recommended disposal: Processing...";
    
    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(ML_PREDICTION_URL, {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error("Server responded with an error");

        const data = await res.json();
        const category = data.category || "Unknown";
        imgbb = data.image_url; 

        let rec;
        if (category === "Biodegradable") {
            rec = "For environmentally responsible disposal, please compost this material. Place it exclusively in the organic/food waste receptacle provided by your local waste management service.";
        } else if (category === "Non-Biodegradable") {
            rec = "Please place this item in your designated general waste bin. This material is not accepted by standard municipal recycling or composting facilities.";
        } else {
            rec = "Follow local disposal guidelines. Disposal of hazardous waste can lead to serious legal consequences. Contact your local authority for more details.";
        }

        wasteTypeField.textContent = `Waste type: ${category}`;
        recommendationField.textContent = `Recommended disposal: ${rec}`;
        detectedImg.src = previewImg.src;
        analysisRun = true;
        
        return category;
    } catch (err) {
        wasteTypeField.textContent = "Waste type: Error";
        recommendationField.textContent = "Failed to connect to server.";
        alert("Server error. Please check your connection and try again.");
        throw err;
    }
}

if (detectBtn) {
    detectBtn.addEventListener("click", async () => {

        detectBtn.disabled = true;
        const detectText = detectBtn.querySelector('span:not(.spinner)'); 
        const detectSpinner = document.getElementById("spinner"); 
        if (detectText) detectText.textContent = "Analyzing...";
        if (detectSpinner) detectSpinner.classList.remove("hidden");

        resultDiv.classList.remove("hidden");
        detectedImg.src = previewImg.src;
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
            await predictWaste(); 
            detectBtn.classList.add('hidden');
        } catch (e) {
        
            detectBtn.disabled = false;
            if (detectText) detectText.textContent = "Run AI Analysis";
            if (detectSpinner) detectSpinner.classList.add("hidden");
        }

        setTimeout(() => autoDetectLocation(), 1200);
    });
}

function autoDetectLocation() {
    if (!navigator.geolocation) {
        if (locationInput) locationInput.value = "Geolocation not supported";
        return;
    }
    if (locationInput) locationInput.value = "Detecting location...";
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
            if (addr.state) parts.push(addr.state);
            if (locationInput) locationInput.value = parts.length > 0 ? parts.join(", ") : data.display_name || `${lat}, ${lon}`;
        } catch (e) {
            if (locationInput) locationInput.value = `${lat}, ${lon}`;
        }
    }, (err) => {
        if (locationInput) locationInput.value = "Location access denied.";
    }, { enableHighAccuracy: true });
}

if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
        // 1. Validation
        if (!nameInput.value || !emailInput.value || !phoneInput.value || !locationInput.value || !wasteDescInput.value) {
            alert("Please fill all fields.");
            return;
        }

        // 2. Start Loading: Disable button, change text, show spinner
        submitBtn.disabled = true;
        if (submitText) submitText.textContent = "Submitting...";
        if (submitSpinner) submitSpinner.classList.remove("hidden");

        const submissionFormData = new FormData();
        submissionFormData.append('name', nameInput.value);
        submissionFormData.append('email', emailInput.value);
        submissionFormData.append('phone', phoneInput.value);
        submissionFormData.append('location', locationInput.value);
        submissionFormData.append('wasteType', wasteTypeField.textContent.replace("Waste type: ", ""));
        submissionFormData.append('wasteDescription', wasteDescInput.value);
        submissionFormData.append('image', imgbb);

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                body: submissionFormData
            });

            if (response.ok) {
                // 3. Success Logic
                const newReport = {
                    id: "#W-" + Math.floor(1000 + Math.random() * 9000),
                    userEmail: emailInput.value.trim(),
                    wasteType: wasteTypeField.textContent.replace("Waste type: ", ""),
                    location: locationInput.value,
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    image: previewImg.src
                };
                const existingReports = JSON.parse(localStorage.getItem("reports")) || [];
                existingReports.unshift(newReport);
                localStorage.setItem("reports", JSON.stringify(existingReports));

                alert("Report successfully dispatched and saved!");
                submitBtn.style.display = "none";
                if (warning) warning.textContent = '';
            } else {
                // 4. Failure Logic: Re-enable button and reset UI
                alert("Failed to submit data.");
                resetSubmitButton();
            }
        } catch (error) {
            alert("Network error.");
            resetSubmitButton();
        }
    });
}

if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
       
        if (!nameInput.value || !emailInput.value || !phoneInput.value || !locationInput.value || !wasteDescInput.value) {
            alert("Please fill all fields.");
            return;
        }

        submitBtn.disabled = true;
        if (submitText) submitText.textContent = "Submitting...";
        if (submitSpinner) submitSpinner.classList.remove("hidden");

        const submissionFormData = new FormData();
        submissionFormData.append('name', nameInput.value);
        submissionFormData.append('email', emailInput.value);
        submissionFormData.append('phone', phoneInput.value);
        submissionFormData.append('location', locationInput.value);
        submissionFormData.append('wasteType', wasteTypeField.textContent.replace("Waste type: ", ""));
        submissionFormData.append('wasteDescription', wasteDescInput.value);
        submissionFormData.append('image', imgbb);

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                body: submissionFormData
            });

            if (response.ok) {
         
                const newReport = {
                    id: "#W-" + Math.floor(1000 + Math.random() * 9000),
                    userEmail: emailInput.value.trim(),
                    wasteType: wasteTypeField.textContent.replace("Waste type: ", ""),
                    location: locationInput.value,
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    image: previewImg.src
                };
                const existingReports = JSON.parse(localStorage.getItem("reports")) || [];
                existingReports.unshift(newReport);
                localStorage.setItem("reports", JSON.stringify(existingReports));

                alert("Report successfully dispatched and saved!");
                submitBtn.style.display = "none";
                if (warning) warning.textContent = '';
            } else {
                alert("Failed to submit data.");
                resetSubmitButton();
            }
        } catch (error) {
            alert("Network error.");
            resetSubmitButton();
        }
    });
}

function resetSubmitButton() {
    submitBtn.disabled = false;
    if (submitSpinner) submitSpinner.classList.add("hidden");
    if (submitText) {
        submitText.innerHTML = `<i class="fas fa-paper-plane"></i> Dispatch Report to BMC`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const trackEmailBtn = document.getElementById("search-btn");
    const trackEmailInput = document.getElementById("track-email");
    const resultsSection = document.getElementById('results-section');
    const historyList = document.getElementById('history-list');
    const emptyState = document.getElementById('empty-state');
    const messageDiv = document.getElementById('message');
    

    function loadHistory(email) {
        const user_email = email.trim().toLowerCase();

        trackEmailInput.value = user_email;
        
        const rawData = localStorage.getItem('reports');
        const reports = rawData ? JSON.parse(rawData) : [];
        
        const filteredReports = reports.filter(report => 
            report.userEmail && report.userEmail.toLowerCase() === user_email
        );
        
        if (filteredReports.length === 0) {
            resultsSection.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            historyList.innerHTML = filteredReports.map(report => `
                <div class="complaint-card">
                    <img src="${report.image}" class="complaint-thumb" alt="Waste">
                    <div class="complaint-info">
                        <h3>${report.wasteType}</h3>
                        <p><i class="fas fa-map-marker-alt"></i> ${report.location}</p>
                        <p><i class="far fa-calendar-alt"></i> ${report.date} • ID: ${report.id}</p>
                    </div>
                    <div class="status-badge status-dispatched">Dispatched</div>
                </div>
            `).join('');
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    const storedEmail = localStorage.getItem('email');
    const token = localStorage.getItem('token');
    
    if (storedEmail && token && trackEmailInput) {
        trackEmailInput.value = storedEmail;
        trackEmailInput.disabled = true; 
        if (messageDiv) {
            messageDiv.innerHTML = `
                <p style="text-align: center; color: var(--google-blue); font-size: 13px;">
                    <i class="fas fa-user-check"></i> Viewing history for: <strong>${storedEmail}</strong>
                </p>
            `;
        }
        
        loadHistory(storedEmail);
    } else if (trackEmailInput) {

        trackEmailInput.disabled = false;
        
        if (messageDiv) {
            messageDiv.innerHTML = `
                <p style="text-align: center; color: #ea4335; font-size: 13px;">
                    <i class="fas fa-exclamation-circle"></i> Please <a href="register.html" style="color: var(--google-blue); text-decoration: underline;">login</a> to view your history automatically
                </p>
            `;
        }
    }
    
    if (trackEmailBtn) {
        trackEmailBtn.addEventListener("click", () => {
            const email = trackEmailInput.value.trim();
            
            loadHistory(email);
        });
        
        if (trackEmailInput) {
            trackEmailInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") trackEmailBtn.click();
            });
        }
    }
});