import { Link, useNavigate } from "react-router";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

import { useState } from "react";
import axios from "axios";
import { useRole } from "../contexts/RoleContext";
import type { UserRole } from "../contexts/RoleContext";

const academicPrograms = [
  {
    college: "College of Education (COEd)",
    programs: [
      { value: "BEED", label: "Bachelor of Elementary Education" },
      { value: "BSED_MATH", label: "BSEd major in Mathematics" },
      { value: "BSED_ENGLISH", label: "BSEd major in English" },
      { value: "BTLED_HE", label: "BTLEd major in Home Economics" }
    ]
  },
  {
    college: "College of Arts and Sciences (CAS)",
    programs: [
      { value: "AB_ELS", label: "BA in English Language Studies" },
      { value: "AB_LIT", label: "BA in Literature" },
      { value: "AB_PSYCH", label: "BA in Psychology" }
    ]
  },
  {
    college: "College of Technology and Engineering (COTE)",
    programs: [
      { value: "BSIE", label: "BS in Industrial Engineering" },
      { value: "BSIT", label: "BS in Information Technology" }
    ]
  }
];

const years = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Irregular",
  "Graduate / Alumni"
];

export function SignUpPage() {
  const navigate = useNavigate();
  const { setUserRole } = useRole();

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    role: "STUDENT" as UserRole,
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    selectedCollege: "",
    course: "",
    year: "",
    agreeToTerms: false
  });

  const currentCollegePrograms =
    academicPrograms.find(
      (c) => c.college === formData.selectedCollege
    )?.programs || [];

  const pwdChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password)
  };

  const isPasswordValid =
    pwdChecks.length &&
    pwdChecks.uppercase &&
    pwdChecks.number &&
    pwdChecks.special;

  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.password.length > 0;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!formData.fullName.trim() || !formData.email.trim()) {
      setApiError("Please fill in your name and email address.");
      return;
    }

    if (!isPasswordValid) {
      setApiError("Password must be 8+ characters with an uppercase letter, a number, and a special character.");
      return;
    }

    if (!passwordsMatch) {
      setApiError("Passwords do not match.");
      return;
    }

    if (!formData.selectedCollege || !formData.course) {
      setApiError("Please select your college and program.");
      return;
    }

    if (formData.role === "STUDENT" && !formData.year) {
      setApiError("Please select your year level.");
      return;
    }

    if (!formData.agreeToTerms) {
      setApiError("Please agree to the Terms and Conditions.");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post("http://localhost:8000/register", {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        full_name: formData.fullName,
        course:
          formData.role === "STUDENT"
            ? formData.course
            : null,
        year:
          formData.role === "STUDENT"
            ? formData.year
            : null,
        department:
          formData.role === "FACULTY"
            ? formData.course
            : null
      });

      setUserRole(formData.role);

      navigate("/login");
    } catch (error: any) {
      setApiError(
        error.response?.data?.detail ||
          "Registration failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden relative">
      {/* Back to Home */}
      <Link
        to="/"
        aria-label="Back to Home"
        className="group absolute top-6 left-6 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md hover:border-[#FF9501] transition-all"
      >
        <ArrowRight className="h-5 w-5 rotate-180 text-[#D97E00] transition-transform duration-300 group-hover:-translate-x-0.5" />
      </Link>

     {/* Left Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-white flex-col items-center justify-center p-12 relative overflow-hidden">
       
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/ctu-logo.png" 
              alt="CTU Logo" 
              className="h-28 w-28 object-contain" 
            />
          </div>
          <h1 className="text-5xl font-bold text-[#dd7230] mb-6 leading-tight">
            CTU-Argao Knowledge System
          </h1>
          <p className="text-2xl text-[#dd7230] mb-3 font-medium">Cebu Technological University</p>
          <p className="text-xl text-[#dd7230]/80">Argao Campus</p>
          <div className="mt-10 p-5 bg-[#FFF4E5] border border-[#FFE0B2] rounded-2xl inline-block">
            <p className="text-[#dd7230] text-base font-medium">
              RAG-Powered Knowledge Management System
            </p>
          </div>
        </div>
      </div>

      {/* Right Sign Up Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-white h-screen">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-10 sm:p-12">
          <div className="lg:hidden text-center mb-4">
            <div className="flex justify-center mb-3">
              <img
                src="/ctu-logo.png"
                alt="CTU Logo"
                className="h-12 w-12 object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-[#1F2937]">CTU Argao Knowledge System</h1>
          </div>

          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#1F2937]">Create Account</h2>
          </div>

          {apiError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{apiError}</p>
            </div>
          )}

          <form
            onSubmit={handleCreateAccount}
            className={formData.role === "STUDENT" ? "space-y-3.5" : "space-y-6"}
          >
            {/* ROLE */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "STUDENT", label: "Student", icon: GraduationCap },
                { value: "FACULTY", label: "Faculty", icon: User }
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = formData.role === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        role: option.value as UserRole
                      })
                    }
                    className={`rounded-xl border-2 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#dd7230] bg-[#FFF4E5]"
                        : "border-[#E5E7EB] hover:border-[#FFD9B3]"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? "text-[#dd7230]" : "text-[#9CA3AF]"
                      }`}
                    />
                    <span
                      className={`font-semibold text-sm ${
                        isSelected ? "text-[#dd7230]" : "text-[#6B7280]"
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* FULL NAME + EMAIL */}
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1.5 text-[#1F2937]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Juan Dela Cruz"
                    className="w-full pl-10 pr-3 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-base text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[#1F2937]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your.email@ctu.edu.ph"
                    className="w-full pl-10 pr-3 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-base text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* PASSWORD + CONFIRM PASSWORD */}
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[#1F2937]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-base text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition-colors focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5 text-[#1F2937]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-base text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition-colors focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#9CA3AF] -mt-1.5">
              8+ characters, with an uppercase letter, a number, and a special character.
            </p>

            {/* COLLEGE + PROGRAM */}
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#1F2937]">
                  College
                </label>
                <select
                  title="Select College"
                  aria-label="Select College"
                  value={formData.selectedCollege}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      selectedCollege: e.target.value,
                      course: ""
                    })
                  }
                  className="w-full py-3 px-3.5 text-base rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow"
                >
                  <option value="">Select College</option>
                  {academicPrograms.map((c) => (
                    <option key={c.college} value={c.college}>
                      {c.college}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#1F2937]">
                  Program
                </label>
                <select
                  title="Select Program"
                  aria-label="Select Program"
                  value={formData.course}
                  onChange={(e) =>
                    setFormData({ ...formData, course: e.target.value })
                  }
                  disabled={!formData.selectedCollege}
                  className="w-full py-3 px-3.5 text-base rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Select Program</option>
                  {currentCollegePrograms.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* YEAR LEVEL (students only) */}
            {formData.role === "STUDENT" && (
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#1F2937]">
                  Year Level
                </label>
                <select
                  title="Select Year Level"
                  aria-label="Select Year Level"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  className="w-full py-3 px-3.5 text-base rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow"
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* TERMS */}
            <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  aria-label="Agree to Terms and Conditions"
                  title="Agree to Terms and Conditions"
                  checked={formData.agreeToTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, agreeToTerms: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-[#E5E7EB] text-[#dd7230] focus:ring-[#dd7230] cursor-pointer transition-colors flex-shrink-0"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-[#6B7280] cursor-pointer">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-[#dd7230] font-semibold hover:underline cursor-pointer"
                  >
                    Terms and Conditions
                  </button>
                </label>
            </div>

            {/* CREATE ACCOUNT */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-1 bg-[#dd7230] text-white rounded-xl hover:bg-[#c4622a] transition-colors font-bold text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-3.5 text-center pt-3.5 border-t border-[#E5E7EB]">
            <p className="text-sm text-[#6B7280]">
              Already have an account?{" "}
              <Link to="/login" className="text-[#dd7230] hover:text-[#995900] hover:underline font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[#E5E7EB]">
              <h3 className="text-xl font-bold text-[#1F2937]">Terms and Conditions</h3>
              <button
                type="button"
                title="Close"
                aria-label="Close"
                onClick={() => setShowTermsModal(false)}
                className="text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto">
              <p className="text-base text-[#6B7280] mb-6">
                By creating an account, you agree to follow the university policies and
                responsible usage of this system.
              </p>

              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, agreeToTerms: true });
                  setShowTermsModal(false);
                }}
                className="w-full py-4 bg-[#dd7230] text-white rounded-xl hover:bg-[#c4622a] font-bold text-lg shadow-md hover:shadow-lg cursor-pointer active:scale-[0.98] transition-all"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}