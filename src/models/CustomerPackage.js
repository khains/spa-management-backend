const mongoose = require("mongoose");

const customerPackageSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    servicePackage: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePackage", required: true },
    // Luu lai ten/gia tai thoi diem ban phong khi mau goi bi sua sau nay
    packageNameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true },
    sessionsTotal: { type: Number, required: true },
    sessionsUsed: { type: Number, default: 0 },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    // mua_moi | gia_han
    type: { type: String, enum: ["mua_moi", "gia_han"], default: "mua_moi" },
    // renewedFrom: neu day la ban gia han cua 1 goi cu
    renewedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerPackage", default: null },
    status: {
      type: String,
      enum: ["active", "completed", "expired", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

customerPackageSchema.virtual("sessionsRemaining").get(function () {
  return Math.max(this.sessionsTotal - this.sessionsUsed, 0);
});

customerPackageSchema.set("toJSON", { virtuals: true });
customerPackageSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("CustomerPackage", customerPackageSchema);
