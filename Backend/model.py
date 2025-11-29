import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import cv2
import os

CATEGORIES = ["Biodegradable", "Non-Biodegradable"]
IMG_SIZE = 224

import os
import gdown

MODEL_PATH = "waste_classifier.h5"
DRIVE_FILE_ID = "1FUKryZJultDPyg41QSM9T4MBz4do9w2_"  

if not os.path.exists(MODEL_PATH):
    print("[INFO] Downloading model from Google Drive...")
    url = f"https://drive.google.com/uc?export=download&id={DRIVE_FILE_ID}"
    gdown.download(url, MODEL_PATH, quiet=False)
    print("[INFO] Model downloaded.")

class WasteClassifier:
    def __init__(self, model_path=None):
        self.img_size = IMG_SIZE
        self.categories = CATEGORIES
        self.model = None
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self.build_model()
    
    def build_model(self):
        model = keras.Sequential([
            layers.Input(shape=(self.img_size, self.img_size, 3)),
            layers.Conv2D(32, 3, activation="relu"),
            layers.MaxPooling2D(),
            layers.Conv2D(64, 3, activation="relu"),
            layers.MaxPooling2D(),
            layers.Conv2D(128, 3, activation="relu"),
            layers.MaxPooling2D(),
            layers.Flatten(),
            layers.Dense(128, activation="relu"),
            layers.Dense(len(self.categories), activation="softmax")
        ])
        
        model.compile(
            optimizer="adam",
            loss="categorical_crossentropy",
            metrics=["accuracy"]
        )
        
        self.model = model
        return model
    
    def load_model(self, path):
        self.model = keras.models.load_model(path)
        print(f"[INFO] Loaded model: {path}")
    
    def save_model(self, save_path):
        self.model.save(save_path)
        print(f"[INFO] Model saved at: {save_path}")
    
    def preprocess_image(self, image):
        # image path
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image  # numpy image
        
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (self.img_size, self.img_size))
        img = img.astype(np.float32) / 255.0
        img = np.expand_dims(img, axis=0)
        return img
    
    def predict(self, image):
        processed = self.preprocess_image(image)
        pred = self.model.predict(processed, verbose=0)[0]
        class_id = int(np.argmax(pred))
        confidence = float(pred[class_id])
        
        return {
            "category": self.categories[class_id],
            "confidence": confidence,
            "probabilities": {
                cat: float(prob) for cat, prob in zip(self.categories, pred)
            }
        }

def create_prediction_api(model_path):
    classifier = WasteClassifier(model_path)
    
    def predict_fn(image):
        try:
            img = image if isinstance(image, np.ndarray) else cv2.imread(image)
            result = classifier.predict(img)
            return {"success": True, "data": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    return predict_fn