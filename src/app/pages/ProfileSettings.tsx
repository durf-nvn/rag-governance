import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  BookOpen,
  LogOut,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  X,
  GraduationCap,
  ChevronRight,
  KeyRound,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router";

const academicPrograms = [
  {
    college: "College of Education (COEd)",
    programs: [
      { value: "BEED", label: "Bachelor of Elementary Education" },
      { value: "BSED_MATH", label: "BSEd major in Mathematics" },
      { value: "BSED_ENGLISH", label: "BSEd major in English" },
      { value: "BTLED_HE", label: "BTLEd major in Home Economics" },
    ],
  },
  {
    college: "College of Arts and Sciences (CAS)",
    programs: [
      { value: "AB_ELS", label: "BA in English Language Studies" },
      { value: "AB_LIT", label: "BA in Literature" },
      { value: "AB_PSYCH", label: "BA in Psychology" },
    ],
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
      { value: "BIT_GARM", label: "BIT major in Garments Technology" },
    ],
  },
];

const PRIMARY = "#dd7230";
const PRIMARY_DARK = "#b8591f";

export function ProfileSettings() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"profile" | "security">(
    "profile"
  );

  const userRole = sessionStorage.getItem("userRole") || "STUDENT";

  const [profileData, setProfileData] = useState({
    fullName: sessionStorage.getItem("userName") || "",
    program: sessionStorage.getItem("userDepartment") || "",
    email: sessionStorage.getItem("userEmail") || "",
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);

  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (logoutCountdown !== null && logoutCountdown > 0) {
      timer = setTimeout(
        () => setLogoutCountdown(logoutCountdown - 1),
        1000
      );
    } else if (logoutCountdown === 0) {
      handleForceLogout();
    }

    return () => clearTimeout(timer);
  }, [logoutCountdown]);

  const handleForceLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setProfileStatus(null);
    setIsUpdatingProfile(true);

    const originalEmail = sessionStorage.getItem("userEmail") || "";

    try {
      const response = await axios.put(
        "http://localhost:8000/users/profile",
        {
          email: originalEmail,
          new_email: profileData.email,
          full_name: profileData.fullName,
          program:
            userRole === "ADMIN" ? "ADMIN" : profileData.program,
        }
      );

      sessionStorage.setItem("userName", response.data.full_name);
      sessionStorage.setItem(
        "userDepartment",
        response.data.program
      );

      if (response.data.email !== originalEmail) {
        sessionStorage.setItem("userEmail", response.data.email);

        setModalContent({
          title: "Email Address Updated!",
          message:
            "You have successfully changed your email. For your security, please sign in again using your new email address.",
        });

        setLogoutCountdown(5);
      } else {
        setProfileStatus({
          type: "success",
          msg: "Profile information updated successfully.",
        });
      }
    } catch (error: any) {
      setProfileStatus({
        type: "error",
        msg:
          error.response?.data?.detail ||
          "Failed to update profile.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const passValidation = validatePassword(passwords.new);

  const isPasswordValid =
    passValidation.length &&
    passValidation.uppercase &&
    passValidation.number &&
    passValidation.special;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordStatus(null);

    if (passwords.new !== passwords.confirm) {
      setPasswordStatus({
        type: "error",
        msg: "New passwords do not match.",
      });
      return;
    }

    if (!isPasswordValid) {
      setPasswordStatus({
        type: "error",
        msg: "Please meet all password requirements.",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await axios.post(
        "http://localhost:8000/users/change-password",
        {
          email: sessionStorage.getItem("userEmail"),
          current_password: passwords.current,
          new_password: passwords.new,
        }
      );

      setModalContent({
        title: "Password Changed!",
        message:
          "You have successfully changed your password. For your security, you must sign in again with your new credentials.",
      });

      setLogoutCountdown(5);
    } catch (error: any) {
      setPasswordStatus({
        type: "error",
        msg:
          error.response?.data?.detail ||
          "Incorrect current password.",
      });

      setIsUpdatingPassword(false);
    }
  };

  const initials =
    profileData.fullName
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.charAt(0).toUpperCase())
      .join("") || "U";

  const isAdmin = userRole === "ADMIN";

  return (
    <div className="min-h-screen bg-[#f7f8fa] animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/app")}
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#dd7230] transition-all mb-7 cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 group-hover:border-[#dd7230]/30 group-hover:bg-[#dd7230]/5 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>

          <span>Back to Dashboard</span>
        </button>

        {/* PAGE HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#dd7230] mb-2">
            
            
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Account Settings
          </h1>

          <p className="text-gray-500 mt-2 max-w-xl">
            Manage your personal information, academic details,
            and account security.
          </p>
        </div>

        {/* PROFILE HERO */}
        <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm mb-7">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#dd7230]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-10 w-48 h-48 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">

              {/* AVATAR */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#dd7230] to-[#b8591f] flex items-center justify-center shadow-lg shadow-orange-200">
                  <span className="text-2xl font-bold text-white">
                    {initials}
                  </span>
                </div>

                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500 fill-green-50" />
                </div>
              </div>

              {/* USER INFO */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {profileData.fullName || "CTU User"}
                  </h2>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dd7230]/10 text-[#b8591f] text-[11px] font-bold uppercase tracking-wide">
                    <Shield className="w-3 h-3" />
                    {userRole}
                  </span>
                </div>

                <p className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {profileData.email || "No email address"}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
                    <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                    {isAdmin
                      ? "Administrator"
                      : profileData.program || "Academic Program"}
                  </span>
                </div>
              </div>

              {/* STATUS */}
              <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-green-50 border border-green-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>

                <span className="text-xs font-semibold text-green-700">
                  Account Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SETTINGS LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">

          {/* SIDEBAR */}
          <aside className="h-fit bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">

            <div className="px-3 pt-3 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Settings
              </p>
            </div>

            {/* PROFILE TAB */}
            <button
              onClick={() => {
                setActiveTab("profile");
                setProfileStatus(null);
              }}
              className={`group w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer mb-1 ${
                activeTab === "profile"
                  ? "bg-[#dd7230]/10 text-[#b8591f]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                  activeTab === "profile"
                    ? "bg-[#dd7230] text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                }`}
              >
                <User className="w-4 h-4" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold">
                  Profile
                </p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    activeTab === "profile"
                      ? "text-[#b8591f]/70"
                      : "text-gray-400"
                  }`}
                >
                  Personal details
                </p>
              </div>

              {activeTab === "profile" && (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* SECURITY TAB */}
            <button
              onClick={() => {
                setActiveTab("security");
                setPasswordStatus(null);
              }}
              className={`group w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === "security"
                  ? "bg-[#dd7230]/10 text-[#b8591f]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                  activeTab === "security"
                    ? "bg-[#dd7230] text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                }`}
              >
                <Lock className="w-4 h-4" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold">
                  Security
                </p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    activeTab === "security"
                      ? "text-[#b8591f]/70"
                      : "text-gray-400"
                  }`}
                >
                  Password & access
                </p>
              </div>

              {activeTab === "security" && (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* SECURITY TIP */}
            <div className="mt-4 mx-1 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="w-3.5 h-3.5 text-[#dd7230]" />
                <span className="text-xs font-bold text-gray-700">
                  Security tip
                </span>
              </div>

              <p className="text-[11px] leading-relaxed text-gray-400">
                Keep your account credentials private and use a
                strong, unique password.
              </p>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="min-w-0">

            {/* PROFILE */}
            {activeTab === "profile" ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                {/* CARD HEADER */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[#dd7230]" />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        Personal Information
                      </h3>

                      <p className="text-xs text-gray-400 mt-0.5">
                        Update your account and academic information.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleProfileUpdate}
                  className="p-6 sm:p-7"
                >
                  {/* STATUS */}
                  {profileStatus && (
                    <div
                      className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
                        profileStatus.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}
                    >
                      <div
                        className={`mt-0.5 ${
                          profileStatus.type === "success"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {profileStatus.type === "success" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {profileStatus.type === "success"
                            ? "Changes saved"
                            : "Something went wrong"}
                        </p>

                        <p className="text-xs mt-0.5 opacity-80">
                          {profileStatus.msg}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">

                    {/* NAME + EMAIL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                      {/* FULL NAME */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name
                        </label>

                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                          <input
                            type="text"
                            required
                            value={profileData.fullName}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                fullName: e.target.value,
                              })
                            }
                            placeholder="Enter your full name"
                            className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#dd7230] focus:ring-4 focus:ring-[#dd7230]/10 transition-all"
                          />
                        </div>
                      </div>

                      {/* EMAIL */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address
                        </label>

                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                          <input
                            type="email"
                            required
                            value={profileData.email}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                email: e.target.value,
                              })
                            }
                            placeholder="Enter your email"
                            className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#dd7230] focus:ring-4 focus:ring-[#dd7230]/10 transition-all"
                          />
                        </div>

                        <p className="text-[11px] text-gray-400 mt-1.5">
                          Changing your email will require you to sign
                          in again.
                        </p>
                      </div>
                    </div>

                    {/* ROLE / PROGRAM */}
                    {isAdmin ? (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          System Role
                        </label>

                        <div className="relative">
                          <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                          <input
                            type="text"
                            value="ADMINISTRATOR"
                            disabled
                            className="w-full h-11 pl-10 pr-4 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl text-sm cursor-not-allowed"
                          />
                        </div>

                        <p className="text-[11px] text-gray-400 mt-1.5">
                          Your system role cannot be changed here.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {userRole === "STUDENT"
                            ? "Course / Program"
                            : "College / Department"}
                        </label>

                        <div className="relative">
                          <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />

                          <select
                            required
                            value={profileData.program}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                program: e.target.value,
                              })
                            }
                            className="appearance-none w-full h-11 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:bg-white focus:border-[#dd7230] focus:ring-4 focus:ring-[#dd7230]/10 transition-all cursor-pointer"
                          >
                            <option value="" disabled>
                              Select your academic program
                            </option>

                            {academicPrograms.map(
                              (college, cIdx) => (
                                <optgroup
                                  key={cIdx}
                                  label={college.college}
                                >
                                  {college.programs.map(
                                    (prog, pIdx) => (
                                      <option
                                        key={pIdx}
                                        value={prog.value}
                                      >
                                        {prog.label}
                                      </option>
                                    )
                                  )}
                                </optgroup>
                              )
                            )}
                          </select>

                          <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DIVIDER */}
                  <div className="border-t border-gray-100 mt-8 pt-6">
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">

                      <p className="text-xs text-gray-400">
                        Make sure your information is accurate before
                        saving.
                      </p>

                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#dd7230] text-white text-sm font-semibold rounded-xl hover:bg-[#b8591f] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-orange-100 active:scale-[0.98] cursor-pointer"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              /* SECURITY */
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                {/* CARD HEADER */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-[#dd7230]" />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        Account Security
                      </h3>

                      <p className="text-xs text-gray-400 mt-0.5">
                        Protect your account by keeping your password
                        secure.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handlePasswordChange}
                  className="p-6 sm:p-7"
                >

                  {/* SECURITY NOTICE */}
                  <div className="mb-6 flex gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <Shield className="w-4 h-4 text-[#dd7230]" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Keep your account protected
                      </p>

                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Choose a password that is difficult to guess
                        and avoid reusing passwords from other accounts.
                      </p>
                    </div>
                  </div>

                  {/* STATUS */}
                  {passwordStatus && (
                    <div
                      className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
                        passwordStatus.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}
                    >
                      <div className="mt-0.5">
                        {passwordStatus.type === "success" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {passwordStatus.type === "success"
                            ? "Password updated"
                            : "Unable to update password"}
                        </p>

                        <p className="text-xs mt-0.5 opacity-80">
                          {passwordStatus.msg}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">

                    {/* CURRENT PASSWORD */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Password
                      </label>

                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                        <input
                          type={
                            showCurrentPassword
                              ? "text"
                              : "password"
                          }
                          required
                          value={passwords.current}
                          onChange={(e) =>
                            setPasswords({
                              ...passwords,
                              current: e.target.value,
                            })
                          }
                          placeholder="Enter your current password"
                          className="w-full h-11 pl-10 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#dd7230] focus:ring-4 focus:ring-[#dd7230]/10 transition-all"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(
                              !showCurrentPassword
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                          aria-label={
                            showCurrentPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* NEW PASSWORD */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Password
                      </label>

                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                        <input
                          type={
                            showNewPassword ? "text" : "password"
                          }
                          required
                          value={passwords.new}
                          onChange={(e) =>
                            setPasswords({
                              ...passwords,
                              new: e.target.value,
                            })
                          }
                          placeholder="Create a new password"
                          className={`w-full h-11 pl-10 pr-11 bg-gray-50 border rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-4 transition-all ${
                            passwords.new.length > 0
                              ? isPasswordValid
                                ? "border-green-300 focus:border-green-400 focus:ring-green-100"
                                : "border-gray-200 focus:border-[#dd7230] focus:ring-[#dd7230]/10"
                              : "border-gray-200 focus:border-[#dd7230] focus:ring-[#dd7230]/10"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword(!showNewPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                          aria-label={
                            showNewPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* PASSWORD REQUIREMENTS */}
                      {passwords.new.length > 0 && (
                        <div className="mt-3 p-4 rounded-xl bg-gray-50 border border-gray-100">

                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-gray-700">
                              Password requirements
                            </p>

                            {isPasswordValid && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Strong password
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                            <PasswordRequirement
                              valid={passValidation.length}
                              text="At least 8 characters"
                            />

                            <PasswordRequirement
                              valid={passValidation.uppercase}
                              text="1 uppercase letter"
                            />

                            <PasswordRequirement
                              valid={passValidation.number}
                              text="1 number"
                            />

                            <PasswordRequirement
                              valid={passValidation.special}
                              text="1 special character"
                            />

                          </div>
                        </div>
                      )}
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm New Password
                      </label>

                      <div className="relative">
                        <CheckCircle
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                            passwords.confirm &&
                            passwords.new === passwords.confirm
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        />

                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          required
                          value={passwords.confirm}
                          onChange={(e) =>
                            setPasswords({
                              ...passwords,
                              confirm: e.target.value,
                            })
                          }
                          placeholder="Re-enter your new password"
                          className={`w-full h-11 pl-10 pr-11 bg-gray-50 border rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-4 transition-all ${
                            passwords.confirm &&
                            passwords.new !== passwords.confirm
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                              : passwords.confirm &&
                                passwords.new ===
                                  passwords.confirm
                              ? "border-green-300 focus:border-green-400 focus:ring-green-100"
                              : "border-gray-200 focus:border-[#dd7230] focus:ring-[#dd7230]/10"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {passwords.confirm &&
                        passwords.new !== passwords.confirm && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Passwords do not match.
                          </div>
                        )}

                      {passwords.confirm &&
                        passwords.new === passwords.confirm && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Passwords match.
                          </div>
                        )}
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-gray-100 mt-8 pt-6">
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Shield className="w-3.5 h-3.5" />
                        Your password is securely transmitted.
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isUpdatingPassword ||
                          !passwords.current ||
                          !passwords.new ||
                          !passwords.confirm ||
                          !isPasswordValid ||
                          passwords.new !== passwords.confirm
                        }
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#dd7230] text-white text-sm font-semibold rounded-xl hover:bg-[#b8591f] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-orange-100 active:scale-[0.98] cursor-pointer"
                      >
                        {isUpdatingPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* SUCCESS / LOGOUT MODAL */}
      {logoutCountdown !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-950/60 backdrop-blur-md animate-in fade-in duration-200 px-4">

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">

            {/* Top accent */}
            <div className="h-1.5 bg-gradient-to-r from-[#dd7230] to-[#b8591f]" />

            <div className="p-7 sm:p-8 text-center">

              {/* ICON */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-[#dd7230]/10 animate-pulse" />

                <div className="relative w-20 h-20 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-[#dd7230]" />
                </div>
              </div>

              {/* CONTENT */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {modalContent.title}
              </h3>

              <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                {modalContent.message}
              </p>

              {/* COUNTDOWN */}
              <div className="mt-6 mb-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#dd7230]" />

                Redirecting in

                <span className="inline-flex items-center justify-center min-w-[30px] h-[30px] px-2 rounded-lg bg-[#dd7230]/10 text-[#dd7230] font-bold">
                  {logoutCountdown}
                </span>

                seconds
              </div>

              {/* SIGN OUT */}
              <button
                onClick={handleForceLogout}
                className="w-full h-11 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                Sign out now
              </button>

              <p className="text-[11px] text-gray-400 mt-4">
                For your security, you'll need to sign in again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   SMALL UI COMPONENTS
--------------------------------------------------------- */

function PasswordRequirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-xs ${
        valid ? "text-green-600" : "text-gray-500"
      }`}
    >
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-full ${
          valid
            ? "bg-green-100"
            : "bg-gray-200"
        }`}
      >
        {valid ? (
          <Check className="w-3 h-3" />
        ) : (
          <X className="w-3 h-3" />
        )}
      </span>

      <span>{text}</span>
    </div>
  );
}

function SettingsIcon() {
  return (
    <div className="w-4 h-4 rounded-md bg-[#dd7230]/10 flex items-center justify-center">
      <Sparkles className="w-2.5 h-2.5 text-[#dd7230]" />
    </div>
  );
}