const { listUniversitiesService } = require("../services/universitiesService");

// ─── GET /universities ────────────────────────────────────────────────────────

const listUniversities = async (req, res) => {
  try {
    // Parse query params
    // country: string | undefined
    // top: boolean | undefined  (comes in as string "true"/"false" from query)
    const { country } = req.query;

    let top;
    if (req.query.top !== undefined) {
      top = req.query.top === "true";
    }

    const data = await listUniversitiesService({ country, top });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

module.exports = { listUniversities };
