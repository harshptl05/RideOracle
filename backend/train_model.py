# backend/train_model.py

import numpy as np
import torch
import torch.nn as nn
from sklearn.model_selection import train_test_split

from model import MatchModel

# ========= STEP 1: LOAD / BUILD YOUR DATA =========
# Replace this with your real feature-building code
def load_data():
    # EXAMPLE ONLY: 1000 samples, 10 features
    # You should build X from:
    #   - quiz answers
    #   - review sentiment & ratings
    #   - financial features
    N = 1000
    D = 10
    X = np.random.randn(N, D).astype(np.float32)

    # Fake labels: high score if sum(features) > 0
    y = (X.sum(axis=1) > 0).astype(np.float32)

    return X, y

def main():
    X, y = load_data()
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train.reshape(-1, 1), dtype=torch.float32)
    X_val_t   = torch.tensor(X_val, dtype=torch.float32)
    y_val_t   = torch.tensor(y_val.reshape(-1, 1), dtype=torch.float32)

    input_dim = X_train.shape[1]
    model = MatchModel(input_dim)

    criterion = nn.BCELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    num_epochs = 200

    for epoch in range(num_epochs):
        model.train()
        optimizer.zero_grad()

        y_pred = model(X_train_t)
        loss = criterion(y_pred, y_train_t)
        loss.backward()
        optimizer.step()

        if (epoch + 1) % 20 == 0:
            model.eval()
            with torch.no_grad():
                y_val_pred = model(X_val_t)
                val_loss = criterion(y_val_pred, y_val_t)
                val_acc = ((y_val_pred > 0.5) == y_val_t).float().mean().item()
            print(
                f"Epoch {epoch+1}/{num_epochs} - "
                f"Train Loss: {loss.item():.4f} | "
                f"Val Loss: {val_loss.item():.4f} | "
                f"Val Acc: {val_acc:.3f}"
            )

    # Save weights to file
    torch.save(
        {
            "state_dict": model.state_dict(),
            "input_dim": input_dim,
        },
        "match_model.pt",
    )
    print("Saved model to match_model.pt")

if __name__ == "__main__":
    main()