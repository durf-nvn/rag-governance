import { Link, useNavigate, useLocation } from "react-router";
import { ArrowRight, AlertCircle, Mail, Lock, X, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRole } from "../contexts/RoleContext";
import ResetPasswordModal from "../components/ResetPasswordModal";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserRole } = useRole();
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateEmail, setUpdateEmail] = useState("");

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const showReset = params.get("showReset");
    const email = params.get("email");

    if (showReset === "true" && email) {
      setUpdateEmail(email);
      setIsUpdateModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setIsLoading(true);

    const formBody = new URLSearchParams();
    formBody.append('username', formData.email);
    formBody.append('password', formData.password);

    try {
      const response = await axios.post("http://localhost:8000/login", formBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
      });

      if (rememberMe) {
        sessionStorage.setItem("rememberedEmail", formData.email);
      } else {
        sessionStorage.removeItem("rememberedEmail");
      }

      // Security Hardening: Token is stored safely in HttpOnly cookie by backend.
      // Store non-sensitive user metadata for UI display only.
      sessionStorage.setItem('userName', response.data.full_name);
      sessionStorage.setItem('userEmail', response.data.email);
      sessionStorage.setItem('userRole', response.data.role);
      sessionStorage.setItem('userDepartment', response.data.department);
      
      setUserRole(response.data.role);
      navigate("/app");
      
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetStatus(null);
    try {
      const response = await axios.post("http://localhost:8000/send-reset-email", { email: resetEmail });
      setResetStatus({ type: 'success', msg: response.data.message });
    } catch (error: any) {
      setResetStatus({ type: 'error', msg: error.response?.data?.detail || "Failed to send reset email." });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f0] flex overflow-hidden">

        {/* Back to Home */}
      <Link
        to="/"
        aria-label="Back to Home"
        className="group absolute top-10 left-10 z-19 w-11 h-11 flex items-center justify-center rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md hover:border-[#FF9501] transition-all"
      >
        <ArrowRight className="h-7 w-7 rotate-180 text-[#D97E00] transition-transform duration-300 group-hover:-translate-x-0.5" />
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

      {/* Right Login Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-10 sm:p-12">
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-5">
              <img 
                src="/ctu-logo.png" 
                alt="CTU Logo" 
                className="h-16 w-16 object-contain" 
              />
            </div>
            <h1 className="text-2xl font-bold text-[#1F2937]">CTU Argao Knowledge System</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1F2937] mb-3">Sign in</h2>
            <p className="text-base text-[#6B7280]">to continue to the CTU Argao Knowledge System</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-base font-medium mb-2 text-[#1F2937]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#6B7280]" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-base text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow"
                  placeholder="your.email@ctu.edu.ph"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-medium mb-2 text-[#1F2937]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#6B7280]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-base text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {apiError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-3 w-5 h-5 rounded border-[#E5E7EB] text-[#FF9501] focus:ring-[#FF9501] cursor-pointer transition-colors" 
                />
                <span className="text-base text-[#6B7280] select-none group-hover:text-[#1F2937] transition-colors">Remember me</span>
              </label>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(true)}
                className="text-base text-[#dd7230] hover:text-[#995900] hover:underline font-semibold cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-2 bg-[#dd7230] text-white rounded-xl transition-colors font-bold text-lg shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-[#E5E7EB] space-y-5">
            <p className="text-base text-[#6B7280]">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#dd7230] hover:text-[#995900] hover:underline font-bold transition-colors">
                Sign up here
              </Link>
            </p>
            <div>
              
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Request Email Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[#E5E7EB]">
              <h3 className="text-xl font-bold text-[#1F2937]">Reset Password</h3>
              <button onClick={() => { setIsModalOpen(false); setResetStatus(null); }} className="text-[#6B7280] hover:text-[#1F2937] cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleForgotPassword} className="p-6 sm:p-8 space-y-6">
              <p className="text-base text-[#6B7280]">Enter your email address and we'll send you a link to reset your password.</p>
              
              {resetStatus && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${resetStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {resetStatus.type === 'success' ? <CheckCircle2 className="h-6 w-6 flex-shrink-0" /> : <AlertCircle className="h-6 w-6 flex-shrink-0" />}
                  <p className="text-sm font-medium">{resetStatus.msg}</p>
                </div>
              )}

              <div>
                <label className="block text-base font-medium mb-2 text-[#1F2937]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#6B7280]" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#dd7230] transition-shadow"
                    placeholder="your.email@ctu.edu.ph"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-4 bg-[#dd7230] text-white rounded-xl  font-bold text-lg shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center cursor-pointer active:scale-[0.98] transition-all"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: The actual Update Password Modal (triggered from Gmail) */}
      <ResetPasswordModal 
        isOpen={isUpdateModalOpen} 
        email={updateEmail} 
        onClose={() => setIsUpdateModalOpen(false)} 
      />
    </div>
  );
}