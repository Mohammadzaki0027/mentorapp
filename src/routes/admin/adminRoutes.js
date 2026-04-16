const express = require("express");
const multer = require("multer");
const { getCurrentUser, getCurrentAdmin } = require("../../middleware/authMiddleware");

const {
  getDashboardMetrics,
  listStudents,
  getStudent,
  updateStudent,
  addUniversity,
  updateUniversity,
  deleteUniversity,
  listApplications,
  getApplication,
  updateApplication,
  studentConversionReport,
  applicationStatusReport,
  listRoles,
  addAdminRole,
  updateAdminRole,
  removeAdminRole,
  addCountry,
  updateCountry,
  deleteCountry,
  addTestimonial,
  editTestimonial,
  deleteTestimonial,
} = require("../../controllers/admin/adminController");

// Multer for in-memory file uploads (replaces FastAPI UploadFile)
const upload = multer({ storage: multer.memoryStorage() });

// Admin auth middleware chain (reused on every route)
const adminAuth = [getCurrentUser, getCurrentAdmin];

// ─── Dashboard ────────────────────────────────────────────────────────────────
const dashboardRouter = express.Router();
dashboardRouter.get("/metrics", ...adminAuth, getDashboardMetrics);

// ─── Students ─────────────────────────────────────────────────────────────────
const studentsRouter = express.Router();
studentsRouter.get("/", ...adminAuth, listStudents);
studentsRouter.get("/:user_id", ...adminAuth, getStudent);
studentsRouter.put("/:user_id", ...adminAuth, updateStudent);

// ─── Universities Admin ───────────────────────────────────────────────────────
const universitiesAdminRouter = express.Router();
universitiesAdminRouter.post("/", ...adminAuth, addUniversity);
universitiesAdminRouter.put("/:id", ...adminAuth, updateUniversity);
universitiesAdminRouter.delete("/:id", ...adminAuth, deleteUniversity);

// ─── Applications Admin ───────────────────────────────────────────────────────
const applicationsAdminRouter = express.Router();
applicationsAdminRouter.get("/", ...adminAuth, listApplications);
applicationsAdminRouter.get("/:id", ...adminAuth, getApplication);
applicationsAdminRouter.put("/:id", ...adminAuth, updateApplication);

// ─── Reports ──────────────────────────────────────────────────────────────────
const reportsRouter = express.Router();
reportsRouter.get("/student_conversion", ...adminAuth, studentConversionReport);
reportsRouter.get("/application_status", ...adminAuth, applicationStatusReport);

// ─── Roles ────────────────────────────────────────────────────────────────────
const rolesRouter = express.Router();
rolesRouter.get("/", ...adminAuth, listRoles);
rolesRouter.post("/", ...adminAuth, addAdminRole);
rolesRouter.put("/:user_id", ...adminAuth, updateAdminRole);
rolesRouter.delete("/:user_id", ...adminAuth, removeAdminRole);

// ─── Countries Admin ──────────────────────────────────────────────────────────
const countriesAdminRouter = express.Router();
countriesAdminRouter.post("/", ...adminAuth, addCountry);
countriesAdminRouter.put("/:country_id", ...adminAuth, updateCountry);
countriesAdminRouter.delete("/:country_id", ...adminAuth, deleteCountry);

// ─── Testimonials Admin ───────────────────────────────────────────────────────
const testimonialsAdminRouter = express.Router();
testimonialsAdminRouter.post("/", ...adminAuth, upload.single("video"), addTestimonial);
testimonialsAdminRouter.put("/:id", ...adminAuth, upload.single("video"), editTestimonial);
testimonialsAdminRouter.delete("/:id", ...adminAuth, deleteTestimonial);

module.exports = {
  dashboardRouter,
  studentsRouter,
  universitiesAdminRouter,
  applicationsAdminRouter,
  reportsRouter,
  rolesRouter,
  countriesAdminRouter,
  testimonialsAdminRouter,
};
