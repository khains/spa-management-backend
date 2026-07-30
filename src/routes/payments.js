const express = require("express");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/payments?customer=&customerPackage=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { customer, customerPackage } = req.query;
    const filter = {};
    if (customer) filter.customer = customer;
    if (customerPackage) filter.customerPackage = customerPackage;
    const payments = await Payment.find(filter)
      .populate("customer", "fullName phone")
      .populate("receivedBy", "fullName")
      .sort({ date: -1 });
    res.json(payments);
  })
);

// POST /api/payments - ghi nhan thanh toan
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { customerId, customerPackageId, amount, method, note, installment } = req.body;
    if (!customerId || amount === undefined || !method) {
      return res.status(400).json({ message: "Thieu customerId, amount hoac method" });
    }
    const payment = await Payment.create({
      customer: customerId,
      customerPackage: customerPackageId || null,
      amount,
      method,
      note,
      installment: method === "tra_gop" ? installment : undefined,
      receivedBy: req.staff._id,
    });
    res.status(201).json(payment);
  })
);

// GET /api/payments/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
      .populate("customer", "fullName phone")
      .populate("receivedBy", "fullName");
    if (!payment) return res.status(404).json({ message: "Khong tim thay giao dich" });
    res.json(payment);
  })
);

module.exports = router;
