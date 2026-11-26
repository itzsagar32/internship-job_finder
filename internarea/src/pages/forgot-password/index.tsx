import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import api from "@/utils/api";
import { toast } from "react-toastify";
import {
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Multi-step Flow: "request" -> "verify" -> "success"
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [resetMethod, setResetMethod] = useState<"email" | "phone">("email");
  const [contactInput, setContactInput] = useState("");
  const [resetSessionId, setResetSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // STEP 1: Request OTP with 24-Hour Enforcement
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!contactInput.trim()) {
      toast.error("Please enter your registered email or phone number");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/auth/forgot-password/request", {
        contact: contactInput.trim(),
        method: resetMethod,
      });

      if (res.data.success) {
        setResetSessionId(res.data.resetId);
        toast.info(res.data.message || "OTP sent to your verified contact");
        setStep("verify");
      }
    } catch (err: any) {
      const errResponse = err.response?.data;
      const msg =
        errResponse?.error || "Failed to initiate password reset. Please verify your details.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP & Generate Letters-Only Password
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!resetSessionId || !otpCode.trim()) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/auth/forgot-password/verify", {
        resetId: resetSessionId,
        otp: otpCode.trim(),
      });

      if (res.data.success) {
        toast.success("Identity verified successfully!");
        setStep("success");
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid or expired OTP code";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password Recovery | Internshala</title>
      </Head>

      <div className="min-h-[85vh] flex items-center justify-center bg-gray-50/70 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
              <KeyRound className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full">
              Task 2 Account Security Feature
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 tracking-tight">
              Reset Your Password
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Recover access using your registered email address or mobile phone number.
            </p>
          </div>

          {/* 24-Hour Security Policy Notice */}
          <div className="mb-6 p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900 flex items-start space-x-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Security Policy:</strong> Password resets are strictly limited to{" "}
              <strong>once per 24 hours</strong>. Additional requests within this window will be
              blocked.
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1 FORM: Enter Email or Phone */}
          {step === "request" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Reset Method Toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Verification Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResetMethod("email")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                      resetMethod === "email"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Address</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetMethod("phone")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                      resetMethod === "phone"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Mobile Number</span>
                  </button>
                </div>
              </div>

              {/* Contact Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {resetMethod === "email" ? "Registered Email Address" : "Registered Mobile Number"}
                </label>
                <input
                  type={resetMethod === "email" ? "email" : "tel"}
                  required
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  placeholder={
                    resetMethod === "email" ? "candidate@example.com" : "+91 9876543210"
                  }
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <span>{isLoading ? "Validating & Sending OTP..." : "Send Verification OTP"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2 FORM: Enter 6-Digit OTP */}
          {step === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  OTP code was dispatched to <strong>{contactInput}</strong>. Valid for 10 minutes.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 text-center uppercase tracking-wider">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 582914"
                  className="w-full text-center tracking-widest text-xl font-mono font-black py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <span>{isLoading ? "Verifying Identity..." : "Verify OTP & Reset Password"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-center text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="text-gray-500 hover:text-gray-800 transition"
                >
                  ← Edit Contact Details
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === "success" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">New Password Generated!</h3>
              <div className="p-4 bg-gray-50 rounded-2xl border text-xs text-gray-600 text-left space-y-2">
                <p>
                  <strong>Security Requirement Enforced:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    A random password consisting <strong>only of uppercase and lowercase English letters</strong> has been encrypted and saved.
                  </li>
                  <li>
                    The newly generated password was delivered directly to your verified contact (
                    <em>{contactInput}</em>).
                  </li>
                  <li>
                    <strong>You must change this password immediately</strong> upon your next login.
                  </li>
                </ul>
              </div>

              <Link
                href="/"
                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition text-center"
              >
                Return to Login Portal
              </Link>
            </div>
          )}

          {/* Back to Home Link */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-blue-600 inline-flex items-center space-x-1 font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Internshala Home</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
