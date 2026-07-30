const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");

// Bat buoc dang nhap
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Chua dang nhap (thieu token)" });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const staff = await Staff.findById(payload.id).select("-passwordHash");
    if (!staff || !staff.active) {
      return res.status(401).json({ message: "Tai khoan khong hop le" });
    }
    req.staff = staff;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token khong hop le hoac het han" });
  }
}

// Gioi han theo vai tro, vi du requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.staff || !roles.includes(req.staff.role)) {
      return res.status(403).json({ message: "Khong co quyen thuc hien thao tac nay" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
