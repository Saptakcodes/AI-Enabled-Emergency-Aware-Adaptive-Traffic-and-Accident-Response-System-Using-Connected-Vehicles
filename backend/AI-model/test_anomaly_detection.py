import numpy as np
import pandas as pd
import joblib
import tensorflow as tf

MODEL_PATH = "lstm_accident_model.h5"
SCALER_PATH = "scaler.save"
THRESHOLD_PATH = "threshold.npy"

WINDOW_SIZE = 15
FEATURES = ["acceleration_g", "speed_kmph", "tilt_degree"]

# =========================
# LOAD ARTIFACTS
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
# SYNTHETIC TEST DATA
# =========================
def generate_test_data(df):
    df_test = df.copy()

    # Inject anomaly
    df_test.loc[10, "acceleration_g"] = 2.5
    df_test.loc[12, "tilt_degree"] += 30

    return df_test

# =========================
# DETECTION
# =========================
def detect(df):
    data = df[FEATURES].values
    timestamps = df["timestamp"].values

    data_scaled = scaler.transform(data)
    sequences = create_sequences(data_scaled, WINDOW_SIZE)

    anomalies = 0

    for i, seq in enumerate(sequences[:20]):

        seq_input = np.expand_dims(seq, axis=0)
        recon = model.predict(seq_input)
        mse = np.mean(np.power(seq - recon[0], 2))

        raw_window = df.iloc[i:i+WINDOW_SIZE]

        max_accel = raw_window["acceleration_g"].max()
        tilt_delta = raw_window["tilt_degree"].diff().abs().max()

        is_anomaly = (
            mse > threshold or
            max_accel >= 2.0 or
            tilt_delta > 20
        )

        if is_anomaly:
            anomalies += 1

        print(f"\nTest Sample {i+1}:")
        print(f"  Time Window: [{timestamps[i]} - {timestamps[i+WINDOW_SIZE-1]}]")
        print(f"  Reconstruction Error: {mse:.6f}")
        print(f"  Threshold: {threshold:.6f}")
        print(f"  Max Acceleration: {max_accel:.2f} g")
        print(f"  Max Tilt Delta: {tilt_delta:.2f}°")
        print("  --->", "ANOMALY DETECTED" if is_anomaly else "NORMAL")

    print("\n==========================")
    print(f"Total Anomalies Detected: {anomalies} / 20")

# =========================
# MAIN
# =========================
if __name__ == "__main__":
    df = pd.read_csv("accident_dataset.csv")

    df_test = generate_test_data(df)
    detect(df_test)