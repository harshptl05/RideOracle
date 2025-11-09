# backend/main.py

import numpy as np
import torch
from fastapi import FastAPI
from pydantic import BaseModel

from model import MatchModel

app = FastAPI()

# ========= LOAD TRAINED MODEL =========
checkpoint = torch.load("match_model.pt", map_location="cpu")
input_dim = checkpoint["input_dim"]
model = MatchModel(input_dim)
model.load_state_dict(checkpoint["state_dict"])
model.eval()

# ========= REQUEST SCHEMA =========
class MatchRequest(BaseModel):
    # Replace / expand these with your actual quiz + financial + review inputs.
    # These are examples:
    car_price: float
    user_budget: float
    car_mpg: float
    desired_mpg: float

    avg_star_rating: float      # 0–5
    avg_sentiment: float        # e.g. -1..1 or 0..1
    num_reviews: int

    prefer_new: float           # 0–1
    prefer_used: float          # 0–1

    body_sedan: int             # 0/1
    body_suv: int               # 0/1
    # ... add any other body styles or quiz stuff you’re using ...


def build_feature_vector(req: MatchRequest) -> np.ndarray:
    """
    Convert raw request fields into the SAME feature vector you used for training.
    The order must match your training X columns.
    """

    # Example engineered features
    price_gap = (req.car_price - req.user_budget) / max(req.user_budget, 1.0)
    mpg_gap   = (req.car_mpg - req.desired_mpg) / max(req.desired_mpg, 1.0)

    # Scale / transform review features
    star_scaled = req.avg_star_rating / 5.0
    sent_scaled = (req.avg_sentiment + 1.0) / 2.0  # if -1..1 -> 0..1
    log_reviews = np.log1p(req.num_reviews)

    # Build feature array (ORDER matters!)
    x = np.array(
        [
            price_gap,
            mpg_gap,
            star_scaled,
            sent_scaled,
            log_reviews,
            req.prefer_new,
            req.prefer_used,
            req.body_sedan,
            req.body_suv,
            # ... add more in the same order as in training ...
        ],
        dtype=np.float32,
    )

    return x


@app.post("/score")
def score_car(req: MatchRequest):
    x = build_feature_vector(req)
    x_t = torch.tensor(x).unsqueeze(0)  # shape (1, D)

    with torch.no_grad():
        score = model(x_t).item()  # 0–1

    return {
        "match_score": score,
        "match_score_percent": round(score * 100),
    }