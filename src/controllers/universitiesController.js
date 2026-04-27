const { listUniversitiesService } = require("../services/universitiesService");

// ─── GET /universities ────────────────────────────────────────────────────────

const listUniversities = async (req, res) => {
  try {
    const { country_id } = req.query;

    let top;
    if (req.query.top !== undefined) {
      top = req.query.top === "true";
    }

    const data = await listUniversitiesService({ country_id, top });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

module.exports = { listUniversities };
