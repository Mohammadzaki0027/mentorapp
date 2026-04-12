const express = require("express");
const router = express.Router();

const { listUniversities } = require("../controllers/universitiesController");

// GET /universities?country=India&top=true
router.get("/", listUniversities);

module.exports = router;
