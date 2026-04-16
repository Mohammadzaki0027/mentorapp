const express = require("express");
const router = express.Router();

const {
  listCountries,
  getCountryNames,
  getCountry,
} = require("../controllers/countriesController");

// NOTE: /country/names must be defined BEFORE /:country_id
// otherwise Express matches "country" as the country_id param

// GET /countries
router.get("/", listCountries);

// GET /countries/country/names
router.get("/country/names", getCountryNames);

// GET /countries/:country_id
router.get("/:country_id", getCountry);

module.exports = router;
