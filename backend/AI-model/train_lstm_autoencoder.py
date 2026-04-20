import pandas as pd
import numpy as np
import os
import logging
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, RepeatVector, TimeDistributed, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import joblib

logging.basicConfig(level=logging.INFO)

# =========================
# CONFIG
# =========================
DATA_PATH = "accident_dataset.csv"
MODEL_PATH = "lstm_accident_model.h5"
SCALER_PATH = "scaler.save"
THRESHOLD_PATH = "threshold.npy"

WINDOW_SIZE = 15
FEATURES = ["acceleration_g", "speed_kmph", "tilt_degree"]

# =========================
# LOAD DATA
# =========================
def load_data():
    df = pd.read_csv(DATA_PATH)
    df = df.sort_values("timestamp")

    # Handle missing values (Pandas 2+ fix)
    df = df.ffill().bfill()

    return df
# =========================
# CREATE SEQUENCES
# =========================
def create_sequences(data, window_size):
    sequences = []
    for i in range(len(data) - window_size):
        sequences.append(data[i:i+window_size])
    return np.array(sequences)

# =========================
# BUILD MODEL
# =========================
def build_model(input_shape):
    inputs = Input(shape=input_shape)

    # Encoder
    x = LSTM(64, return_sequences=True)(inputs)
    x = Dropout(0.2)(x)
    x = LSTM(32, return_sequences=False)(x)

    encoded = RepeatVector(input_shape[0])(x)

    # Decoder
    x = LSTM(32, return_sequences=True)(encoded)
    x = Dropout(0.2)(x)
    x = LSTM(64, return_sequences=True)(x)

    outputs = TimeDistributed(Dense(input_shape[1]))(x)

    model = Model(inputs, outputs)
    model.compile(optimizer='adam', loss='mse')

    return model

# =========================
# MAIN TRAINING
# =========================
def main():
    df = load_data()

    data = df[FEATURES].values

    # Scaling
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data)

    joblib.dump(scaler, SCALER_PATH)
    logging.info("Scaler saved.")

    # Create sequences
    sequences = create_sequences(data_scaled, WINDOW_SIZE)

    X_train, X_val = train_test_split(sequences, test_size=0.2, random_state=42)

    model = build_model((WINDOW_SIZE, len(FEATURES)))
    model.summary()

    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True),
        ModelCheckpoint(MODEL_PATH, save_best_only=True)
    ]

    history = model.fit(
        X_train, X_train,
        epochs=50,
        batch_size=32,
        validation_data=(X_val, X_val),
        callbacks=callbacks
    )

    # =========================
    # THRESHOLD CALCULATION
    # =========================
    reconstructions = model.predict(X_train)
    mse = np.mean(np.power(X_train - reconstructions, 2), axis=(1,2))

    threshold = np.percentile(mse, 95)
    np.save(THRESHOLD_PATH, threshold)

    logging.info(f"Threshold saved: {threshold}")

if __name__ == "__main__":
    main()