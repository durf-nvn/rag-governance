import { Link, useNavigate } from "react-router";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
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

  const [step, setStep] = useState(1);
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
    otpCode: "",
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

  const handleRequestOTP = async () => {
    setApiError("");

    if (!isPasswordValid) {
      setApiError("Password requirements are not met.");
      return;
    }

    if (!passwordsMatch) {
      setApiError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post("http://localhost:8000/auth/send-otp", {
        email: formData.email
      });

      setStep(2);
    } catch (error: any) {
      setApiError(
        error.response?.data?.detail ||
          "Failed to send verification email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setApiError("");

    setIsLoading(true);

    try {
      await axios.post("http://localhost:8000/auth/verify-otp", {
        email: formData.email,
        otp_code: formData.otpCode
      });

      setStep(3);
    } catch (error: any) {
      setApiError(
        error.response?.data?.detail ||
          "Invalid or expired OTP."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setApiError("");

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
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#FF9501] flex-col items-center justify-center p-12 relative">
        <div className="absolute inset-0 bg-[#D97E00] opacity-20"></div>
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-xl">
              <img 
                src="/ctu-logo.png" 
                alt="CTU Logo" 
                className="h-24 w-24 object-contain" 
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            CTU-Argao Knowledge System
          </h1>
          <p className="text-2xl text-white/90 mb-3 font-medium">Cebu Technological University</p>
          <p className="text-xl text-white/80">Argao Campus</p>
          <div className="mt-10 p-5 bg-white/10 rounded-2xl backdrop-blur-md inline-block">
            <p className="text-white/90 text-base font-medium">
              RAG-Powered Knowledge Management System
            </p>
          </div>
        </div>
      </div>


      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#F5F7FA] p-8">

        <div className="w-full max-w-xl">

          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden">

            {/* PROGRESS */}
            <div className="h-1 bg-gray-100">
              <div
                className="h-full bg-[#F25C1D] transition-all duration-300"
                style={{
                  width: `${(step / 3) * 100}%`
                }}
              />
            </div>

           <div className="p-10 sm:p-12">

              {apiError && (
                <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {apiError}
                </div>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <div>

                  <h2 className="text-3xl font-bold text-[#1F2937] mb-2">
                    Create Account
                  </h2>

                 <p className="text-base text-[#6B7280] mb-8">
                    Select your institutional role to get started.
                  </p>

                  {/* ROLE */}
                  <div className="grid grid-cols-2 gap-4 mb-8">

                    {[
                      {
                        value: "STUDENT",
                        label: "Student",
                        icon: GraduationCap
                      },
                      {
                        value: "FACULTY",
                        label: "Faculty",
                        icon: User
                      }
                    ].map((option) => {
                      const Icon = option.icon;

                      const isSelected =
                        formData.role === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              role:
                                option.value as UserRole
                            })
                          }
                          className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all ${
                            isSelected
                              ? "border-[#F25C1D] bg-orange-50"
                              : "border-gray-200"
                          }`}
                        >
                          <Icon
                            className={`h-7 w-7 ${
                              isSelected
                                ? "text-[#F25C1D]"
                                : "text-gray-400"
                            }`}
                          />

                          <span className="font-semibold">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ACCOUNT DETAILS */}
                  <div className="border-t border-gray-200 pt-6 space-y-5">

                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Account Details
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Set up your login credentials securely.
                      </p>
                    </div>

                    {/* FULL NAME */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Full Name *
                      </label>

                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value
                            })
                          }
                          placeholder="Juan Dela Cruz"
                          className="w-full pl-10 pr-4 py-4 text-base rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] outline-none focus:ring-2 focus:ring-[#F25C1D]"
                        />
                      </div>
                    </div>

                    {/* EMAIL */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email Address *
                      </label>

                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email: e.target.value
                            })
                          }
                          placeholder="your.email@ctu.edu.ph"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F7FA] border border-gray-200 outline-none focus:ring-2 focus:ring-[#F25C1D]"
                        />
                      </div>
                    </div>

                    {/* PASSWORD */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Password *
                      </label>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value
                            })
                          }
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F5F7FA] border border-gray-200 outline-none focus:ring-2 focus:ring-[#F25C1D]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Confirm Password *
                      </label>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            formData.confirmPassword
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword:
                                e.target.value
                            })
                          }
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F5F7FA] border border-gray-200 outline-none focus:ring-2 focus:ring-[#F25C1D]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleRequestOTP}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-[#FF9501] hover:bg-[#D97E00] text-white font-semibold hover:bg-[#D94E16]"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : (
                        "Continue Verification"
                      )}
                    </button>

                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
               <div className="space-y-6">

                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-sm text-gray-500"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                      <ShieldCheck className="h-8 w-8 text-[#F25C1D]" />
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900">
                      Verify your email
                    </h2>

                    <p className="text-gray-500 mt-2">
                      Enter the 6-digit code sent to
                    </p>

                    <p className="font-semibold text-gray-800">
                      {formData.email}
                    </p>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={formData.otpCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        otpCode: e.target.value
                      })
                    }
                    placeholder="000000"
                    className="w-full text-center tracking-[1em] text-2xl font-bold py-4 rounded-xl bg-[#F5F7FA] border border-gray-200 outline-none focus:ring-2 focus:ring-[#F25C1D]"
                  />

                  <button
                    onClick={handleVerifyOTP}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-[#F25C1D] text-white font-semibold"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      "Verify Code"
                    )}
                  </button>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-5">

                  <h2 className="text-3xl font-bold text-gray-900">
                    Academic Profile
                  </h2>

                  <select
                        title="Select College"
                        aria-label="Select College"
                        value={formData.selectedCollege}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectedCollege:
                          e.target.value,
                        course: ""
                      })
                    }
                   className="w-full py-4 px-4 text-base rounded-xl bg-[#F5F7FA] border border-[#E5E7EB] focus:ring-2 focus:ring-[#F25C1D]"
                  >
                    <option value="">
                      Select College
                    </option>

                    {academicPrograms.map((c) => (
                      <option
                        key={c.college}
                        value={c.college}
                      >
                        {c.college}
                      </option>
                    ))}
                  </select>

                 <select
                    title="Select Program"
                    aria-label="Select Program"
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        course: e.target.value
                      })
                    }
                    className="w-full py-3 px-4 rounded-xl bg-[#F5F7FA] border border-gray-200"
                  >
                    <option value="">
                      Select Program
                    </option>

                    {currentCollegePrograms.map((p) => (
                      <option
                        key={p.value}
                        value={p.value}
                      >
                        {p.label}
                      </option>
                    ))}
                  </select>

                  {formData.role === "STUDENT" && (
                    <select
                      title="Select Year Level"
                      aria-label="Select Year Level"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          year: e.target.value
                        })
                      }
                      className="w-full py-3 px-4 rounded-xl bg-[#F5F7FA] border border-gray-200"
                    >
                      <option value="">
                        Select Year
                      </option>

                      {years.map((y) => (
                        <option
                          key={y}
                          value={y}
                        >
                          {y}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label="Agree to Terms and Conditions"
                      title="Agree to Terms and Conditions"
                      checked={formData.agreeToTerms}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          agreeToTerms:
                            e.target.checked
                        })
                      }
                    />

                    <p className="text-sm text-gray-600">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() =>
                          setShowTermsModal(true)
                        }
                        className="text-[#F25C1D] font-semibold"
                      >
                        Terms and Conditions
                      </button>
                    </p>
                  </div>

                  <button
                    onClick={handleFinalSubmit}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-[#006837] text-white font-semibold"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">

                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-[#F25C1D] font-semibold"
                  >
                    Sign in
                  </Link>
                </p>

                <div className="mt-3">
                  <Link
                    to="/"
                    className="text-sm text-[#F25C1D]"
                  >
                    ← Back to Home
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">

          <div className="bg-white rounded-3xl max-w-2xl w-full p-8">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Terms and Conditions
              </h2>

             <button
              type="button"
              title="Close"
              aria-label="Close"
              onClick={() => setShowTermsModal(false)}
            >
              <X className="h-5 w-5" />
            </button>
            </div>

            <p className="text-gray-600 mb-6">
              By creating an account, you agree
              to follow the university policies and
              responsible usage of this system.
            </p>

            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  agreeToTerms: true
                });

                setShowTermsModal(false);
              }}
              className="px-6 py-3 rounded-xl bg-[#F25C1D] text-white font-semibold"
            >
              I Agree
            </button>

          </div>
        </div>
      )}
    </div>
  );
}