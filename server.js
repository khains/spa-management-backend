require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/auth");
const customerRoutes = require("./src/routes/customers");
const packageRoutes = require("./src/routes/packages");
const customerPackageRoutes = require("./src/routes/customerPackages");
const appointmentRoutes = require("./src/routes/appointments");
const paymentRoutes = require("./src/routes/payments");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/customer-packages", customerPackageRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Khong tim thay endpoint" });
});

// Error handler chung
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Loi may chu" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server dang chay tai cong ${PORT}`));
});
