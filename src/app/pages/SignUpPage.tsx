import { Link, useNavigate } from "react-router";
import { GraduationCap, User, Mail, Lock, X, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle, ShieldAlert, Check, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
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
      { value: "BSIT", label: "BS in Information Technology" },
      { value: "BIT_AUTO", label: "BIT major in Automotive Technology" },
      { value: "BIT_COMP", label: "BIT major in Computer Technology" },
      { value: "BIT_DRAFT", label: "BIT major in Drafting Technology" },
      { value: "BIT_ELEC", label: "BIT major in Electronics Technology" },
      { value: "BIT_GARM", label: "BIT major in Garments Technology" }
    ]
  },
  {
    college: "College of Agriculture, Forestry, and Environmental Sciences (CAFE)",
    programs: [
      { value: "BSF", label: "Bachelor of Science in Forestry" },
      { value: "BSES", label: "BS in Environmental Science" },
      { value: "BSA", label: "BS in Agriculture" }
    ]
  }
];

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Irregular", "Graduate / Alumni", "Other"];

export function SignUpPage() {
  const navigate = useNavigate();
  const { setUserRole } = useRole();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // --- NEW: UI States ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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

  const pwdChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password)
  };
  
  const isPasswordValid = pwdChecks.length && pwdChecks.uppercase && pwdChecks.number && pwdChecks.special;
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  const currentCollegePrograms = academicPrograms.find(c => c.college === formData.selectedCollege)?.programs || [];

  const handleRequestOTP = async () => {
    setApiError("");
    
    if (!isPasswordValid) {
      setApiError("Please ensure your password meets all requirements.");
      return;
    }
    if (!passwordsMatch) {
      setApiError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("http://localhost:8000/auth/send-otp", { email: formData.email });
      setStep(3); 
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Failed to send verification email. Ensure database is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setApiError("");
    if (formData.otpCode.length !== 6) {
      setApiError("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("http://localhost:8000/auth/verify-otp", { 
        email: formData.email, 
        otp_code: formData.otpCode 
      });
      setStep(4); 
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setApiError("");
    if (!formData.course) {
      setApiError("Please select a specific program/department.");
      return;
    }
    if (formData.role === "STUDENT" && !formData.year) {
      setApiError("Please select your year level.");
      return;
    }
    if (!formData.agreeToTerms) {
      setApiError("You must agree to the Terms and Conditions.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("http://localhost:8000/register", {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        full_name: formData.fullName, 
        course: formData.role === "STUDENT" ? formData.course : null, 
        year: formData.role === "STUDENT" ? formData.year : null,
        department: formData.role === "FACULTY" ? formData.course : null  
      });

      setUserRole(formData.role);
      navigate("/login");
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Registration failed. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden selection:bg-[#1D6FA3] selection:text-white">
      
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F5F7FA]">
        <div className="w-full max-w-md">
          
          <div className="lg:hidden text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#1D6FA3] rounded-xl flex items-center justify-center">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-[#1F2937]">CTU Knowledge System</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
            
            <div className="flex h-1.5 bg-gray-100">
              <div className="bg-[#1D6FA3] h-full transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>

            <div className="p-8">
              {apiError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> <span className="leading-tight">{apiError}</span>
                </div>
              )}

              {/* STEP 1: ROLE SELECTION */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                  <p className="text-sm text-gray-500 mb-6">Select your institutional role to get started.</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                      { value: "STUDENT", label: "Student", icon: GraduationCap },
                      { value: "FACULTY", label: "Faculty", icon: User }
                    ].map((option) => {
                      const OptionIcon = option.icon;
                      const isSelected = formData.role === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFormData({ ...formData, role: option.value as UserRole })}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${
                            isSelected ? "border-[#1D6FA3] bg-blue-50/50 text-[#1D6FA3]" : "border-gray-100 hover:border-gray-200 text-gray-500"
                          }`}
                        >
                          <OptionIcon className={`h-6 w-6 ${isSelected ? "text-[#1D6FA3]" : "text-gray-400"}`} />
                          <span className={`text-sm font-semibold ${isSelected ? "text-gray-900" : "text-gray-500"}`}>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => { setApiError(""); setStep(2); }} className="w-full py-3 bg-[#1D6FA3] text-white font-medium rounded-xl hover:bg-[#0B3C5D] transition-colors cursor-pointer flex justify-center items-center gap-2">
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: ACCOUNT DETAILS */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                  <button onClick={() => { setApiError(""); setStep(1); }} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2 cursor-pointer w-max">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Account Details</h2>
                  <p className="text-sm text-gray-500 mb-4">Set up your login credentials securely.</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent outline-none transition-all" placeholder="Juan Dela Cruz" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent outline-none transition-all" placeholder="your.email@ctu.edu.ph" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        className="w-full pl-10 pr-10 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent outline-none transition-all" 
                        placeholder="••••••••" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* --- DYNAMIC DISAPPEARING PASSWORD CHECKLIST --- */}
                    {isPasswordFocused && !isPasswordValid && (
                      <div className="grid grid-cols-2 gap-2 mt-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100 animate-in fade-in duration-200">
                        <span className="col-span-2 text-xs font-semibold text-[#1D6FA3] mb-1">Password must contain:</span>
                        {!pwdChecks.length && <div className="flex items-center gap-1.5 text-xs text-gray-500"><X className="h-3 w-3 text-red-400" /> Min 8 characters</div>}
                        {!pwdChecks.uppercase && <div className="flex items-center gap-1.5 text-xs text-gray-500"><X className="h-3 w-3 text-red-400" /> 1 Uppercase letter</div>}
                        {!pwdChecks.number && <div className="flex items-center gap-1.5 text-xs text-gray-500"><X className="h-3 w-3 text-red-400" /> 1 Number</div>}
                        {!pwdChecks.special && <div className="flex items-center gap-1.5 text-xs text-gray-500"><X className="h-3 w-3 text-red-400" /> 1 Special Char</div>}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required 
                        value={formData.confirmPassword} 
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                        className="w-full pl-10 pr-10 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent outline-none transition-all" 
                        placeholder="••••••••" 
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword.length > 0 && (
                      <p className={`text-xs mt-1.5 font-medium ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                        {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={handleRequestOTP} 
                      disabled={isLoading || !formData.fullName || !formData.email || !isPasswordValid || !passwordsMatch} 
                      className="w-full py-3 bg-[#1D6FA3] text-white font-medium rounded-xl hover:bg-[#0B3C5D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center gap-2"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to Verification"}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: OTP VERIFICATION */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4 text-center">
                   <button onClick={() => { setApiError(""); setStep(2); }} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2 cursor-pointer w-max">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="h-8 w-8 text-[#1D6FA3]" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Verify your email</h2>
                  <p className="text-sm text-gray-500 mb-6">We sent a 6-digit code to <strong className="text-gray-800">{formData.email}</strong>.</p>

                  <div>
                    <input 
                      type="text" 
                      maxLength={6} 
                      required
                      value={formData.otpCode} 
                      onChange={(e) => setFormData({...formData, otpCode: e.target.value.replace(/\D/g, '')})} 
                      className="w-full text-center tracking-[1em] text-2xl font-bold py-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent outline-none transition-all mb-6" 
                      placeholder="000000" 
                    />
                  </div>

                  <button 
                    onClick={handleVerifyOTP} 
                    disabled={isLoading || formData.otpCode.length !== 6} 
                    className="w-full py-3 bg-[#1D6FA3] text-white font-medium rounded-xl hover:bg-[#0B3C5D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
                  </button>
                </div>
              )}

              {/* STEP 4: ACADEMIC PROFILE */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Academic Profile</h2>
                  <p className="text-sm text-gray-500 mb-6">Final step! Tell us about your academic placement.</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select College <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={formData.selectedCollege} 
                      onChange={(e) => setFormData({...formData, selectedCollege: e.target.value, course: ""})} 
                      className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent outline-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>Choose your college...</option>
                      {academicPrograms.map(c => <option key={c.college} value={c.college}>{c.college}</option>)}
                    </select>
                  </div>

                  {formData.selectedCollege && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Program / Department <span className="text-red-500">*</span></label>
                      <select 
                        required
                        value={formData.course} 
                        onChange={(e) => setFormData({...formData, course: e.target.value})} 
                        className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent outline-none transition-all cursor-pointer"
                      >
                        <option value="" disabled>Choose specific program...</option>
                        {currentCollegePrograms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                  )}

                  {formData.role === "STUDENT" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Level <span className="text-red-500">*</span></label>
                      <select 
                        required
                        value={formData.year} 
                        onChange={(e) => setFormData({...formData, year: e.target.value})} 
                        className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent outline-none transition-all cursor-pointer"
                      >
                        <option value="" disabled>Select Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <input 
                        type="checkbox" 
                        required
                        id="terms" 
                        checked={formData.agreeToTerms} 
                        onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})} 
                        className="mt-1 mr-3 w-4 h-4 text-[#1D6FA3] rounded border-gray-300 focus:ring-[#1D6FA3] cursor-pointer" 
                      />
                      <label htmlFor="terms" className="text-xs text-gray-600 select-none">
                        I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#1D6FA3] hover:underline font-medium cursor-pointer">Terms and Conditions</button> for institutional data access.
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={handleFinalSubmit} 
                      disabled={isLoading || !formData.course || !formData.agreeToTerms || (formData.role === "STUDENT" && !formData.year)} 
                      className="w-full py-3 bg-[#006837] text-white font-medium rounded-xl hover:bg-[#00542c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center gap-2"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Registration"}
                    </button>
                  </div>
                </div>
              )}

              {/* Login Link & Back to Home */}
              <div className="mt-6 text-center pt-6 border-t border-[#E5E7EB] space-y-4">
                <p className="text-sm text-[#6B7280]">
                  Already have an account? <Link to="/login" className="text-[#1D6FA3] font-medium hover:text-[#0B3C5D] hover:underline">Sign in</Link>
                </p>
                <div>
                  <Link to="/" className="text-sm text-[#1D6FA3] hover:text-[#0B3C5D] font-medium transition-colors">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#1D6FA3]" />
                <h3 className="font-bold text-gray-900">Terms of Service & Privacy</h3>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors cursor-pointer bg-white rounded-full p-1 border border-gray-200 shadow-sm hover:bg-gray-50"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm text-gray-600 leading-relaxed">
              <section>
                <h4 className="font-bold text-gray-900 mb-1">1. Acceptance of Terms</h4>
                <p>By registering for an account on the CTU Argao Institutional Knowledge System, you agree to abide by these Terms of Service. This platform is strictly for the academic, administrative, and internal use of Cebu Technological University students, faculty, and administrators.</p>
              </section>
              <section>
                <h4 className="font-bold text-gray-900 mb-1">2. Use of Artificial Intelligence</h4>
                <p>This system utilizes a Retrieval-Augmented Generation (RAG) AI to answer questions based on official university documents. <strong>Users must always verify critical academic decisions with official university publications.</strong></p>
              </section>
              <section>
                <h4 className="font-bold text-gray-900 mb-1">3. Data Privacy Policy</h4>
                <p>In compliance with the Data Privacy Act of 2012, we collect personal identifiers (name, email, course) and system usage logs for institutional improvement. We will never sell or distribute your data.</p>
              </section>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => setShowTermsModal(false)} className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">Close</button>
              <button type="button" onClick={() => { setFormData({ ...formData, agreeToTerms: true }); setShowTermsModal(false); }} className="px-5 py-2 text-sm font-semibold bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors cursor-pointer shadow-sm">I Agree</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}