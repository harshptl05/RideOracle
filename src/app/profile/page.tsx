"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, ArrowLeft, User, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveUserProfile, getCurrentUserId, loadUserProfile, UserProfile } from "@/utils/userProfile";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<"personal" | "financial">("personal");
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    user_id: "",
    name: "",
    email: "",
    phone: "",
    ssn_placeholder: "",
    annual_income: "",
    employment_status: "",
    down_payment: "",
    loan_term_preference: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const userId = getCurrentUserId();
    setFormData((prev) => ({ ...prev, user_id: userId }));
    
    // Load existing profile (only personal + financial info for profile page)
    loadUserProfile(userId).then((profile) => {
      if (profile) {
        setFormData({
          user_id: profile.user_id || userId,
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          ssn_placeholder: profile.ssn_placeholder || "",
          annual_income: profile.annual_income || "",
          employment_status: profile.employment_status || "",
          down_payment: profile.down_payment || "",
          loan_term_preference: profile.loan_term_preference || "",
          // Lifestyle preferences are NOT part of the profile form - they're collected by chatbot
        });
      }
    });
  }, []);

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.phone) {
      setCurrentSection("financial");
    }
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.annual_income && formData.employment_status && formData.down_payment && formData.loan_term_preference) {
      setIsSaving(true);
      setSaveSuccess(false);
      try {
        await saveUserProfile(formData as UserProfile);
        setSaveSuccess(true);
        
        // Trigger a custom event to notify other components that profile was saved
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profileSaved'));
        }
        
        // Show success message for 2 seconds before redirecting
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save profile. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-white/20 rounded-2xl p-6">
              <h1 className="text-3xl font-semibold text-white mb-2">Create Your Profile</h1>
              <p className="text-sm text-white/60">Help us personalize your experience</p>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-300 text-sm"
                >
                  ✓ Profile saved successfully! Redirecting...
                </motion.div>
              )}
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCurrentSection("personal")}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                currentSection === "personal"
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <User className="w-4 h-4" />
              Personal Info
            </button>
            <button
              onClick={() => setCurrentSection("financial")}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                currentSection === "financial"
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Financial Info
            </button>
          </div>

          {/* Personal Information Form */}
          {currentSection === "personal" && (
            <form onSubmit={handlePersonalSubmit} className="bg-gray-900/50 backdrop-blur-sm border border-white/20 rounded-2xl p-6 space-y-5">
              <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
              
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

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                Continue to Financial Info
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </form>
          )}

          {/* Financial Information Form */}
          {currentSection === "financial" && (
            <form onSubmit={handleFinancialSubmit} className="bg-gray-900/50 backdrop-blur-sm border border-white/20 rounded-2xl p-6 space-y-5">
              <h2 className="text-xl font-semibold text-white mb-4">Financial Information</h2>
              
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  SSN Placeholder (for credit verification) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ssn_placeholder || ""}
                  onChange={(e) => setFormData({ ...formData, ssn_placeholder: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                  placeholder="XXX-XX-XXXX (placeholder for credit score lookup)"
                  required
                />
                <p className="text-xs text-white/50 mt-1">Used as placeholder identifier for credit score verification (privacy compliant)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Annual Income <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.annual_income || ""}
                  onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors [&>option]:bg-gray-900 [&>option]:text-white"
                  required
                  style={{ color: formData.annual_income ? '#ffffff' : 'rgba(255, 255, 255, 0.4)' }}
                >
                  <option value="" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Select...</option>
                  <option value="under_30k" style={{ color: '#ffffff' }}>Under $30,000</option>
                  <option value="30k_50k" style={{ color: '#ffffff' }}>$30,000 - $50,000</option>
                  <option value="50k_75k" style={{ color: '#ffffff' }}>$50,000 - $75,000</option>
                  <option value="75k_100k" style={{ color: '#ffffff' }}>$75,000 - $100,000</option>
                  <option value="100k_150k" style={{ color: '#ffffff' }}>$100,000 - $150,000</option>
                  <option value="over_150k" style={{ color: '#ffffff' }}>Over $150,000</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Employment Status <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.employment_status || ""}
                  onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors [&>option]:bg-gray-900 [&>option]:text-white"
                  required
                  style={{ color: formData.employment_status ? '#ffffff' : 'rgba(255, 255, 255, 0.4)' }}
                >
                  <option value="" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Select...</option>
                  <option value="full-time" style={{ color: '#ffffff' }}>Full-time</option>
                  <option value="part-time" style={{ color: '#ffffff' }}>Part-time</option>
                  <option value="self-employed" style={{ color: '#ffffff' }}>Self-employed</option>
                  <option value="unemployed" style={{ color: '#ffffff' }}>Unemployed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Down Payment Amount <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.down_payment || ""}
                  onChange={(e) => setFormData({ ...formData, down_payment: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                  placeholder="$5,000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Loan Term Preference <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.loan_term_preference || ""}
                  onChange={(e) => setFormData({ ...formData, loan_term_preference: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors [&>option]:bg-gray-900 [&>option]:text-white"
                  required
                  style={{ color: formData.loan_term_preference ? '#ffffff' : 'rgba(255, 255, 255, 0.4)' }}
                >
                  <option value="" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Select...</option>
                  <option value="36" style={{ color: '#ffffff' }}>36 months</option>
                  <option value="48" style={{ color: '#ffffff' }}>48 months</option>
                  <option value="60" style={{ color: '#ffffff' }}>60 months</option>
                  <option value="72" style={{ color: '#ffffff' }}>72 months</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentSection("personal")}
                  className="flex-1 px-6 py-3 bg-white/5 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-center"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
