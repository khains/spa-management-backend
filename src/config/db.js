const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Thieu MONGODB_URI trong file .env");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("Da ket noi MongoDB Atlas thanh cong");
  } catch (err) {
    console.error("Loi ket noi MongoDB:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
