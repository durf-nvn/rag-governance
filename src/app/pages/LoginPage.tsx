import { Link, useNavigate } from "react-router";
import { GraduationCap, AlertCircle, Mail, Lock } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { useRole } from "../contexts/RoleContext";

type UserRole = "STUDENT" | "FACULTY" | "ADMIN";

const TEST_ACCOUNTS: Record<string, UserRole> = {
  "student@ctu.edu.ph": "STUDENT",
  "faculty@ctu.edu.ph": "FACULTY",
  "admin@ctu.edu.ph": "ADMIN",
};

export function LoginPage() {
  const navigate = useNavigate();
  const { setUserRole } = useRole();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setApiError("");

    const role = TEST_ACCOUNTS[formData.email];

    if (!role) {
      setError("No account found with that email address.");
      return;
    }

    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append("username", formData.email);
      formBody.append("password", formData.password);

      const response = await axios.post(
        "http://localhost:8000/login",
        formBody,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("userName", response.data.full_name);
      localStorage.setItem("userEmail", response.data.email);

      setUserRole(response.data.role);
      navigate("/app");

    } catch (err: any) {
      setApiError(
        err.response?.data?.detail || "Failed to connect to the server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side */}
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
          <p className="text-xl text-white/90 mb-3">
            Cebu Technological University
          </p>
          <p className="text-lg text-white/80">Argao Campus</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F5F7FA]">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[#1F2937] mb-2">
                Welcome Back
              </h2>
              <p className="text-sm text-[#6B7280]">
                Sign in to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* UI Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* API Error */}
              {apiError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <p className="text-sm text-red-700">{apiError}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-10 py-3 border rounded-lg"
                    placeholder="your.email@ctu.edu.ph"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-10 py-3 border rounded-lg"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#1D6FA3] text-white rounded-lg"
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}