from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
from model import WasteClassifier

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


classifier = WasteClassifier(model_path="waste_classifier.h5")


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        result_data = classifier.predict(img) 
        
        category_name = result_data.get("category", "Unknown")
        return {
            "success": True,
            "category": category_name,
            "confidence": result_data["confidence"]
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}
