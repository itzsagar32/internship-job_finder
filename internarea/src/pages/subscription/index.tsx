import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import api from "@/utils/api";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  CreditCard,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  Download,
} from "lucide-react";
import { useI18n } from "@/utils/i18n";

interface Plan {
  id: string;
  name: string;
  price: number;
  applicationsAllowed: number;
  description: string;
}

interface SubscriptionData {
  plan: string;
  price: number;
  applicationsAllowed: number | string;
  applicationsUsed: number;
  remainingApplications: number | string;
  canApply: boolean;
}

interface TimeGatingData {
  isPaymentWindowOpen: boolean;
  currentIST: string;
  allowedWindow: string;
}

export default function SubscriptionPage() {
  const user = useSelector(selectuser);
  const { t } = useI18n();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentQuota, setCurrentQuota] = useState<SubscriptionData | null>(null);
  const [timeGating, setTimeGating] = useState<TimeGatingData>({
    isPaymentWindowOpen: false,
    currentIST: "Checking...",
    allowedWindow: "05:00 AM - 11:45 AM IST",
  });
  const [loading, setLoading] = useState(true);

  // Payment checkout state
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidInvoice, setPaidInvoice] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const [plansRes, mySubRes] = await Promise.all([
        api.get("/subscription/plans"),
        api.get("/subscription/my-subscription").catch(() => null),
      ]);

      if (plansRes.data) {
        setPlans(plansRes.data.plans || []);
        if (plansRes.data.timeGating) {
          setTimeGating(plansRes.data.timeGating);
        }
      }

      if (mySubRes && mySubRes.data) {
        setCurrentQuota(mySubRes.data.quota);
        if (mySubRes.data.timeGating) {
          setTimeGating(mySubRes.data.timeGating);
        }
      }

      // Fetch invoices
      if (user) {
        const invRes = await api.get("/subscription/invoices").catch(() => null);
        if (invRes && invRes.data) {
          setInvoices(invRes.data.invoices || []);
        }
      }
    } catch (err: any) {
      console.error("Failed to load subscription info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionInfo();
  }, [user]);

  const handleInitiateUpgrade = async (plan: Plan) => {
    if (!user) {
      toast.warning("Please log in to upgrade your subscription plan");
      return;
    }

    if (plan.id === "Free") {
      toast.info("Free plan is automatically active by default");
      return;
    }

    setSelectedPlan(plan);
    setIsProcessing(true);

    try {
      // Check time gating via create-order endpoint
      const res = await api.post("/subscription/create-order", {
        plan: plan.id,
      });

      if (res.data.success) {
        setIsCheckoutOpen(true);
        toast.info(
          `Payment initiated within valid window! Order ID: ${res.data.orderId}`
        );
      }
    } catch (error: any) {
      const errData = error.response?.data;
      if (errData?.code === "PAYMENT_TIME_WINDOW_BLOCKED") {
        toast.error(
          `🚫 Payment Blocked: Payments are ONLY permitted between 5:00 AM and 11:45 AM IST. (Current Server IST: ${errData.currentIST})`
        );
      } else {
        toast.error(errData?.error || "Failed to initiate payment");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);

    try {
      const res = await api.post("/subscription/verify-payment", {
        plan: selectedPlan.id,
        orderId: `order_sub_${Date.now()}`,
        paymentId: `pay_mock_${Date.now()}`,
      });

      if (res.data.success) {
        setPaidInvoice(res.data.invoice);
        toast.success(
          `🎉 Success! Upgraded to ${selectedPlan.name} Plan. Quota updated!`
        );
        setIsCheckoutOpen(false);
        fetchSubscriptionInfo();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Payment verification failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>Subscriptions & Plans | Internshala</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Task 3 Enterprise Requirement</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            {t("subscription_title")}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Choose a plan tailored to your internship & job application needs. All plans feature monthly quota resets and instant enterprise invoices.
          </p>
        </div>

        {/* TIME-GATING SECURITY STATUS BANNER (CRITICAL RULE) */}
        <div
          className={`mb-8 p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
            timeGating.isPaymentWindowOpen
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              : "bg-amber-50/80 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`p-2 rounded-lg mt-0.5 ${
                timeGating.isPaymentWindowOpen ? "bg-emerald-200" : "bg-amber-200"
              }`}
            >
              <Clock className="w-5 h-5 text-gray-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold">
                  Payment Gateway Time-Gating Window: 5:00 AM – 11:45 AM IST
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    timeGating.isPaymentWindowOpen
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {timeGating.isPaymentWindowOpen ? "WINDOW OPEN" : "WINDOW CLOSED"}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                <strong>Current Server Time:</strong> {timeGating.currentIST} |{" "}
                <strong>Allowed Window:</strong> {timeGating.allowedWindow}
                {!timeGating.isPaymentWindowOpen &&
                  " (Payment initiation is strictly rejected outside this window by server middleware)."}
              </p>
            </div>
          </div>
        </div>

        {/* Current Active User Quota Card */}
        {user && currentQuota && (
          <div className="mb-10 p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
                  Your Current Subscription
                </span>
                <div className="flex items-center space-x-3 mt-1">
                  <h2 className="text-2xl font-black">{currentQuota.plan} Plan</h2>
                  <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-100 rounded-full text-xs font-medium border border-blue-400/30">
                    Active
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  Monthly Quota:{" "}
                  <strong>{currentQuota.applicationsAllowed} applications</strong> / month
                </p>
              </div>

              <div className="flex items-center space-x-6 bg-white/10 px-5 py-3 rounded-xl border border-white/10">
                <div className="text-center">
                  <div className="text-xs text-blue-200 uppercase font-bold">Used</div>
                  <div className="text-xl font-extrabold text-white">
                    {currentQuota.applicationsUsed}
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-xs text-blue-200 uppercase font-bold">Remaining</div>
                  <div className="text-xl font-extrabold text-amber-300">
                    {currentQuota.remainingApplications}
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-xs text-blue-200 uppercase font-bold">Can Apply?</div>
                  <div
                    className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${
                      currentQuota.canApply
                        ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
                        : "bg-red-500/30 text-red-200 border border-red-400/30"
                    }`}
                  >
                    {currentQuota.canApply ? "YES" : "QUOTA EXHAUSTED"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => {
            const isCurrent = currentQuota?.plan === plan.id;
            const isGold = plan.id === "Gold";
            const isSilver = plan.id === "Silver";

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between bg-white rounded-2xl border transition shadow-sm hover:shadow-md p-6 ${
                  isCurrent
                    ? "border-blue-600 ring-2 ring-blue-600"
                    : isGold
                    ? "border-amber-400"
                    : "border-gray-200"
                }`}
              >
                {isGold && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-xs">
                    Best Value - Unlimited
                  </div>
                )}
                {isSilver && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-xs">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 min-h-[32px]">
                    {plan.description}
                  </p>

                  <div className="mt-4 mb-6">
                    <span className="text-3xl font-black text-gray-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-gray-500 font-medium"> / month</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-gray-600 border-t pt-4">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>
                          {plan.applicationsAllowed === -1
                            ? "Unlimited"
                            : plan.applicationsAllowed}
                        </strong>{" "}
                        applications / month
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Real-time instant notifications</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Application status tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Automated Tax & GST Invoice</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 bg-gray-100 text-gray-500 font-bold text-xs rounded-xl cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : plan.id === "Free" ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 bg-gray-50 text-gray-400 font-semibold text-xs rounded-xl cursor-default"
                    >
                      Default Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInitiateUpgrade(plan)}
                      disabled={isProcessing}
                      className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 ${
                        isGold
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <span>Upgrade to {plan.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Invoice Modal after Successful Payment */}
        {paidInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-center text-lg font-black text-gray-900">
                Payment & Invoice Generated!
              </h3>
              <p className="text-center text-xs text-gray-500 mb-4">
                Mock email confirmation has been sent to your registered address.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Number:</span>
                  <span className="font-bold">{paidInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan Upgraded:</span>
                  <span className="font-bold text-blue-600">{paidInvoice.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid:</span>
                  <span className="font-bold">₹{paidInvoice.amount} INR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-bold text-emerald-600">PAID & VERIFIED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timestamp:</span>
                  <span>{new Date(paidInvoice.date).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-5 flex space-x-2">
                <button
                  onClick={() => setPaidInvoice(null)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Razorpay Test Mode Checkout Modal */}
        {isCheckoutOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
              <div className="flex items-center justify-between pb-3 border-b mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    R
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      Razorpay Gateway (Test Mode)
                    </h4>
                    <p className="text-[10px] text-gray-500">Secured 256-bit SSL</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg border text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Item:</span>
                    <span className="font-bold text-gray-800">
                      Internshala {selectedPlan.name} Subscription
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 mt-1">
                    <span>Application Allowance:</span>
                    <span className="font-bold text-gray-800">
                      {selectedPlan.applicationsAllowed === -1
                        ? "Unlimited"
                        : selectedPlan.applicationsAllowed}{" "}
                      apps
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-800 font-bold border-t mt-2 pt-2 text-sm">
                    <span>Total Payable:</span>
                    <span className="text-blue-600">₹{selectedPlan.price} INR</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                  <p>
                    Verified: Request passed IST time window check (5:00 AM - 11:45 AM).
                  </p>
                </div>

                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center space-x-1.5">
                  <span>⚡</span>
                  <span><strong>Test Mode:</strong> No real payment is required. Simulating sandbox upgrade.</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? "Verifying..." : `Pay ₹${selectedPlan.price} (Test Mode)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice History Section */}
        {invoices.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>Payment & Invoice History</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Plan / Item</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv._id || inv.invoiceNumber} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-800">
                        {inv.plan || inv.type}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">
                        ₹{inv.amount}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px]">
                          PAID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
