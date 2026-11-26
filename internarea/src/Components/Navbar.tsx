import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Search,
  User as UserIcon,
  LogOut,
  Briefcase,
  ShieldCheck,
  FileText,
  PlusCircle,
  Building,
  KeyRound,
  X,
  Sparkles,
  Globe,
  CreditCard,
  Lock,
  Users,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectuser, logout, login, setToken } from "@/Feature/Userslice";
import { toast } from "react-toastify";
import api from "@/utils/api";
import { useI18n, LANGUAGES, SupportedLanguage } from "@/utils/i18n";

const Navbar = () => {
  const rawUser = useSelector(selectuser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? rawUser : null;
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    language,
    t,
    changeLanguage,
    isFrenchOtpModalOpen,
    setIsFrenchOtpModalOpen,
  } = useI18n();

  // Language Dropdown & French OTP State
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [frenchOtpInput, setFrenchOtpInput] = useState("");
  const [isSubmittingFrenchOtp, setIsSubmittingFrenchOtp] = useState(false);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [roleMode, setRoleMode] = useState<"student" | "company">("student");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Chrome OTP State (Task 6 Critical Rule)
  const [isChromeOtpModalOpen, setIsChromeOtpModalOpen] = useState(false);
  const [chromeTempToken, setChromeTempToken] = useState("");
  const [chromeOtpInput, setChromeOtpInput] = useState("");
  const [trustThisDevice, setTrustThisDevice] = useState(false);
  const [isSubmittingChromeOtp, setIsSubmittingChromeOtp] = useState(false);

  // Force Change Password State (Task 2 Critical Rule)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [newPermanentPassword, setNewPermanentPassword] = useState("");
  const [isSubmittingNewPassword, setIsSubmittingNewPassword] = useState(false);


  const handleLogout = () => {
    dispatch(logout());
    toast.info("Logged out successfully");
    router.push("/");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === "register") {
        const payload = {
          name,
          email,
          password,
          role: roleMode,
          phone,
          companyName: roleMode === "company" ? companyName || name : undefined,
        };

        const res = await api.post("/auth/register", payload);
        dispatch(login(res.data.user));
        dispatch(setToken(res.data.token));
        toast.success(`Welcome to Internshala, ${res.data.user.name}!`);
        setIsAuthModalOpen(false);

        if (roleMode === "company") {
          router.push("/company/dashboard");
        } else {
          router.push("/profile");
        }
      } else {
        const payload = { email, password };
        const res = await api.post("/auth/login", payload);

        // Check if Google Chrome Login requires OTP (Task 6 Critical Rule)
        if (res.status === 202 && res.data.requireChromeOtp) {
          setChromeTempToken(res.data.tempToken);
          setIsAuthModalOpen(false);
          setIsChromeOtpModalOpen(true);
          toast.info(res.data.message || "Google Chrome login requires email OTP verification.");
          return;
        }

        dispatch(login(res.data.user));
        dispatch(setToken(res.data.token));
        toast.success(`Welcome back, ${res.data.user.name}!`);
        setIsAuthModalOpen(false);

        if (res.data.mustChangePassword) {
          setIsChangePasswordModalOpen(true);
          toast.warn("Security Alert: You must change your temporary password immediately.");
        } else if (res.data.user.role === "company") {
          router.push("/company/dashboard");
        } else if (res.data.user.role === "admin") {
          router.push("/adminpanel");
        }
      }
    } catch (error: any) {
      console.error(error);
      const errMsg =
        error.response?.data?.error ||
        "Authentication failed. Please verify your details.";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChromeOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chromeTempToken || !chromeOtpInput.trim()) return;

    try {
      setIsSubmittingChromeOtp(true);
      const res = await api.post("/auth/chrome-login-verify", {
        tempToken: chromeTempToken,
        otp: chromeOtpInput.trim(),
        trustDevice: trustThisDevice,
      });

      if (res.data.success) {
        dispatch(login(res.data.user));
        dispatch(setToken(res.data.token));
        toast.success("Google Chrome OTP verified! Welcome back!");
        setIsChromeOtpModalOpen(false);
        setChromeOtpInput("");

        if (res.data.mustChangePassword) {
          setIsChangePasswordModalOpen(true);
        } else if (res.data.user.role === "company") {
          router.push("/company/dashboard");
        } else if (res.data.user.role === "admin") {
          router.push("/adminpanel");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid or expired OTP code");
    } finally {
      setIsSubmittingChromeOtp(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermanentPassword || newPermanentPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    try {
      setIsSubmittingNewPassword(true);
      const res = await api.post("/auth/change-password", {
        newPassword: newPermanentPassword,
      });

      if (res.data.success) {
        toast.success("Password updated successfully! Your account is secured.");
        setIsChangePasswordModalOpen(false);
        setNewPermanentPassword("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update password");
    } finally {
      setIsSubmittingNewPassword(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-blue-600">
                  INTERN<span className="text-slate-800">SHALA</span>
                </span>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-5">
                <Link
                  href="/internship"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  {t("nav_internships")}
                </Link>
                <Link
                  href="/job"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  {t("nav_jobs")}
                </Link>
                <Link
                  href="/resume-builder"
                  className="inline-flex items-center text-sm font-medium text-purple-700 hover:text-purple-800 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-500" />
                  {t("nav_resume_builder")}
                </Link>
                <Link
                  href="/subscription"
                  className="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-800 transition"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  {t("nav_pricing")}
                </Link>
                <Link
                  href="/public-space"
                  className="inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800 transition"
                >
                  <Users className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  <span>Public Space</span>
                </Link>
              </nav>
            </div>

            {/* Right Side / Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Language Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  title="Switch Language"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span className="uppercase">{language}</span>
                  <span className="text-gray-400 text-[10px]">▼</span>
                </button>

                {isLangDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 z-50">
                    <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase">
                      Select Language
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={async () => {
                          setIsLangDropdownOpen(false);
                          if (lang.code === language) return;
                          await changeLanguage(lang.code);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50 transition ${
                          language === lang.code ? "font-bold text-blue-600 bg-blue-50/50" : "text-gray-700"
                        }`}
                      >
                        <span>
                          {lang.flag} {lang.nativeName}
                        </span>
                        {lang.code === "fr" && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold">
                            OTP Gated
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Role Specific Quick Links */}
                  {user.role === "student" && (
                    <Link
                      href="/userapplication"
                      className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      {t("nav_applications")}
                    </Link>
                  )}

                  {user.role === "company" && (
                    <Link
                      href="/company/dashboard"
                      className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      <Building className="w-3.5 h-3.5 mr-1" />
                      Company Portal
                    </Link>
                  )}

                  {user.role === "admin" && (
                    <Link
                      href="/adminpanel"
                      className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Admin Panel
                    </Link>
                  )}

                  {/* Profile Link with Role Tag */}
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-semibold text-gray-800 leading-none">
                        {user.name}
                      </p>
                      <span className="text-[10px] uppercase font-bold text-blue-600 leading-none">
                        {user.role}
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setIsAuthModalOpen(true);
                    }}
                    className="text-xs sm:text-sm font-semibold text-blue-600 border border-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-50 transition"
                  >
                    Login
                  </button>

                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setIsAuthModalOpen(true);
                    }}
                    className="text-xs sm:text-sm font-semibold text-white bg-blue-600 px-3.5 py-1.5 rounded-md hover:bg-blue-700 shadow-xs transition"
                  >
                    Register
                  </button>

                  <Link
                    href="/adminlogin"
                    className="hidden sm:inline-flex items-center text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1"
                  >
                    <KeyRound className="w-3.5 h-3.5 mr-1" />
                    Admin
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* AUTHENTICATION MODAL */}
      {/* ========================================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {authMode === "login" ? "Welcome Back" : "Create Your Account"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {authMode === "login"
                    ? "Log in to explore internships and manage applications"
                    : "Join thousands of students and hiring companies"}
                </p>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              {/* Role Toggle for Registration */}
              {authMode === "register" && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRoleMode("student")}
                    className={`py-1.5 text-xs font-semibold rounded-md transition ${
                      roleMode === "student"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Candidate (Student)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleMode("company")}
                    className={`py-1.5 text-xs font-semibold rounded-md transition ${
                      roleMode === "company"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Employer (Company)
                  </button>
                </div>
              )}

              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {authMode === "register" && roleMode === "company" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. InnovateTech Labs"
                    className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {authMode === "login" && (
                  <div className="flex justify-end pt-1">
                    <Link
                      href="/forgot-password"
                      onClick={() => setIsAuthModalOpen(false)}
                      className="text-[11px] text-blue-600 font-semibold hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isLoading
                  ? "Processing..."
                  : authMode === "login"
                  ? "Log In"
                  : "Complete Registration"}
              </button>

              <div className="pt-2 text-center text-xs text-gray-500">
                {authMode === "login" ? (
                  <>
                    Don&apos;t have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Register Now
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Log In
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 6: Google Chrome OTP Verification Modal */}
      {isChromeOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
            <button
              onClick={() => setIsChromeOtpModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Chrome Security Verification
                </h3>
                <p className="text-xs text-gray-500">
                  Task 6 Rule: Google Chrome login requires OTP authorization
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 bg-blue-50/70 p-3 rounded-lg border border-blue-100">
              An OTP has been dispatched to your email. Enter the 6-digit code to authorize access from Google Chrome.
            </p>

            <form onSubmit={handleChromeOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={chromeOtpInput}
                  onChange={(e) => setChromeOtpInput(e.target.value)}
                  placeholder="e.g. 581920"
                  className="w-full text-center tracking-widest text-lg font-mono font-bold px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  id="trustDev"
                  checked={trustThisDevice}
                  onChange={(e) => setTrustThisDevice(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="trustDev" className="cursor-pointer">
                  Trust this device (skip OTP on future Chrome logins)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsChromeOtpModalOpen(false)}
                  className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingChromeOtp || chromeOtpInput.length < 6}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {isSubmittingChromeOtp ? "Authorizing..." : "Authorize Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 2: Force Change Temporary Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Update Temporary Password
                </h3>
                <p className="text-xs text-gray-500">
                  Task 2 Rule: You must set a permanent password immediately
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 bg-amber-50 p-3 rounded-lg border border-amber-200">
              You logged in with a temporary randomly generated password. To secure your account, please choose a new permanent password now.
            </p>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Permanent Password (Min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPermanentPassword}
                  onChange={(e) => setNewPermanentPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingNewPassword || newPermanentPassword.length < 6}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isSubmittingNewPassword ? "Updating Password..." : "Set Permanent Password & Continue"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* French Language OTP Verification Modal (Task 5 Critical Rule) */}
      {isFrenchOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
            <button
              onClick={() => setIsFrenchOtpModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Security Check: French (Français)
                </h3>
                <p className="text-xs text-gray-500">
                  CRITICAL RULE: French language change requires OTP
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              An OTP has been dispatched to your email address (simulated in server console). Enter the 6-digit code to complete switching your profile language to French.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingFrenchOtp(true);
                try {
                  await changeLanguage("fr", frenchOtpInput.trim());
                  setFrenchOtpInput("");
                } finally {
                  setIsSubmittingFrenchOtp(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={frenchOtpInput}
                  onChange={(e) => setFrenchOtpInput(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full text-center tracking-widest text-lg font-mono font-bold px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFrenchOtpModalOpen(false)}
                  className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFrenchOtp || frenchOtpInput.length < 6}
                  className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {isSubmittingFrenchOtp ? "Verifying..." : "Verify & Switch to French"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
};

export default Navbar;
