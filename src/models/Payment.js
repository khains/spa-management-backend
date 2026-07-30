const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    customerPackage: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerPackage", default: null },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["tien_mat", "chuyen_khoan", "tra_gop"], required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    // Danh cho phuong thuc tra gop
    installment: {
      totalAmount: { type: Number, default: 0 },
      installmentNumber: { type: Number, default: 1 }, // lan tra thu may
      totalInstallments: { type: Number, default: 1 },
    },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
