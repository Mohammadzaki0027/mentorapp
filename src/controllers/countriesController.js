const {
  listCountriesService,
  getCountryService,
  getCountryNamesService,
} = require("../services/countriesService");

// GET /countries
const listCountries = async (req, res) => {
  try {
    const data = await listCountriesService();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// GET /countries/country/names  ← must be before /:country_id
const getCountryNames = async (req, res) => {
  try {
    const data = await getCountryNamesService();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// GET /countries/:country_id
const getCountry = async (req, res) => {
  try {
    const data = await getCountryService(req.params.country_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

module.exports = { listCountries, getCountryNames, getCountry };
