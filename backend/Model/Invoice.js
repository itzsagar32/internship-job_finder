const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    enum: ["subscription", "resume"],
    default: "subscription",
  },
  plan: {
    type: String,
    default: "",
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "INR",
  },
  paymentId: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    default: "paid",
  },
  items: [
    {
      description: String,
      amount: Number,
      quantity: { type: Number, default: 1 },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let MongooseInvoiceModel;
try {
  MongooseInvoiceModel = mongoose.model("Invoice");
} catch {
  MongooseInvoiceModel = mongoose.model("Invoice", InvoiceSchema);
}

const FallbackInvoiceModel = createCollection("invoices");

const InvoiceModel = new Proxy(FallbackInvoiceModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseInvoiceModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseInvoiceModel(...args);
    }
    return new target(...args);
  },
});

module.exports = InvoiceModel;
