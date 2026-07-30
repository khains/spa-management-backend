const mongoose = require("mongoose");

const servicePackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    // Danh sach dich vu bao gom trong goi, vi du ["Cham soc da co ban", "Triet long"]
    services: [{ type: String }],
    totalSessions: { type: Number, required: true, min: 1 },
    // Thoi han hieu luc tinh theo ngay ke tu ngay bat dau su dung
    durationDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServicePackage", servicePackageSchema);
