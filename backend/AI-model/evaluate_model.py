import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

MODEL_PATH = "lstm_accident_model.h5"
SCALER_PATH = "scaler.save"
THRESHOLD_PATH = "threshold.npy"

WINDOW_SIZE = 15
FEATURES = ["acceleration_g", "speed_kmph", "tilt_degree"]

# =========================
# LOAD
# =========================
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
scaler = joblib.load(SCALER_PATH)
threshold = np.load(THRESHOLD_PATH)

# =========================
# CREATE SEQUENCES
# =========================
def create_sequences(data, window_size):
    sequences = []
    for i in range(len(data) - window_size):
        sequences.append(data[i:i+window_size])
    return np.array(sequences)

# =========================
# GENERATE LABELED DATA
# =========================
def generate_labeled_data(df):
    df = df.copy()
    labels = np.zeros(len(df))  # 0 = normal, 1 = anomaly

    # Inject anomalies
    anomaly_indices = [50, 80, 120, 150]

    for idx in anomaly_indices:
        if idx < len(df):
            df.loc[idx, "acceleration_g"] = 2.5
            df.loc[idx, "tilt_degree"] += 30
            labels[idx] = 1

    return df, labels

# =========================
# EVALUATION
# =========================
def evaluate(df):

    df, labels = generate_labeled_data(df)

    data = df[FEATURES].values
    data_scaled = scaler.transform(data)

    sequences = create_sequences(data_scaled, WINDOW_SIZE)

    y_true = []
    y_pred = []

    for i, seq in enumerate(sequences):

        seq_input = np.expand_dims(seq, axis=0)
        recon = model.predict(seq_input, verbose=0)

        mse = np.mean(np.power(seq - recon[0], 2))

        raw_window = df.iloc[i:i+WINDOW_SIZE]

        max_accel = raw_window["acceleration_g"].max()
        tilt_delta = raw_window["tilt_degree"].diff().abs().max()

        # Prediction
        pred = int(
            (mse > threshold) or
            (max_accel >= 2.0) or
            (tilt_delta > 20)
        )

        # Ground truth (if any anomaly exists in window)
        true = int(np.any(labels[i:i+WINDOW_SIZE] == 1))

        y_pred.append(pred)
        y_true.append(true)

    # =========================
    # METRICS
    # =========================
    print("\n📊 MODEL PERFORMANCE METRICS\n")

    print("Accuracy:", accuracy_score(y_true, y_pred))

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=["Normal", "Anomaly"]))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_true, y_pred))


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    df = pd.read_csv("accident_dataset.csv")
    evaluate(df)