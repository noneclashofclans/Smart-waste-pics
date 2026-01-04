import os
import numpy as np
import cv2
from tensorflow import keras

categories = ["Biodegradable", "Non-Biodegradable"]
image_size = 224
model_file = "waste_classifier.h5"

class WasteClassifier:
    def __init__(self, model_path=None):
        self.image_size = image_size
        self.categories = categories

        # Finalizing the model path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = model_path or os.path.join(base_dir, model_file)

        # Check if model exists
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"[ERROR] Model not found at {model_path}")

        # Load the model
        self.model = keras.models.load_model(model_path)
        print(f"[INFO] Model loaded from {model_path}")

    # Image preprocessing
    def preprocess_image(self, image):
        # Accept file path or numpy array
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image

        if img is None:
            raise ValueError("[ERROR] Invalid image provided")

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (self.image_size, self.image_size))
        img = img.astype(np.float32) / 255.0
        return np.expand_dims(img, axis=0)

    # Prediction
    def predict(self, image):
        processed = self.preprocess_image(image)
        pred = self.model.predict(processed, verbose=0)[0]
        class_id = int(np.argmax(pred))

        return {
            "category": self.categories[class_id],
            "confidence": float(pred[class_id]),
            "probabilities": {cat: float(prob) for cat, prob in zip(self.categories, pred)}
        }
