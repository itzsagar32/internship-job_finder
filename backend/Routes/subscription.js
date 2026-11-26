const express = require("express");
const router = express.Router();
const Subscription = require("../Model/Subscription");
const Invoice = require("../Model/Invoice");
const User = require("../Model/User");
const { verifyToken, optionalAuth } = require("../middleware/auth");

const PLANS = {
  Free: {
    id: "Free",
    name: "Free",
    price: 0,
    applicationsAllowed: 1,
    description: "1 application per month",
  },
  Bronze: {
    id: "Bronze",
    name: "Bronze",
    price: 100,
    applicationsAllowed: 3,
    description: "3 applications per month",
  },
  Silver: {
    id: "Silver",
    name: "Silver",
    price: 300,
    applicationsAllowed: 5,
    description: "5 applications per month",
  },
  Gold: {
    id: "Gold",
    name: "Gold",
    price: 1000,
    applicationsAllowed: -1, // -1 means unlimited
    description: "Unlimited applications per month",
  },
};

// Check if current server time is in IST window: 5:00 AM to 11:45 AM IST (Strictly Enforced)
function checkPaymentTimeWindow(req) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === "hour");
  const minutePart = parts.find((p) => p.type === "minute");
  const hours = parseInt(hourPart ? hourPart.value : "0", 10);
  const minutes = parseInt(minutePart ? minutePart.value : "0", 10);
  const totalMinutes = hours * 60 + minutes;

  // 5:00 AM = 300 minutes, 11:45 AM = 705 minutes
  const allowed = totalMinutes >= 300 && totalMinutes <= 705;
  const currentIST = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} IST`;

  return { allowed, currentIST };
}

// 1. Get all subscription plans
router.get("/plans", (req, res) => {
  const timeCheck = checkPaymentTimeWindow(req);
  return res.json({
    plans: Object.values(PLANS),
    timeGating: {
      isPaymentWindowOpen: timeCheck.allowed,
      currentIST: timeCheck.currentIST,
      allowedWindow: "05:00 AM - 11:45 AM IST",
    },
  });
});

// Helper: Get or initialize user active subscription
async function getOrCreateActiveSubscription(userId, userEmail, userName = "") {
  let sub = await Subscription.findOne({
    userId: String(userId),
    status: "active",
  });

  // If none or expired, create default Free subscription
  if (!sub) {
    sub = new Subscription({
      userId: String(userId),
      userEmail: userEmail || "",
      userName: userName || "",
      plan: "Free",
      price: 0,
      applicationsAllowed: 1,
      applicationsUsed: 0,
      billingCycleStart: new Date(),
      billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "active",
      createdAt: new Date(),
    });
    await sub.save();
  } else {
    // Check if billing cycle has expired
    const cycleEnd = new Date(sub.billingCycleEnd);
    if (Date.now() > cycleEnd.getTime()) {
      // Reset cycle count
      sub.billingCycleStart = new Date();
      sub.billingCycleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      sub.applicationsUsed = 0;
      await sub.save();
    }
  }

  return sub;
}

// 2. Get current user's subscription & quota status
router.get("/my-subscription", verifyToken, async (req, res) => {
  try {
    const sub = await getOrCreateActiveSubscription(
      req.user.id,
      req.user.email,
      req.user.name
    );

    const isUnlimited = sub.applicationsAllowed === -1;
    const remaining = isUnlimited
      ? "unlimited"
      : Math.max(0, sub.applicationsAllowed - (sub.applicationsUsed || 0));
    const canApply = isUnlimited || (sub.applicationsUsed || 0) < sub.applicationsAllowed;

    const timeCheck = checkPaymentTimeWindow(req);

    return res.json({
      subscription: sub,
      quota: {
        plan: sub.plan,
        applicationsAllowed: isUnlimited ? "Unlimited" : sub.applicationsAllowed,
        applicationsUsed: sub.applicationsUsed || 0,
        remainingApplications: remaining,
        canApply,
      },
      timeGating: {
        isPaymentWindowOpen: timeCheck.allowed,
        currentIST: timeCheck.currentIST,
        allowedWindow: "05:00 AM - 11:45 AM IST",
      },
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({ error: "Failed to retrieve subscription status" });
  }
});

// 3. Initiate payment / create order (CRITICAL TIME-GATING RULE)
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { plan: requestedPlanName } = req.body;
    const plan = PLANS[requestedPlanName];

    if (!plan || plan.id === "Free") {
      return res.status(400).json({ error: "Invalid paid plan selected" });
    }

    // CRITICAL RULE: Server MUST check current time. Payment is ONLY allowed between 5:00 AM and 11:45 AM IST
    const timeCheck = checkPaymentTimeWindow(req);
    if (!timeCheck.allowed) {
      return res.status(403).json({
        error: `Payment initiation blocked. Payments are ONLY allowed between 5:00 AM and 11:45 AM IST. Current server IST time is ${timeCheck.currentIST}.`,
        code: "PAYMENT_TIME_WINDOW_BLOCKED",
        currentIST: timeCheck.currentIST,
        allowedWindow: "05:00 AM - 11:45 AM IST",
      });
    }

    const orderId = `order_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const amountInPaise = plan.price * 100;

    return res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: "INR",
      plan: plan.id,
      planDetails: plan,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_internshala",
      message: "Order initiated successfully within valid IST payment window",
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ error: "Failed to create subscription order" });
  }
});

