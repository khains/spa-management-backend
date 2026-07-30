const express = require("express");
const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function signToken(staff) {
  return jwt.sign({ id: staff._id, role: staff.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Thieu username hoac password" });
    }
    const staff = await Staff.findOne({ username });
    if (!staff || !staff.active || !(await staff.comparePassword(password))) {
      return res.status(401).json({ message: "Sai tai khoan hoac mat khau" });
    }
    const token = signToken(staff);
    res.json({
      token,
      staff: {
        id: staff._id,
        fullName: staff.fullName,
        username: staff.username,
        role: staff.role,
      },
    });
  })
);

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json(req.staff);
});

// POST /api/auth/staff - tao nhan vien moi (chi admin)
router.post(
  "/staff",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { fullName, username, password, role, phone, workingHours } = req.body;
    if (!fullName || !username || !password) {
      return res.status(400).json({ message: "Thieu thong tin bat buoc" });
    }
    const exists = await Staff.findOne({ username });
    if (exists) return res.status(409).json({ message: "Username da ton tai" });

    const passwordHash = await Staff.hashPassword(password);
    const staff = await Staff.create({
      fullName,
      username,
      passwordHash,
      role,
      phone,
      workingHours,
    });
    res.status(201).json({ id: staff._id, fullName: staff.fullName, username: staff.username });
  })
);

// GET /api/auth/staff - danh sach nhan vien (de chon ky thuat vien khi dat lich)
router.get(
  "/staff",
  requireAuth,
  asyncHandler(async (req, res) => {
    const list = await Staff.find({ active: true }).select("-passwordHash");
    res.json(list);
  })
);

module.exports = router;
