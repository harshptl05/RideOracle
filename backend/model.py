# backend/model.py

import torch
import torch.nn as nn

class MatchModel(nn.Module):
    def __init__(self, input_dim: int):
        super().__init__()
        # Linear: w·x + b
        self.linear = nn.Linear(input_dim, 1)

    def forward(self, x):
        # Sigmoid to get 0–1 match score
        return torch.sigmoid(self.linear(x))