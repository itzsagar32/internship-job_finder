const mongoose = require("mongoose");
const { initStore } = require("./data/store");
require("dotenv").config();

let isConnectedToMongo = false;

const connect = async () => {
  const url =
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    "mongodb://localhost:27017/internshala_clone";

  try {
    console.log(`Attempting to connect to MongoDB at: ${url}...`);
    // Connect with a 2.5s server selection timeout so fallback triggers promptly if mongod is not running
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnectedToMongo = true;
    console.log("MongoDB is successfully connected!");
  } catch (err) {
    console.warn(
      `Warning: Could not connect to MongoDB server (${err.message}).`
    );
    console.log(
      "Activating high-performance resilient in-memory & file-backed fallback storage engine..."
    );
    await initStore();
    isConnectedToMongo = false;
    console.log("Fallback database engine initialized successfully.");
  }
};

const getIsConnectedToMongo = () => isConnectedToMongo;

module.exports = {
  connect,
  getIsConnectedToMongo,
};