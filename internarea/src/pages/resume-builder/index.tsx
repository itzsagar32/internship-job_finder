import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import api from "@/utils/api";
import { toast } from "react-toastify";
import {
  Sparkles,
  FileText,
  Download,
  Lock,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Building,
  GraduationCap,
  Briefcase,
  User as UserIcon,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "@/utils/i18n";

export default function ResumeBuilderPage() {
  const user = useSelector(selectuser);
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"editor" | "history">("editor");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resume Form State
  const [personalDetails, setPersonalDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "Bangalore, India",
    summary: "Aspiring Full Stack Engineer passionate about building scalable web applications.",
    linkedin: "linkedin.com/in/candidate",
    github: "github.com/candidate",
    portfolio: "https://portfolio.me",
  });

  const [educationList, setEducationList] = useState([
    {
      degree: "B.Tech in Computer Science and Engineering",
      institution: "National Institute of Technology",
      startYear: "2021",
      endYear: "2025",
      score: "8.8 CGPA",
    },
  ]);

  const [experienceList, setExperienceList] = useState([
    {
      title: "Frontend Engineering Intern",
      company: "TechCorp Solutions",
      startDate: "May 2024",
      endDate: "July 2024",
      description: "Built responsive dashboards using Next.js, Redux, and Tailwind CSS. Improved page load speed by 35%.",
    },
  ]);

  const [skillsInput, setSkillsInput] = useState(
    "React, Next.js, Node.js, TypeScript, Tailwind CSS, MongoDB, Git"
  );

  const [projectsList, setProjectsList] = useState([
    {
      title: "Internshala Job & Internship Portal Clone",
      description: "Full-stack MERN portal with real-time WebSockets, time-gated subscriptions, and RBAC authentication.",
      link: "https://github.com/internshala-clone",
    },
  ]);

  // Download & OTP Flow State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);

  // History State
  const [historyData, setHistoryData] = useState<any>({ resumes: [], payments: [], invoices: [] });

  useEffect(() => {
    // Clean up any stray external Razorpay script elements or test mode ribbons
    if (typeof document !== "undefined") {
      document.querySelectorAll(".razorpay-container, .razorpay-ribbon, iframe[src*='razorpay']").forEach((el) => el.remove());
    }
    return () => {
      if (typeof document !== "undefined") {
        document.querySelectorAll(".razorpay-container, .razorpay-ribbon, iframe[src*='razorpay']").forEach((el) => el.remove());
      }
    };
  }, []);

  // Load existing resume if available
  useEffect(() => {
    const fetchResume = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await api.get("/resume/my");
        if (res.data?.resume) {
          const r = res.data.resume;
          if (r.personalDetails) setPersonalDetails((prev) => ({ ...prev, ...r.personalDetails }));
          if (r.education?.length) setEducationList(r.education);
          if (r.experience?.length) setExperienceList(r.experience);
          if (r.skills?.length) setSkillsInput(r.skills.join(", "));
          if (r.projects?.length) setProjectsList(r.projects);
        } else {
          // Pre-populate with user info
          setPersonalDetails((prev) => ({
            ...prev,
            fullName: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
          }));
        }
      } catch (err) {
        console.error("Error loading resume:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const res = await api.get("/resume/history");
      setHistoryData(res.data || { resumes: [], payments: [], invoices: [] });
    } catch (err) {
      console.error("Error fetching resume history:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const handleSaveDraft = async (silent = false) => {
    if (!user) {
      toast.warning("Please log in to save your resume");
      return null;
    }

    try {
      setSaving(true);
      const skillsArray = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.post("/resume/save", {
        personalDetails,
        education: educationList,
        experience: experienceList,
        skills: skillsArray,
        projects: projectsList,
      });

      if (!silent) {
        toast.success("Resume saved successfully!");
      }
      return res.data?.resume;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save resume");
      return null;
    } finally {
      setSaving(false);
    }
  };

  // STEP 1 OF PREMIUM DOWNLOAD: Request OTP
  const handleInitiateDownload = async () => {
    if (!user) {
      toast.warning("Please log in to build and download your premium resume");
      return;
    }

    let targetResumeId: string | undefined = undefined;
    try {
      const saved = await handleSaveDraft(true);
      if (saved && (saved._id || saved.id)) {
        targetResumeId = saved._id || saved.id;
      }
    } catch (saveErr) {
      console.warn("Auto-save prior to download warning:", saveErr);
    }

    try {
      setIsProcessingDownload(true);
      const res = await api.post("/resume/request-download-otp", {
        resumeId: targetResumeId,
      });

      if (res.data.success) {
        setPaymentSessionId(res.data.paymentId);
        setIsOtpVerified(false);
        setOtpCode("");
        setIsOtpModalOpen(true);
        toast.info(res.data.message || "OTP sent to your registered email");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          err.message ||
          "Failed to initiate download verification"
      );
    } finally {
      setIsProcessingDownload(false);
    }
  };

  // Helper to dynamically load Razorpay checkout script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Finalize payment & PDF generation
  const finalizePaymentAndDownload = async (
    sessId: string,
    token: string,
    rzpPaymentId: string
  ) => {
    try {
      setIsProcessingDownload(true);
      const verifyRes = await api.post("/resume/verify-payment", {
        paymentId: sessId,
        verificationToken: token,
        razorpayPaymentId: rzpPaymentId,
      });

      if (verifyRes.data.success) {
        toast.success("Payment verified! Downloading your resume PDF...");
        setIsPaymentGatewayOpen(false);

        // Trigger PDF file download
        const downloadLink = document.createElement("a");
        downloadLink.href = verifyRes.data.pdfUrl;
        downloadLink.download = `Resume_${
          personalDetails.fullName.replace(/\s+/g, "_") || "Candidate"
        }.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        toast.info("Resume PDF set as your default profile resume!");
        fetchHistory();
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error || err.message || "Failed to finalize download";
      toast.error(errMsg);
    } finally {
      setIsProcessingDownload(false);
    }
  };

  // Launch Razorpay checkout: uses custom in-app Razorpay modal (or live SDK if registered live key provided)
  const launchRazorpayCheckout = async (sessId: string, token: string) => {
    // Clean up any stray external Razorpay script iframes or test-mode ribbons if present
    if (typeof document !== "undefined") {
      document.querySelectorAll(".razorpay-container, .razorpay-ribbon, iframe[src*='razorpay']").forEach((el) => el.remove());
    }

    try {
      setIsProcessingDownload(true);
      const orderRes = await api.post("/resume/create-payment-order", {
        paymentId: sessId,
        verificationToken: token,
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.error || "Payment order creation failed");
      }

      const rzpKey = orderRes.data.key;
      // Only invoke external Razorpay SDK if a genuine live/merchant key is configured
      const isConfiguredLiveKey =
        rzpKey &&
        rzpKey !== "rzp_test_internshala" &&
        !rzpKey.includes("test_internshala") &&
        rzpKey.startsWith("rzp_");

      if (isConfiguredLiveKey) {
        const scriptLoaded = await loadRazorpayScript();
        if (scriptLoaded && (window as any).Razorpay) {
          try {
            const options = {
              key: rzpKey,
              amount: orderRes.data.amount || 5000,
              currency: orderRes.data.currency || "INR",
              name: "Internshala Premium",
              description: "₹50 Resume Download Verification",
              order_id: orderRes.data.orderId,
              handler: async (response: any) => {
                await finalizePaymentAndDownload(
                  sessId,
                  token,
                  response.razorpay_payment_id || `pay_res_${Date.now()}`
                );
              },
              prefill: {
                name: personalDetails.fullName || user?.name || "Student",
                email: user?.email || "",
                contact: personalDetails.phone || user?.phone || "",
              },
              theme: {
                color: "#008BDC",
              },
              modal: {
                ondismiss: () => {
                  setIsProcessingDownload(false);
                },
              },
            };

            const rzpInstance = new (window as any).Razorpay(options);
            rzpInstance.on("payment.failed", (resp: any) => {
              toast.error(resp.error?.description || "Payment failed");
            });
            rzpInstance.open();
            return;
          } catch (rzpErr) {
            console.warn("External Razorpay popup unavailable, falling back to in-app checkout:", rzpErr);
          }
        }
      }

      // Open the interactive Razorpay test payment gateway modal directly
      setIsPaymentGatewayOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to initialize payment");
      setIsPaymentGatewayOpen(true);
    } finally {
      setIsProcessingDownload(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSessionId || !otpCode) return;

    try {
      setIsProcessingDownload(true);
      const res = await api.post("/resume/verify-download-otp", {
        paymentId: paymentSessionId,
        otp: otpCode.trim(),
      });

      if (res.data.verified) {
        setIsOtpVerified(true);
        setVerificationToken(res.data.verificationToken);
        toast.success("OTP Verified! Opening Razorpay payment gateway...");
        setIsOtpModalOpen(false);
        // Automatically launch Razorpay checkout
        await launchRazorpayCheckout(paymentSessionId, res.data.verificationToken);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid or expired OTP");
    } finally {
      setIsProcessingDownload(false);
    }
  };

  // STEP 3: Complete Payment & Download PDF (Modal fallback button)
  const handleCompletePaymentAndDownload = async () => {
    if (!paymentSessionId || !verificationToken) {
      toast.error("Security verification missing. Please restart download.");
      return;
    }
    await finalizePaymentAndDownload(
      paymentSessionId,
      verificationToken,
      `pay_res_${Date.now()}`
    );
  };

  return (
    <>
      <Head>
        <title>Premium Resume Builder | Internshala</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-gray-200 mb-6 gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Task 4 Enterprise Requirement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t("resume_builder_title")}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Build an ATS-optimized, professional resume with automated PDF generation. (₹50 per download, OTP-gated).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab(activeTab === "editor" ? "history" : "editor")}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              {activeTab === "editor" ? "View Download History" : "Back to Editor"}
            </button>

            {activeTab === "editor" && (
              <>
                <button
                  onClick={() => handleSaveDraft(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  onClick={handleInitiateDownload}
                  disabled={isProcessingDownload}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-purple-700 hover:to-indigo-700 shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t("download_resume_btn")}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Resume Editor */}
        {activeTab === "editor" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Form: 7 cols */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section 1: Personal Information */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                  <span>1. Personal & Contact Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={personalDetails.fullName}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, fullName: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={personalDetails.email}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })}
                      placeholder="e.g. candidate@example.com"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={personalDetails.phone}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={personalDetails.location}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, location: e.target.value })}
                      placeholder="e.g. Bangalore, India"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">Professional Headline / Summary</label>
                    <textarea
                      rows={2}
                      value={personalDetails.summary}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, summary: e.target.value })}
                      placeholder="Brief overview of your engineering background and goals..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Skills */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>2. Core Competencies & Skills (Comma Separated)</span>
                </h3>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. React, Next.js, Node.js, TypeScript, Tailwind CSS, MongoDB, Git"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {skillsInput
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[11px] font-semibold border border-purple-200"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              </div>

              {/* Section 3: Education */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>3. Education</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setEducationList([
                        ...educationList,
                        { degree: "", institution: "", startYear: "", endYear: "", score: "" },
                      ])
                    }
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {educationList.map((edu, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs relative">
                      {educationList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEducationList(educationList.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-gray-500 font-semibold mb-0.5">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const updated = [...educationList];
                              updated[idx].degree = e.target.value;
                              setEducationList(updated);
                            }}
                            placeholder="e.g. B.Tech Computer Science"
                            className="w-full px-2.5 py-1.5 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500 font-semibold mb-0.5">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => {
                              const updated = [...educationList];
                              updated[idx].institution = e.target.value;
                              setEducationList(updated);
                            }}
                            placeholder="College / University"
                            className="w-full px-2.5 py-1.5 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500 font-semibold mb-0.5">Years</label>
                          <input
                            type="text"
                            value={`${edu.startYear ? edu.startYear + " - " : ""}${edu.endYear || ""}`}
                            onChange={(e) => {
                              const updated = [...educationList];
                              const parts = e.target.value.split("-");
                              updated[idx].startYear = parts[0]?.trim() || "";
                              updated[idx].endYear = parts[1]?.trim() || "";
                              setEducationList(updated);
                            }}
                            placeholder="2021 - 2025"
                            className="w-full px-2.5 py-1.5 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500 font-semibold mb-0.5">Grade / CGPA</label>
                          <input
                            type="text"
                            value={edu.score}
                            onChange={(e) => {
                              const updated = [...educationList];
                              updated[idx].score = e.target.value;
                              setEducationList(updated);
                            }}
                            placeholder="8.8 CGPA"
                            className="w-full px-2.5 py-1.5 border rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Experience */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>4. Work Experience & Internships</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setExperienceList([
                        ...experienceList,
                        { title: "", company: "", startDate: "", endDate: "", description: "" },
                      ])
                    }
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {experienceList.map((exp, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs relative">
                      {experienceList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setExperienceList(experienceList.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-[11px] text-gray-500 font-semibold mb-0.5">Role Title</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => {
                              const updated = [...experienceList];
                              updated[idx].title = e.target.value;
                              setExperienceList(updated);
                            }}
                            placeholder="e.g. Full Stack Intern"
                            className="w-full px-2.5 py-1.5 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500 font-semibold mb-0.5">Company Name</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const updated = [...experienceList];
                              updated[idx].company = e.target.value;
                              setExperienceList(updated);
                            }}
                            placeholder="e.g. Google India"
                            className="w-full px-2.5 py-1.5 border rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 font-semibold mb-0.5">Description & Contributions</label>
                        <textarea
                          rows={2}
                          value={exp.description}
                          onChange={(e) => {
                            const updated = [...experienceList];
                            updated[idx].description = e.target.value;
                            setExperienceList(updated);
                          }}
                          placeholder="What did you build, scale, or improve?..."
                          className="w-full px-2.5 py-1.5 border rounded-md"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Live Resume Preview (5 cols) */}
            <div className="lg:col-span-5">
              <div className="sticky top-20 bg-white rounded-2xl border-2 border-indigo-100 shadow-lg p-6 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b mb-4">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700">
                    <FileText className="w-4 h-4" />
                    <span>Live PDF Layout Preview</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    ATS Standard
                  </span>
                </div>

                {/* Simulated PDF Document Page */}
                <div className="border border-gray-200 rounded-lg p-5 bg-white text-gray-800 shadow-xs space-y-4 font-sans text-xs">
                  {/* PDF Banner */}
                  <div className="bg-blue-600 text-white p-4 rounded-md">
                    <h2 className="text-base font-extrabold tracking-wide">
                      {personalDetails.fullName || "Your Full Name"}
                    </h2>
                    <p className="text-[11px] text-blue-100 mt-0.5">
                      {personalDetails.summary || "Full Stack Developer"}
                    </p>
                  </div>

                  {/* Contact Row */}
                  <div className="text-[10px] text-gray-500 flex flex-wrap gap-2 pb-2 border-b">
                    <span>{personalDetails.email || "email@example.com"}</span>
                    <span>•</span>
                    <span>{personalDetails.phone || "+91 9876543210"}</span>
                    <span>•</span>
                    <span>{personalDetails.location || "Bangalore, India"}</span>
                  </div>

                  {/* Skills Section */}
                  <div>
                    <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                      Key Competencies
                    </h4>
                    <p className="text-[11px] text-gray-700 leading-relaxed">
                      {skillsInput || "React, Node.js, TypeScript, Tailwind CSS"}
                    </p>
                  </div>

                  {/* Experience Section */}
                  <div>
                    <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                      Experience
                    </h4>
                    {experienceList.map((exp, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between font-bold text-[11px] text-gray-900">
                          <span>{exp.title || "Job Title"}</span>
                          <span className="text-[10px] text-gray-500">{exp.company || "Company"}</span>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">
                          {exp.description || "Responsibilities and outcomes..."}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Education Section */}
                  <div>
                    <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                      Education
                    </h4>
                    {educationList.map((edu, i) => (
                      <div key={i} className="flex justify-between text-[10px] mb-1">
                        <div>
                          <div className="font-bold text-gray-800">{edu.degree || "Degree"}</div>
                          <div className="text-gray-500">{edu.institution || "Institution"}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-700">{edu.score}</div>
                          <div className="text-gray-400">{edu.startYear} - {edu.endYear}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t text-[9px] text-gray-400 text-center">
                    Internshala Verified Resume • PDF 1.4 Native Generated
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleInitiateDownload}
                    disabled={isProcessingDownload}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-purple-700 hover:to-indigo-700 shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Unlock & Download PDF (₹50)</span>
                  </button>
                  <p className="text-[10px] text-gray-500 text-center mt-2">
                    Security Policy: Requires 6-digit email OTP verification before payment gateway opens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: History */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Resume Download & Payment Audit History</span>
              </h3>

              {historyData.payments?.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  No resume downloads yet. Build and download your first resume to view history!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Session ID</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">OTP Verified</th>
                        <th className="py-2.5 px-3">Payment Status</th>
                        <th className="py-2.5 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historyData.payments?.map((pay: any) => (
                        <tr key={pay._id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-700">
                            {pay._id.substring(0, 10)}...
                          </td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">₹{pay.amount}</td>
                          <td className="py-2.5 px-3">
                            {pay.otpVerified ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px]">
                                VERIFIED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold text-[10px]">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold uppercase text-[10px] text-gray-600">
                            {pay.paymentStatus}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500">
                            {new Date(pay.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1 MODAL: Security Email OTP Verification */}
        {isOtpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
              <button
                onClick={() => setIsOtpModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>

              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>

              <h3 className="text-center text-lg font-black text-gray-900">
                Security OTP Verification
              </h3>
              <p className="text-center text-xs text-gray-500 mb-4">
                Task 4 Critical Rule: The ₹50 payment gateway is ONLY enabled after OTP is successfully verified.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full text-center tracking-widest text-lg font-mono font-bold px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingDownload || otpCode.length < 6}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isProcessingDownload ? "Verifying..." : "Verify OTP & Unlock Gateway"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 2 MODAL: Razorpay ₹50 Payment Gateway */}
        {isPaymentGatewayOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100">
              {/* Razorpay Branded Header */}
              <div className="bg-[#0c2340] text-white p-5 relative">
                <button
                  onClick={() => setIsPaymentGatewayOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#008BDC] text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                    R
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-white tracking-wide">
                        Razorpay
                      </h4>
                      <span className="text-[10px] bg-amber-400 text-gray-900 font-extrabold px-1.5 py-0.5 rounded">
                        TEST MODE
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">Internshala Premium Portal</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-baseline">
                  <span className="text-xs text-gray-300 uppercase tracking-wider">Amount Payable</span>
                  <span className="text-2xl font-black text-white">₹50.00</span>
                </div>
              </div>

              {/* Payment Details & Methods */}
              <div className="p-5 space-y-4">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center space-x-2 text-amber-800">
                  <span className="text-base shrink-0">⚡</span>
                  <span>
                    <strong>Test Mode Active:</strong> No real payment is required. Razorpay sandbox verification will simulate ₹50 payment and immediately unlock your PDF download.
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center space-x-2 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Identity Verified:</strong> OTP authentication succeeded for <em>{personalDetails.email || user?.email}</em>
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Select Payment Method
                  </p>
                  
                  {/* Method 1: UPI */}
                  <label className="flex items-center justify-between p-3 border border-purple-500 bg-purple-50/50 rounded-xl cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                        UPI
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">UPI / QR Code</div>
                        <div className="text-[11px] text-gray-500">Google Pay, PhonePe, Paytm, BHIM</div>
                      </div>
                    </div>
                    <input type="radio" name="paymethod" defaultChecked className="accent-purple-600" />
                  </label>

                  {/* Method 2: Cards */}
                  <label className="flex items-center justify-between p-3 border border-gray-200 hover:border-gray-300 rounded-xl cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Card (Debit / Credit)</div>
                        <div className="text-[11px] text-gray-500">Visa, MasterCard, RuPay, Maestro</div>
                      </div>
                    </div>
                    <input type="radio" name="paymethod" className="accent-purple-600" />
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentGatewayOpen(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCompletePaymentAndDownload}
                    disabled={isProcessingDownload}
                    className="flex-2 py-3 px-4 bg-[#008BDC] hover:bg-[#0077bc] text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isProcessingDownload ? (
                      <span>Generating PDF...</span>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pay ₹50.00 (Test Mode) & Download PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
