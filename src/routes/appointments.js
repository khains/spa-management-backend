const express = require("express");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const CustomerPackage = require("../models/CustomerPackage");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/appointments?date=YYYY-MM-DD&technician=&status=&customer=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { date, technician, status, customer } = req.query;
    const filter = {};
    if (technician) filter.technician = technician;
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.startTime = { $gte: start, $lt: end };
    }
    const appointments = await Appointment.find(filter)
      .populate("customer", "fullName phone")
      .populate("technician", "fullName")
      .populate("customerPackage")
      .sort({ startTime: 1 });
    res.json(appointments);
  })
);

// GET /api/appointments/availability?technician=&date=YYYY-MM-DD
// Tra ve danh sach cac lich hen da co trong ngay cua ky thuat vien, de FE tu suy ra khung gio trong
router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const { technician, date } = req.query;
    if (!technician || !date) {
      return res.status(400).json({ message: "Can technician va date" });
    }
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const booked = await Appointment.find({
      technician,
      startTime: { $gte: start, $lt: end },
      status: { $in: ["booked", "checked_in", "completed"] },
    })
      .select("startTime durationMinutes")
      .sort({ startTime: 1 });

    res.json({ date, technician, bookedSlots: booked });
  })
);

// POST /api/appointments - dat lich moi
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const {
      customerId,
      customerPackageId,
      technicianId,
      room,
      serviceName,
      startTime,
      durationMinutes,
      note,
    } = req.body;

    if (!customerId || !startTime) {
      return res.status(400).json({ message: "Thieu customerId hoac startTime" });
    }

    if (customerPackageId) {
      const pkg = await CustomerPackage.findById(customerPackageId);
      if (!pkg) return res.status(404).json({ message: "Khong tim thay goi lieu trinh" });
      if (pkg.status !== "active" || pkg.sessionsUsed >= pkg.sessionsTotal) {
        return res.status(400).json({ message: "Goi lieu trinh da het buoi hoac khong con hieu luc" });
      }
    }

    const checkInCode = crypto.randomBytes(4).toString("hex");

    const appointment = await Appointment.create({
      customer: customerId,
      customerPackage: customerPackageId || null,
      technician: technicianId || null,
      room,
      serviceName,
      startTime: new Date(startTime),
      durationMinutes: durationMinutes || 60,
      note,
      checkInCode,
      status: "booked",
    });

    res.status(201).json(appointment);
  })
);

// PUT /api/appointments/:id - sua thong tin lich hen (doi gio, ky thuat vien...)
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const allowed = ["technician", "room", "serviceName", "startTime", "durationMinutes", "note", "status"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!appointment) return res.status(404).json({ message: "Khong tim thay lich hen" });
    res.json(appointment);
  })
);

// POST /api/appointments/:id/checkin - nhan vien nhap tay theo id
router.post(
  "/:id/checkin",
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Khong tim thay lich hen" });
    await doCheckIn(appointment);
    res.json(appointment);
  })
);

// POST /api/appointments/checkin-by-code - quet ma QR/code de check-in
router.post(
  "/checkin-by-code",
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Thieu ma check-in" });
    const appointment = await Appointment.findOne({ checkInCode: code });
    if (!appointment) return res.status(404).json({ message: "Ma check-in khong hop le" });
    await doCheckIn(appointment);
    res.json(appointment);
  })
);

async function doCheckIn(appointment) {
  if (appointment.status === "checked_in" || appointment.status === "completed") {
    const err = new Error("Lich hen nay da duoc check-in truoc do");
    err.status = 400;
    throw err;
  }
  appointment.status = "checked_in";
  appointment.checkInTime = new Date();

  // Tu dong tru 1 buoi trong goi lieu trinh neu co gan goi
  if (appointment.customerPackage) {
    const pkg = await CustomerPackage.findById(appointment.customerPackage);
    if (pkg && pkg.status === "active" && pkg.sessionsUsed < pkg.sessionsTotal) {
      pkg.sessionsUsed += 1;
      if (pkg.sessionsUsed >= pkg.sessionsTotal) {
        pkg.status = "completed";
      }
      await pkg.save();
    }
  }
  await appointment.save();
}

// POST /api/appointments/:id/complete - hoan tat buoi, ghi ket qua
router.post(
  "/:id/complete",
  asyncHandler(async (req, res) => {
    const { resultNote } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "completed", resultNote: resultNote || "" },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: "Khong tim thay lich hen" });
    res.json(appointment);
  })
);

// POST /api/appointments/:id/cancel
router.post(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: "Khong tim thay lich hen" });
    res.json(appointment);
  })
);

module.exports = router;
