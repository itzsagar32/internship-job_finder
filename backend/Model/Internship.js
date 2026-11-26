const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const Internshipschema = new mongoose.Schema({
  title: String,
  company: String,
  companyId: String,
  location: String,
  category: String,
  aboutCompany: String,
  aboutInternship: String,
  whoCanApply: String,
  perks: Array,
  numberOfOpening: String,
  stipend: String,
  startDate: String,
  duration: String,
  additionalInfo: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let MongooseInternshipModel;
try {
  MongooseInternshipModel = mongoose.model("Internship");
} catch {
  MongooseInternshipModel = mongoose.model("Internship", Internshipschema);
}

const FallbackInternshipModel = createCollection("internships");

const InternshipModel = new Proxy(FallbackInternshipModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseInternshipModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseInternshipModel(...args);
    }
    return new target(...args);
  },
});

module.exports = InternshipModel;
