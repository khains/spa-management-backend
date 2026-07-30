const express = require("express");
const ServicePackage = require("../models/ServicePackage");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/packages
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const packages = await ServicePackage.find({ active: true }).sort({ createdAt: -1 });
    res.json(packages);
  })
);

// POST /api/packages
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, description, services, totalSessions, durationDays, price } = req.body;
    if (!name || !totalSessions || !durationDays || price === undefined) {
      return res.status(400).json({ message: "Thieu thong tin bat buoc" });
    }
    const pkg = await ServicePackage.create({
      name,
      description,
      services,
      totalSessions,
      durationDays,
      price,
    });
    res.status(201).json(pkg);
  })
);

// PUT /api/packages/:id
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const allowed = ["name", "description", "services", "totalSessions", "durationDays", "price", "active"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const pkg = await ServicePackage.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!pkg) return res.status(404).json({ message: "Khong tim thay goi dich vu" });
    res.json(pkg);
  })
);

// DELETE /api/packages/:id - ngung kinh doanh (xoa mem)
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const pkg = await ServicePackage.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!pkg) return res.status(404).json({ message: "Khong tim thay goi dich vu" });
    res.json({ message: "Da ngung kinh doanh goi nay" });
  })
);

module.exports = router;
