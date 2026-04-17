import { Link, useNavigate } from "react-router";
import { GraduationCap, AlertCircle, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useRole } from "../contexts/RoleContext";
import type { UserRole } from "../contexts/RoleContext";

const TEST_ACCOUNTS: Record<string, UserRole> = {
  "student@ctu.edu.ph": "STUDENT",
  "faculty@ctu.edu.ph": "FACULTY",
  "admin@ctu.edu.ph": "ADMIN",
};

export function LoginPage() {
  const navigate = useNavigate();
  const { setUserRole } = useRole();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const role = TEST_ACCOUNTS[formData.email];

    if (!role) {
      setError("No account found with that email address.");
      return;
    }

    if (formData.password.length < 1) {
      setError("Please enter your password.");
      return;
    }

    setUserRole(role);
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1D6FA3] flex-col items-center justify-center p-12 relative">
        <div className="absolute inset-0 bg-[#0B3C5D] opacity-10"></div>
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <GraduationCap className="h-14 w-14 text-[#1D6FA3]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            CTU Institutional Knowledge System
          </h1>
          <p className="text-xl text-white/90 mb-3">Cebu Technological University</p>
          <p className="text-lg text-white/80">Argao Campus</p>
          <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="text-white/90 text-sm">
              RAG-Powered Knowledge Management System
            </p>
          </div>

          
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F5F7FA]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#1D6FA3] rounded-xl flex items-center justify-center">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-[#1F2937]">CTU Knowledge System</h1>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[#1F2937] mb-2">Welcome Back</h2>
              <p className="text-sm text-[#6B7280]">Sign in to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#1F2937]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => { setError(""); setFormData({ ...formData, email: e.target.value }); }}
                    className="w-full pl-10 pr-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                    placeholder="your.email@ctu.edu.ph"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#1F2937]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => { setError(""); setFormData({ ...formData, password: e.target.value }); }}
                    className="w-full pl-10 pr-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 w-4 h-4 rounded border-[#E5E7EB] text-[#1D6FA3] focus:ring-[#1D6FA3]"
                  />
                  <span className="text-sm text-[#6B7280]">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-[#1D6FA3] ...">Forgot password?</Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors font-medium"
              >
                Sign In
              </button>
            </form>

            {/* Don't have account */}
            <div className="mt-6 text-center pt-6 border-t border-[#E5E7EB]">
              <p className="text-sm text-[#6B7280]">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#1D6FA3] hover:text-[#0B3C5D] font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 bg-[#FFC107]/10 rounded-lg p-4 border-l-4 border-[#FFC107]">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#FFC107] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#1F2937]">
                <strong>Security Notice:</strong> Unauthorized access is strictly prohibited.
                All activities are logged and monitored.
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-[#1D6FA3] hover:text-[#0B3C5D] font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}