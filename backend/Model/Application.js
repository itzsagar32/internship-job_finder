const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const Applicationipschema = new mongoose.Schema({
  company: String,
  companyId: String,
  category: String,
  coverLetter: String,
  user: Object,
  title: String,
  opportunityId: String,
  opportunityType: {
    type: String,
    enum: ["internship", "job"],
    default: "internship",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["accepted", "pending", "rejected"],
    default: "pending",
  },
  Application: Object,
});

let MongooseApplicationModel;
try {
  MongooseApplicationModel = mongoose.model("Application");
} catch {
  MongooseApplicationModel = mongoose.model("Application", Applicationipschema);
}

const FallbackApplicationModel = createCollection("applications");

const ApplicationModel = new Proxy(FallbackApplicationModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseApplicationModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseApplicationModel(...args);
    }
    return new target(...args);
  },
});

module.exports = ApplicationModel;
