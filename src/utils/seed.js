// Chay: npm run seed
// Tao san 1 tai khoan admin va vai goi lieu trinh mau de test nhanh
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Staff = require("../models/Staff");
const ServicePackage = require("../models/ServicePackage");

async function seed() {
  await connectDB();

  const adminExists = await Staff.findOne({ username: "admin" });
  if (!adminExists) {
    const passwordHash = await Staff.hashPassword("admin123");
    await Staff.create({
      fullName: "Quan tri vien",
      username: "admin",
      passwordHash,
      role: "admin",
    });
    console.log("Da tao tai khoan admin / admin123");
  }

  const techExists = await Staff.findOne({ username: "kythuatvien1" });
  if (!techExists) {
    const passwordHash = await Staff.hashPassword("123456");
    await Staff.create({
      fullName: "Nguyen Thi Ky Thuat",
      username: "kythuatvien1",
      passwordHash,
      role: "technician",
      workingHours: "08:00-20:00",
    });
    console.log("Da tao tai khoan ky thuat vien mau");
  }

  const pkgCount = await ServicePackage.countDocuments();
  if (pkgCount === 0) {
    await ServicePackage.insertMany([
      {
        name: "Cham soc da co ban 5 buoi",
        description: "Lam sach sau, cap am, massage mat",
        services: ["Lam sach da", "Cap am", "Massage mat"],
        totalSessions: 5,
        durationDays: 60,
        price: 2500000,
      },
      {
        name: "Triet long tay 10 buoi",
        description: "Lieu trinh triet long vinh vien vung tay",
        services: ["Triet long IPL"],
        totalSessions: 10,
        durationDays: 180,
        price: 6000000,
      },
      {
        name: "Tri mun chuyen sau 8 buoi",
        description: "Dieu tri mun, tham nam, phuc hoi da",
        services: ["Lay nhan mun", "Dien di duong chat", "Dap mat na"],
        totalSessions: 8,
        durationDays: 90,
        price: 5200000,
      },
    ]);
    console.log("Da tao 3 goi lieu trinh mau");
  }

  console.log("Seed du lieu hoan tat");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
