"use client";

import React, { useState } from "react";


export default function MatchScore() {
  const [form, setForm] = useState({
    car_price: 28000,
    user_budget: 30000,
    car_mpg: 32,
    desired_mpg: 30,
    avg_star_rating: 4.5,
    avg_sentiment: 0.7,
  });

  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // Simulate calling a backend ML model (FastAPI + PyTorch)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Pretend this is your linear neural net output
    // Simulate sigmoid(w·x + b)
    const linearCombo =
      form.avg_star_rating * 0.3 +
      form.avg_sentiment * 0.4 -
      (form.car_price - form.user_budget) / 100000 +
      (form.car_mpg - form.desired_mpg) * 0.05;

    const sigmoid = 1 / (1 + Math.exp(-linearCombo));
    const mockScore = Math.round(sigmoid * 100);

    // Simulate "network call delay"
    await new Promise((resolve) => setTimeout(resolve, 800));

    setScore(mockScore);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Car Match Score</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Car Price ($)</label>
          <input
            type="number"
            name="car_price"
            value={form.car_price}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Your Budget ($)</label>
          <input
            type="number"
            name="user_budget"
            value={form.user_budget}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Car MPG</label>
          <input
            type="number"
            name="car_mpg"
            value={form.car_mpg}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Desired MPG</label>
          <input
            type="number"
            name="desired_mpg"
            value={form.desired_mpg}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Avg Star Rating</label>
          <input
            type="number"
            name="avg_star_rating"
            step="0.1"
            value={form.avg_star_rating}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Avg Sentiment</label>
          <input
            type="number"
            name="avg_sentiment"
            step="0.1"
            value={form.avg_sentiment}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
        >
          {loading ? "Calculating..." : "Get Match Score"}
        </button>
      </form>

      {score !== null && (
        <div className="mt-5 text-center">
          <p className="text-lg font-semibold">
            Match Score: <span className="text-blue-600">{score}%</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            (Calculated via linear neural network + sigmoid activation)
          </p>
        </div>
      )}
    </div>
  );
}
