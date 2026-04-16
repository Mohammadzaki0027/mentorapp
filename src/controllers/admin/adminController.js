const {
  getDashboardMetricsService,
  listStudentsService,
  getStudentService,
  updateStudentService,
  addUniversityService,
  updateUniversityService,
  deleteUniversityService,
  listApplicationsService,
  getApplicationService,
  updateApplicationService,
  studentConversionReportService,
  applicationStatusReportService,
  listRolesService,
  addAdminRoleService,
  updateAdminRoleService,
  removeAdminRoleService,
  addCountryService,
  updateCountryService,
  deleteCountryService,
  addTestimonialService,
  editTestimonialService,
  deleteTestimonialService,
} = require("../../services/admin/adminService");

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getDashboardMetrics = async (req, res) => {
  try {
    const data = await getDashboardMetricsService();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// ─── Students ─────────────────────────────────────────────────────────────────

const listStudents = async (req, res) => {
  try {
    const data = await listStudentsService();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getStudent = async (req, res) => {
  try {
    const data = await getStudentService(req.params.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const data = await updateStudentService(req.params.user_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// ─── Universities Admin ───────────────────────────────────────────────────────

const addUniversity = async (req, res) => {
  try {
    const data = await addUniversityService(req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const updateUniversity = async (req, res) => {
  try {
    const data = await updateUniversityService(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const deleteUniversity = async (req, res) => {
  try {
    const data = await deleteUniversityService(req.params.id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// ─── Applications Admin ───────────────────────────────────────────────────────

const listApplications = async (req, res) => {
  try {
    const data = await listApplicationsService();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getApplication = async (req, res) => {
  try {
    const data = await getApplicationService(req.params.id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const updateApplication = async (req, res) => {
  try {
    const data = await updateApplicationService(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// ─── Reports ──────────────────────────────────────────────────────────────────

const studentConversionReport = async (req, res) => {
  try {
    const data = await studentConversionReportService();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const applicationStatusReport = async (req, res) => {
  try {
    const data = await applicationStatusReportService();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// ─── Roles ────────────────────────────────────────────────────────────────────

const listRoles = async (req, res) => {
  try {
    const data = await listRolesService();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const addAdminRole = async (req, res) => {
  try {
    const data = await addAdminRoleService(req.body);
    return res.status(201).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const updateAdminRole = async (req, res) => {
  try {
    const data = await updateAdminRoleService(req.params.user_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const removeAdminRole = async (req, res) => {
  try {
    const data = await removeAdminRoleService(req.params.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// ─── Countries Admin ──────────────────────────────────────────────────────────

const addCountry = async (req, res) => {
  try {
    const data = await addCountryService(req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const updateCountry = async (req, res) => {
  try {
    const data = await updateCountryService(req.params.country_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const deleteCountry = async (req, res) => {
  try {
    const data = await deleteCountryService(req.params.country_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// ─── Testimonials Admin ───────────────────────────────────────────────────────

const addTestimonial = async (req, res) => {
  try {
    const { name, university } = req.body;
    const video = req.file;

    if (!video) {
      return res.status(400).json({ detail: "Video file is required" });
    }

    const videoExt = video.originalname.split(".").pop();
    const data = await addTestimonialService({
      name,
      university,
      videoBuffer: video.buffer,
      videoExt,
      contentType: video.mimetype,
    });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const editTestimonial = async (req, res) => {
  try {
    const { name, university } = req.body;
    const video = req.file;

    const data = await editTestimonialService({
      id: req.params.id,
      name,
      university,
      videoBuffer: video ? video.buffer : null,
      videoExt: video ? video.originalname.split(".").pop() : null,
      contentType: video ? video.mimetype : null,
    });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const deleteTestimonial = async (req, res) => {
  try {
    const data = await deleteTestimonialService(req.params.id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

module.exports = {
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
};
