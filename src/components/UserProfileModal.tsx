"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Save } from "lucide-react";

interface UserProfile {
  user_id: string;
  name?: string;
  email?: string;
  phone?: string;
  drive_environment: string;
  weather: string;
  daily_drive: string;
  priority: string;
  passengers: string;
  budget_range?: string;
  fuel_preference?: string;
  body_type_preference?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  userId?: string;
}

export function UserProfileModal({ isOpen, onClose, onSave, userId }: UserProfileModalProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    user_id: userId || `user_${Date.now()}`,
    name: "",
    email: "",
    phone: "",
    drive_environment: "",
    weather: "",
    daily_drive: "",
    priority: "",
    passengers: "",
    budget_range: "",
    fuel_preference: "",
    body_type_preference: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.phone && formData.drive_environment && formData.weather && formData.daily_drive && formData.priority && formData.passengers) {
      await onSave(formData as UserProfile);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-gray-900 border border-white/20 rounded-2xl overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-indigo-600/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-white">Create Your Profile</h1>
                      <p className="text-sm text-white/60">Help us personalize your experience</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Drive Environment <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.drive_environment || ""}
                    onChange={(e) => setFormData({ ...formData, drive_environment: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="city">City</option>
                    <option value="suburbs">Suburbs</option>
                    <option value="rural">Rural</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Weather Conditions <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.weather || ""}
                    onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="sunny">Mostly Sunny</option>
                    <option value="rainy">Frequent Rain</option>
                    <option value="snowy">Snow/Ice</option>
                    <option value="varied">Varied</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Daily Drive Distance <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.daily_drive || ""}
                    onChange={(e) => setFormData({ ...formData, daily_drive: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="short">Short (under 20 miles)</option>
                    <option value="medium">Medium (20-50 miles)</option>
                    <option value="long">Long (50+ miles)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Priority <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.priority || ""}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="fuel_efficiency">Fuel Efficiency</option>
                    <option value="cargo_space">Cargo Space</option>
                    <option value="technology">Technology Features</option>
                    <option value="comfort">Comfort</option>
                    <option value="power">Power/Performance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Number of Passengers <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.passengers || ""}
                    onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="1-2">1-2 people</option>
                    <option value="3-4">3-4 people</option>
                    <option value="5-6">5-6 people</option>
                    <option value="7+">7+ people</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Budget Range (Optional)
                  </label>
                  <select
                    value={formData.budget_range || ""}
                    onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                  >
                    <option value="">Select...</option>
                    <option value="under_25k">Under $25,000</option>
                    <option value="25k_35k">$25,000 - $35,000</option>
                    <option value="35k_45k">$35,000 - $45,000</option>
                    <option value="45k_60k">$45,000 - $60,000</option>
                    <option value="over_60k">Over $60,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Fuel Preference (Optional)
                  </label>
                  <select
                    value={formData.fuel_preference || ""}
                    onChange={(e) => setFormData({ ...formData, fuel_preference: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                  >
                    <option value="">Select...</option>
                    <option value="gas">Gas</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="plug_in_hybrid">Plug-in Hybrid</option>
                    <option value="ev">Electric (EV)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Body Type Preference (Optional)
                  </label>
                  <select
                    value={formData.body_type_preference || ""}
                    onChange={(e) => setFormData({ ...formData, body_type_preference: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                  >
                    <option value="">Select...</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="coupe">Coupe</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-white/5 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

