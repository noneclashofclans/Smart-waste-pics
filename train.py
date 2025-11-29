import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras import layers, models

TRAIN_DIR = "waste_datasets/Train"
VAL_DIR = "waste_datasets/Val"
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 10

def load_dataset():
    train_gen = ImageDataGenerator(
        rescale=1/255.0,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.15,
        zoom_range=0.15,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    val_gen = ImageDataGenerator(rescale=1/255.0)

    train_set = train_gen.flow_from_directory(
        TRAIN_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical"
    )

    val_set = val_gen.flow_from_directory(
        VAL_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical"
    )

    return train_set, val_set


def build_model(num_classes):
    model = models.Sequential([
        layers.Input(shape=(224, 224, 3)),
        layers.Conv2D(32, 3, activation="relu"),
        layers.MaxPooling2D(),
        layers.Conv2D(64, 3, activation="relu"),
        layers.MaxPooling2D(),
        layers.Conv2D(128, 3, activation="relu"),
        layers.MaxPooling2D(),
        layers.Flatten(),
        layers.Dense(128, activation="relu"),
        layers.Dense(num_classes, activation="softmax")
    ])

    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    return model


def train_model():
    train_set, val_set = load_dataset()

    num_classes = len(train_set.class_indices)
    print("Detected classes:", train_set.class_indices)

    model = build_model(num_classes)

    model.fit(
        train_set,
        validation_data=val_set,
        epochs=EPOCHS
    )

    model.save("waste_classifier.h5")
    print("Model saved as waste_classifier.h5")


if __name__ == "__main__":
    train_model()
