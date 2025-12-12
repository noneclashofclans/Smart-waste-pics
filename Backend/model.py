import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import cv2
import os
import gdown

CATEGORIES = ["Biodegradable", "Non-Biodegradable"]
IMG_SIZE = 224
MODEL_PATH = "waste_classifier.h5"
DRIVE_FILE_ID = "1NmAeVXPzDRQlxAdir7TRhHZ0RGUaBSX_"


class WasteClassifier:
    def __init__(self, model_path=None):
        self.img_size = IMG_SIZE
        self.categories = CATEGORIES
        self.model = None

        model_path = model_path or MODEL_PATH

        if not os.path.exists(model_path):
            print("[INFO] Model not found. Trying to download from Google Drive...")

            url = f"https://drive.google.com/uc?id={DRIVE_FILE_ID}"

            try:
                gdown.download(url, model_path, quiet=False, fuzzy=True)
            except Exception as e:
                print("[ERROR] gdown failed:", e)

        if os.path.exists(model_path):
            self.load_model(model_path)
        else:
            print("[WARNING] Model NOT downloaded. Building new (untrained) model.")
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
        print(f"[INFO] Loaded model from: {path}")

    def preprocess_image(self, image):
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image

        if img is None:
            raise ValueError("Invalid image provided")

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (self.img_size, self.img_size))
        img = img.astype(np.float32) / 255.0
        return np.expand_dims(img, axis=0)

    def predict(self, image):
        processed = self.preprocess_image(image)
        pred = self.model.predict(processed, verbose=0)[0]
        class_id = int(np.argmax(pred))

        return {
            "category": self.categories[class_id],
            "confidence": float(pred[class_id]),
            "probabilities": {
                cat: float(prob) for cat, prob in zip(self.categories, pred)
            }
        }
