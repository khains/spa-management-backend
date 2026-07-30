const mongoose = require("mongoose");

const visitNoteSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    content: { type: String, required: true },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    dob: { type: Date },
    gender: { type: String, enum: ["nam", "nu", "khac"], default: "khac" },
    address: { type: String, trim: true },
    // Ghi chu tinh trang da lieu, di ung, luu y rieng
    skinNotes: { type: String, default: "" },
    // Nguon khach: gioi thieu, facebook, tiktok, walk-in, website, khac...
    source: { type: String, default: "khac" },
    // Phan loai duoc tinh toan lai moi khi truy van (xem utils/classify.js)
    // nhung cung cho phep gan co dinh (vd VIP) qua truong manualTag
    manualTag: { type: String, enum: ["", "vip"], default: "" },
    // Lich su ghi chu noi bo (khong phai lich su buoi hen - xem model Appointment)
    internalNotes: [visitNoteSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerSchema.index({ fullName: "text", phone: "text" });

module.exports = mongoose.model("Customer", customerSchema);
