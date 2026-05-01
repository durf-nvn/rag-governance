import { useState, useEffect } from "react";
import { User, Lock, Shield, CheckCircle, AlertCircle, Loader2, Mail, BookOpen, Save, LogOut, ArrowLeft } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router";

// Structured Academic Programs
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
  }
];

export function ProfileSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  
  // LocalStorage Data
  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole") || "STUDENT";
  
  // Profile State
  const [profileData, setProfileData] = useState({
    fullName: localStorage.getItem("userName") || "",
    program: localStorage.getItem("userDepartment") || ""
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error", msg: string } | null>(null);

  // Password & Modal State
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error", msg: string } | null>(null);
  
  // Countdown Modal Logic
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (logoutCountdown !== null && logoutCountdown > 0) {
      timer = setTimeout(() => setLogoutCountdown(logoutCountdown - 1), 1000);
    } else if (logoutCountdown === 0) {
      handleForceLogout();
    }
    return () => clearTimeout(timer);
  }, [logoutCountdown]);

  const handleForceLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- HANDLERS ---
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);
    setIsUpdatingProfile(true);

    try {
      const response = await axios.put("http://localhost:8000/users/profile", {
        email: userEmail,
        full_name: profileData.fullName,
        program: profileData.program
      });
      
      localStorage.setItem("userName", response.data.full_name);
      localStorage.setItem("userDepartment", response.data.program);
      
      setProfileStatus({ type: "success", msg: "Profile information updated successfully." });
    } catch (error: any) {
      setProfileStatus({ type: "error", msg: error.response?.data?.detail || "Failed to update profile." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (passwords.new !== passwords.confirm) {
      setPasswordStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }
    if (passwords.new.length < 8) {
      setPasswordStatus({ type: "error", msg: "Password must be at least 8 characters." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await axios.post("http://localhost:8000/users/change-password", {
        email: userEmail,
        current_password: passwords.current,
        new_password: passwords.new
      });
      
      // Trigger the success modal countdown
      setLogoutCountdown(5);
    } catch (error: any) {
      setPasswordStatus({ type: "error", msg: error.response?.data?.detail || "Incorrect current password." });
      setIsUpdatingPassword(false);
    } 
  };

  return (
    // FIXED OVERLAY: Covers the entire screen to hide the dashboard sidebar natively
    <div className="fixed inset-0 z-[100] bg-[#F9FAFB] overflow-y-auto w-full h-full animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto py-10 px-6 space-y-6">
        
        {/* BACK BUTTON */}
        <button 
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4 cursor-pointer w-max"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        {/* HEADER */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Account Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your personal details and security credentials.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* SIDEBAR TABS */}
          <div className="md:col-span-1 space-y-1">
            <button 
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium cursor-pointer ${
                activeTab === "profile" 
                ? "bg-[#1D6FA3]/10 text-[#1D6FA3]" 
                : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <User className="h-4 w-4" /> Profile
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium cursor-pointer ${
                activeTab === "security" 
                ? "bg-[#1D6FA3]/10 text-[#1D6FA3]" 
                : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Lock className="h-4 w-4" /> Security
            </button>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="md:col-span-3 space-y-6">
            
            {/* PROFILE SUMMARY CARD */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
              <div className="w-14 h-14 bg-[#1D6FA3] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-white">{profileData.fullName.charAt(0) || "U"}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{profileData.fullName || "CTU User"}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Mail className="h-3.5 w-3.5" /> {userEmail}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1.5 text-[#1D6FA3] font-medium">
                    <Shield className="h-3.5 w-3.5" /> {userRole}
                  </span>
                </div>
              </div>
            </div>

            {/* TAB CONTENT: PROFILE */}
            {activeTab === "profile" ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-700 text-sm">Personal Information</h3>
                </div>
                
                <form onSubmit={handleProfileUpdate} className="p-6 space-y-5">
                  {profileStatus && (
                    <div className={`p-3 rounded-lg flex items-center gap-2.5 text-sm ${profileStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {profileStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <span>{profileStatus.msg}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1D6FA3] focus:border-[#1D6FA3] transition-colors"
                      />
                    </div>
                    
                    {/* DYNAMIC DROPDOWN IMPLEMENTATION */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {userRole === "STUDENT" ? "Course / Program" : "Department"}
                      </label>
                      <select
                        required
                        value={profileData.program}
                        onChange={(e) => setProfileData({...profileData, program: e.target.value})}
                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1D6FA3] focus:border-[#1D6FA3] transition-colors cursor-pointer"
                      >
                        <option value="" disabled>Select your academic program</option>
                        {academicPrograms.map((college, cIdx) => (
                          <optgroup key={cIdx} label={college.college}>
                            {college.programs.map((prog, pIdx) => (
                              <option key={pIdx} value={prog.value}>
                                {prog.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="px-5 py-2 bg-[#1D6FA3] text-white text-sm rounded-lg hover:bg-[#0B3C5D] transition-colors disabled:opacity-50 font-medium flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                    >
                      {isUpdatingProfile ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* TAB CONTENT: SECURITY */
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-700 text-sm">Update Password</h3>
                </div>
                
                <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                  {passwordStatus && (
                    <div className={`p-3 rounded-lg flex items-center gap-2.5 text-sm ${passwordStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {passwordStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <span>{passwordStatus.msg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1D6FA3] focus:border-[#1D6FA3]"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1D6FA3] focus:border-[#1D6FA3]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1D6FA3] focus:border-[#1D6FA3]"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword || !passwords.current || !passwords.new || !passwords.confirm}
                      className="px-5 py-2 bg-[#006837] text-white text-sm rounded-lg hover:bg-[#00542c] transition-colors disabled:opacity-50 font-medium flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                    >
                      {isUpdatingPassword ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* --- SUCCESS LOGOUT MODAL --- */}
        {logoutCountdown !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300 mx-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-[#006837]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Password Changed!</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                For your security, you must sign in again with your new credentials. You will be redirected in <strong className="text-[#1D6FA3] text-base">{logoutCountdown}</strong> seconds.
              </p>
              <button 
                onClick={handleForceLogout}
                className="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Okay
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}