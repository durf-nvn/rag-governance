import { Link, useNavigate } from "react-router";
import { GraduationCap, Mail, KeyRound, Lock, CheckCircle2 } from "lucide-react";
import { useState } from "react";

type Step = "email" | "verify" | "reset" | "done";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) return;
    // In real app: trigger email sending here
    setStep("verify");
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    // In real app: validate code with backend
    setStep("reset");
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // In real app: submit new password here
    setStep("done");
  };

  const stepConfig = [
    { key: "email", label: "Email" },
    { key: "verify", label: "Verify" },
    { key: "reset", label: "Reset" },
  ];

  const currentStepIndex = stepConfig.findIndex(s => s.key === step);

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

      {/* Right Side */}
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

          <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-8">

            {/* Step Indicator */}
            {step !== "done" && (
              <div className="flex items-center justify-center mb-8">
                {stepConfig.map((s, i) => (
                  <div key={s.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        i < currentStepIndex
                          ? "bg-[#1D6FA3] text-white"
                          : i === currentStepIndex
                          ? "bg-[#1D6FA3] text-white ring-4 ring-[#1D6FA3]/20"
                          : "bg-[#E5E7EB] text-[#9CA3AF]"
                      }`}>
                        {i < currentStepIndex ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs mt-1 font-medium ${
                        i <= currentStepIndex ? "text-[#1D6FA3]" : "text-[#9CA3AF]"
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {i < stepConfig.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 mb-4 transition-colors ${
                        i < currentStepIndex ? "bg-[#1D6FA3]" : "bg-[#E5E7EB]"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Step 1 — Email */}
            {step === "email" && (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-[#E3F2FD] rounded-xl flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-[#1D6FA3]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1F2937] mb-2">Forgot Password</h2>
                  <p className="text-sm text-[#6B7280]">
                    Enter your email address and we'll send you a verification code.
                  </p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-5">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                        placeholder="your.email@ctu.edu.ph"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors font-medium"
                  >
                    Send Verification Code
                  </button>
                </form>
              </>
            )}

            {/* Step 2 — Verify Code */}
            {step === "verify" && (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-[#E3F2FD] rounded-xl flex items-center justify-center mb-4">
                    <KeyRound className="h-6 w-6 text-[#1D6FA3]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1F2937] mb-2">Enter Verification Code</h2>
                  <p className="text-sm text-[#6B7280]">
                    We sent a 6-digit code to <span className="font-medium text-[#1F2937]">{email}</span>. Check your inbox.
                  </p>
                </div>
                <form onSubmit={handleVerifySubmit} className="space-y-5">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium mb-2 text-[#1F2937]">
                      Verification Code
                    </label>
                    <input
                      id="code"
                      type="text"
                      required
                      maxLength={6}
                      value={code}
                      onChange={(e) => { setError(""); setCode(e.target.value.replace(/\D/g, "")); }}
                      className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                      placeholder="000000"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors font-medium"
                  >
                    Verify Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="w-full py-3 text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors"
                  >
                    ← Change email address
                  </button>
                </form>
              </>
            )}

            {/* Step 3 — Reset Password */}
            {step === "reset" && (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-[#E3F2FD] rounded-xl flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-[#1D6FA3]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1F2937] mb-2">Set New Password</h2>
                  <p className="text-sm text-[#6B7280]">
                    Choose a strong password for your account.
                  </p>
                </div>
                <form onSubmit={handleResetSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#1F2937]">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => { setError(""); setPassword(e.target.value); }}
                        className="w-full pl-10 pr-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                        placeholder="Min. 8 characters"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-[#1F2937]">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                      <input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => { setError(""); setConfirmPassword(e.target.value); }}
                        className="w-full pl-10 pr-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors font-medium"
                  >
                    Reset Password
                  </button>
                </form>
              </>
            )}

            {/* Step 4 — Done */}
            {step === "done" && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-9 w-9 text-green-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-[#1F2937] mb-2">Password Reset!</h2>
                <p className="text-sm text-[#6B7280] mb-8">
                  Your password has been successfully updated. You can now sign in with your new password.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>

          {/* Back to Login */}
          {step !== "done" && (
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-[#1D6FA3] hover:text-[#0B3C5D] font-medium">
                ← Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}