// 4. Verify payment and update quota + generate mock invoice + mock email confirmation
router.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const { plan: planName, orderId, paymentId } = req.body;
    const plan = PLANS[planName];

    if (!plan) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const activePaymentId =
      paymentId || `pay_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update or create subscription
    let sub = await Subscription.findOne({
      userId: String(req.user.id),
      status: "active",
    });

    const now = new Date();
    const cycleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (sub) {
      sub.plan = plan.name;
      sub.price = plan.price;
      sub.applicationsAllowed = plan.applicationsAllowed;
      sub.applicationsUsed = 0; // Fresh quota on upgrade
      sub.billingCycleStart = now;
      sub.billingCycleEnd = cycleEnd;
      sub.paymentId = activePaymentId;
      sub.orderId = orderId || "";
      sub.invoiceId = invoiceNumber;
      await sub.save();
    } else {
      sub = new Subscription({
        userId: String(req.user.id),
        userEmail: req.user.email,
        userName: req.user.name || "",
        plan: plan.name,
        price: plan.price,
        applicationsAllowed: plan.applicationsAllowed,
        applicationsUsed: 0,
        billingCycleStart: now,
        billingCycleEnd: cycleEnd,
        status: "active",
        paymentId: activePaymentId,
        orderId: orderId || "",
        invoiceId: invoiceNumber,
        createdAt: now,
      });
      await sub.save();
    }

    // Generate Mock Invoice
    const invoice = new Invoice({
      invoiceNumber,
      userId: String(req.user.id),
      userEmail: req.user.email,
      userName: req.user.name || "Student",
      type: "subscription",
      plan: plan.name,
      amount: plan.price,
      currency: "INR",
      paymentId: activePaymentId,
      status: "paid",
      items: [
        {
          description: `Internshala ${plan.name} Monthly Subscription (${plan.description})`,
          amount: plan.price,
          quantity: 1,
        },
      ],
      createdAt: now,
    });
    await invoice.save();

    // Mock Email Confirmation
    console.log("\n==================================================================");
    console.log(`📧 [MOCK EMAIL CONFIRMATION] Subscription Payment Successful!`);
    console.log(`To: ${req.user.email} (${req.user.name})`);
    console.log(`Subject: Your Internshala ${plan.name} Subscription is Active!`);
    console.log(`Invoice Number: ${invoiceNumber}`);
    console.log(`Amount Paid: ₹${plan.price} INR`);
    console.log(`Application Quota: ${plan.applicationsAllowed === -1 ? "Unlimited" : plan.applicationsAllowed} applications`);
    console.log(`Valid Until: ${cycleEnd.toDateString()}`);
    console.log("==================================================================\n");

    return res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name} subscription!`,
      subscription: sub,
      invoice: {
        invoiceNumber,
        amount: plan.price,
        plan: plan.name,
        date: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ error: "Failed to verify subscription payment" });
  }
});

// 5. Get user's invoices
router.get("/invoices", verifyToken, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: String(req.user.id) });
    return res.json({ invoices });
  } catch (error) {
    console.error("Get invoices error:", error);
    return res.status(500).json({ error: "Failed to retrieve invoices" });
  }
});

module.exports = {
  router,
  getOrCreateActiveSubscription,
  checkPaymentTimeWindow,
  PLANS,
};
