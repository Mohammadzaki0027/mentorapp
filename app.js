const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");
const usersRoutes = require("./src/routes/usersRoutes");
 const countriesRoutes = require("./src/routes/countriesRoutes");
const universitiesRoutes = require("./src/routes/universitiesRoutes");
 const shortlistsRoutes = require("./src/routes/shortlistsRoutes");
 const applicationsRoutes = require("./src/routes/applicationsRoutes");
 const testimonialsRoutes = require("./src/routes/testimonialsRoutes");
 const referralsRoutes = require("./src/routes/referralRoutes");
 const mentorsRoutes = require("./src/routes/mentorsRoutes");
 const simpleEndpointsRoutes = require("./src/routes/simpleRoutes");

const {
  dashboardRouter,
  studentsRouter,
  universitiesAdminRouter,
  applicationsAdminRouter,
  reportsRouter,
  rolesRouter,
  countriesAdminRouter,
  testimonialsAdminRouter,

} = require("./src/routes/admin/adminRoutes");

const app = express();

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["*"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  return res.status(200).json({ status: "healthy", timestamp: "2024-01-01T00:00:00Z" });
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/countries", countriesRoutes);
app.use("/universities", universitiesRoutes);
app.use("/shortlists", shortlistsRoutes);
app.use("/applications", applicationsRoutes);
app.use("/testimonials", testimonialsRoutes);
app.use("/referrals", referralsRoutes);
app.use("/mentors", mentorsRoutes);
app.use("/", simpleEndpointsRoutes);

app.use("/admin/dashboard", dashboardRouter);
app.use("/admin/students", studentsRouter);
app.use("/admin/universities", universitiesAdminRouter);
app.use("/admin/applications", applicationsAdminRouter);
app.use("/admin/reports", reportsRouter);
app.use("/admin/roles", rolesRouter);
app.use("/admin/countries", countriesAdminRouter);
app.use("/admin/testimonials", testimonialsAdminRouter);

app.use((req, res) => res.status(404).json({ detail: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(err.statusCode || 500).json({ detail: err.message || "Internal server error" });
});

module.exports = app;
