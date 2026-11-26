const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const Jobschema = new mongoose.Schema({
  title: String,
  company: String,
  companyId: String,
  location: String,
  category: String,
  aboutCompany: String,
  aboutJob: String,
  whoCanApply: String,
  perks: Array,
  numberOfOpening: String,
  Salary: String,
  startDate: String,
  Experience: String,
  additionalInfo: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let MongooseJobModel;
try {
  MongooseJobModel = mongoose.model("Job");
} catch {
  MongooseJobModel = mongoose.model("Job", Jobschema);
}

const FallbackJobModel = createCollection("jobs");

const JobModel = new Proxy(FallbackJobModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseJobModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseJobModel(...args);
    }
    return new target(...args);
  },
});

module.exports = JobModel;
