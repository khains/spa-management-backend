const express = require("express");
const Customer = require("../models/Customer");
const CustomerPackage = require("../models/CustomerPackage");
const Appointment = require("../models/Appointment");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { classifyCustomer } = require("../utils/classify");

const router = express.Router();
router.use(requireAuth);

const THRESHOLDS = () => ({
  lowSessionThreshold: Number(process.env.LOW_SESSION_THRESHOLD || 2),
  expiringSoonDays: Number(process.env.EXPIRING_SOON_DAYS || 7),
});

// GET /api/customers?search=&tag=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, tag } = req.query;
    const filter = { active: true };
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
    const custIds = customers.map((c) => c._id);
    const allPackages = await CustomerPackage.find({ customer: { $in: custIds } }).lean();

    const packagesByCustomer = {};
    for (const p of allPackages) {
      const key = String(p.customer);
      (packagesByCustomer[key] = packagesByCustomer[key] || []).push(p);
    }

    let result = customers.map((c) => {
      const pkgs = packagesByCustomer[String(c._id)] || [];
      const tags = classifyCustomer(c, pkgs, THRESHOLDS());
      return { ...c, tags };
    });

    if (tag) {
      result = result.filter((c) => c.tags.includes(tag));
    }

    res.json(result);
  })
);

// GET /api/customers/:id - chi tiet + goi + lich su cuoc hen
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id)
      .populate("internalNotes.staff", "fullName")
      .lean();
    if (!customer) return res.status(404).json({ message: "Khong tim thay khach hang" });

    const packages = await CustomerPackage.find({ customer: customer._id })
      .populate("servicePackage")
      .sort({ createdAt: -1 })
      .lean();

    const appointments = await Appointment.find({ customer: customer._id })
      .populate("technician", "fullName")
      .sort({ startTime: -1 })
      .lean();

    const tags = classifyCustomer(customer, packages, THRESHOLDS());

    res.json({ ...customer, tags, packages, appointments });
  })
);

// POST /api/customers
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { fullName, phone, dob, gender, address, skinNotes, source } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ message: "Ho ten va SDT la bat buoc" });
    }
    const customer = await Customer.create({
      fullName,
      phone,
      dob,
      gender,
      address,
      skinNotes,
      source,
    });
    res.status(201).json(customer);
  })
);

// PUT /api/customers/:id
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const allowed = [
      "fullName",
      "phone",
      "dob",
      "gender",
      "address",
      "skinNotes",
      "source",
      "manualTag",
      "active",
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const customer = await Customer.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ message: "Khong tim thay khach hang" });
    res.json(customer);
  })
);

// DELETE /api/customers/:id - xoa mem (chuyen active=false)
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: "Khong tim thay khach hang" });
    res.json({ message: "Da xoa khach hang" });
  })
);

// POST /api/customers/:id/notes - them ghi chu noi bo / lich su tham kham
router.post(
  "/:id/notes",
  asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Thieu noi dung ghi chu" });
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Khong tim thay khach hang" });
    customer.internalNotes.push({ content, staff: req.staff._id, date: new Date() });
    await customer.save();
    res.status(201).json(customer.internalNotes[customer.internalNotes.length - 1]);
  })
);

module.exports = router;
