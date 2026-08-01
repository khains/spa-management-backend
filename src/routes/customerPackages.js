const express = require("express");
const CustomerPackage = require("../models/CustomerPackage");
const ServicePackage = require("../models/ServicePackage");
const Customer = require("../models/Customer");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// GET /api/customer-packages?status=active&lowSessions=true&expiringSoon=true
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, customer } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customer) filter.customer = customer;

    let list = await CustomerPackage.find(filter)
      .populate("customer", "fullName phone")
      .populate("servicePackage", "name")
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const lowThreshold = Number(process.env.LOW_SESSION_THRESHOLD || 2);
    const expDays = Number(process.env.EXPIRING_SOON_DAYS || 7);

    list = list.map((p) => {
      const remaining = p.sessionsTotal - p.sessionsUsed;
      const daysLeft = Math.ceil((new Date(p.endDate) - now) / (1000 * 60 * 60 * 24));
      return {
        ...p,
        sessionsRemaining: remaining,
        daysLeft,
        lowSessions: p.status === "active" && remaining <= lowThreshold && remaining > 0,
        expiringSoon: p.status === "active" && daysLeft >= 0 && daysLeft <= expDays,
      };
    });

    if (req.query.lowSessions === "true") list = list.filter((p) => p.lowSessions);
    if (req.query.expiringSoon === "true") list = list.filter((p) => p.expiringSoon);

    res.json(list);
  })
);

// POST /api/customer-packages - gan goi moi cho khach (mua moi)
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { customerId, servicePackageId, startDate } = req.body;
    if (!customerId || !servicePackageId) {
      return res.status(400).json({ message: "Thieu customerId hoac servicePackageId" });
    }
    const [customer, servicePackage] = await Promise.all([
      Customer.findById(customerId),
      ServicePackage.findById(servicePackageId),
    ]);
    if (!customer) return res.status(404).json({ message: "Khong tim thay khach hang" });
    if (!servicePackage) return res.status(404).json({ message: "Khong tim thay goi dich vu" });

    const start = startDate ? new Date(startDate) : new Date();
    const end = addDays(start, servicePackage.durationDays);

    const customerPackage = await CustomerPackage.create({
      customer: customer._id,
      servicePackage: servicePackage._id,
      packageNameSnapshot: servicePackage.name,
      priceSnapshot: servicePackage.price,
      sessionsTotal: servicePackage.totalSessions,
      sessionsUsed: 0,
      startDate: start,
      endDate: end,
      type: "mua_moi",
      status: "active",
    });

    res.status(201).json(customerPackage);
  })
);

// POST /api/customer-packages/:id/renew - gia han goi (tao ban ghi moi lien ket toi ban cu)
router.post(
  "/:id/renew",
  asyncHandler(async (req, res) => {
    const oldPkg = await CustomerPackage.findById(req.params.id).populate("servicePackage");
    if (!oldPkg) return res.status(404).json({ message: "Khong tim thay goi cua khach" });

    const { startDate, sessionsTotal, durationDays } = req.body;
    const start = startDate ? new Date(startDate) : new Date();
    const totalSessions = sessionsTotal || oldPkg.servicePackage.totalSessions;
    const duration = durationDays || oldPkg.servicePackage.durationDays;
    const end = addDays(start, duration);

    oldPkg.status = "completed";
    await oldPkg.save();

    const newPkg = await CustomerPackage.create({
      customer: oldPkg.customer,
      servicePackage: oldPkg.servicePackage._id,
      packageNameSnapshot: oldPkg.servicePackage.name,
      priceSnapshot: oldPkg.servicePackage.price,
      sessionsTotal: totalSessions,
      sessionsUsed: 0,
      startDate: start,
      endDate: end,
      type: "gia_han",
      renewedFrom: oldPkg._id,
      status: "active",
    });

    res.status(201).json(newPkg);
  })
);

// GET /api/customer-packages/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const pkg = await CustomerPackage.findById(req.params.id)
      .populate("customer", "fullName phone")
      .populate("servicePackage");
    if (!pkg) return res.status(404).json({ message: "Khong tim thay goi cua khach" });
    res.json(pkg);
  })
);

// PUT /api/customer-packages/:id - chinh sua thu cong (vd huy goi)
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const allowed = ["status", "sessionsUsed", "endDate"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const pkg = await CustomerPackage.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!pkg) return res.status(404).json({ message: "Khong tim thay goi cua khach" });
    res.json(pkg);
  })
);

// DELETE /api/customer-packages/:id - chi cho phep xoa neu goi chua dung buoi nao
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const pkg = await CustomerPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Khong tim thay goi cua khach" });
    if (pkg.sessionsUsed > 0) {
      return res.status(400).json({ message: "Chi co the xoa goi chua su dung buoi nao" });
    }
    await pkg.deleteOne();
    res.json({ success: true });
  })
);

module.exports = router;
