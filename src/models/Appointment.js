const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    // Buoi lieu trinh se bi tru khi check-in (co the null neu la buoi le/tu van)
    customerPackage: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerPackage", default: null },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    room: { type: String, default: "" },
    serviceName: { type: String, default: "" },
    startTime: { type: Date, required: true, index: true },
    // Thoi luong tinh theo phut, dung de tinh gio trong / xung dot lich
    durationMinutes: { type: Number, default: 60 },
    status: {
      type: String,
      enum: ["booked", "checked_in", "completed", "cancelled", "no_show"],
      default: "booked",
    },
    checkInTime: { type: Date, default: null },
    // Ma check-in ngau nhien de quet QR (tuong ung 1 lich hen)
    checkInCode: { type: String, index: true },
    note: { type: String, default: "" },
    // Ghi chu ket qua sau khi thuc hien xong buoi
    resultNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
