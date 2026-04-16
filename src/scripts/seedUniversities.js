/**
 * Seed script — replaces the Python pandas + psycopg2 upload script
 * Reads an Excel file and inserts countries + universities into Supabase
 *
 * Usage: node src/scripts/seedUniversities.js
 *
 * Install deps: npm install xlsx pg dotenv @supabase/supabase-js
 */

require("dotenv").config();
const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");
const { Client: PgClient } = require("pg");
const path = require("path");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseDbUrl = process.env.SUPABASE_DB_URL;

if (!supabaseUrl || !supabaseKey || !supabaseDbUrl) {
  throw new Error(
    "Missing environment variables: SUPABASE_URL, SUPABASE_KEY, SUPABASE_DB_URL"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);
const pgClient = new PgClient({ connectionString: supabaseDbUrl });

const REQUIRED_COLUMNS = [
  "University Name",
  "City",
  "Fee per year (USD $)",
  "Hostel + Living per year (USD $)",
];

const createTables = async () => {
  await pgClient.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS countries (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      name text UNIQUE,
      admission_intake text,
      bachelors_tuition_fee text,
      masters_tuition_fee text,
      living_expenses text,
      post_study_work_permit text,
      top_cities text[],
      top_universities text[]
    )
  `);

  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS universities (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      country_id uuid REFERENCES countries(id),
      country text,
      name text,
      city text,
      mbbs_fee_per_year_usd text,
      hostel_living_per_year_usd text
    )
  `);

  console.log("Tables created successfully");
};

const run = async () => {
  await pgClient.connect();

  try {
    // Create tables
    await createTables();
    await pgClient.query("COMMIT");
  } catch (e) {
    console.error(`Error creating tables: ${e.message}`);
    await pgClient.query("ROLLBACK");
    await pgClient.end();
    throw e;
  }

  // Load Excel file
  const excelPath = path.join(__dirname, "../../scripts/MBBS fees_Final_List_App.xlsx");
  const workbook = XLSX.readFile(excelPath);
  const sheetNames = workbook.SheetNames;

  for (const sheetName of sheetNames) {
    console.log(`Processing country: ${sheetName}`);

    // Check if country exists
    const { data: existingCountry } = await supabase
      .from("countries")
      .select("id")
      .eq("name", sheetName);

    let countryId;

    if (existingCountry && existingCountry.length > 0) {
      countryId = existingCountry[0].id;
    } else {
      // Insert new country with defaults
      const { data: newCountry, error: countryError } = await supabase
        .from("countries")
        .insert({
          name: sheetName,
          admission_intake: "",
          bachelors_tuition_fee: "",
          masters_tuition_fee: "",
          living_expenses: "",
          post_study_work_permit: "",
          top_cities: [],
          top_universities: [],
        })
        .select();

      if (countryError || !newCountry || newCountry.length === 0) {
        console.error(`Failed to insert country ${sheetName}: ${countryError?.message}`);
        continue;
      }

      countryId = newCountry[0].id;
    }

    // Read sheet into array of objects (equivalent to pd.read_excel with header=0)
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Check required columns
    if (rows.length === 0) {
      console.log(`No data in sheet: ${sheetName}`);
      continue;
    }

    const columns = Object.keys(rows[0]);
    const missingColumns = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));

    if (missingColumns.length > 0) {
      console.log(`Missing columns in ${sheetName}: ${missingColumns.join(", ")}`);
      continue;
    }

    // Build university records
    const universities = [];

    for (const row of rows) {
      try {
        const feeRaw = row["Fee per year (USD $)"];
        // Clean fee value — remove commas, convert to string
        const feeStr = String(feeRaw).replace(/,/g, "");

        universities.push({
          country_id: countryId,
          country: sheetName,
          name: row["University Name"],
          city: row["City"],
          mbbs_fee_per_year_usd: feeStr,
          hostel_living_per_year_usd: String(
            row["Hostel + Living per year (USD $)"]
          ),
        });
      } catch (e) {
        console.log(`Skipping row in ${sheetName}: ${e.message}`);
      }
    }

    // Insert universities
    if (universities.length > 0) {
      const { error: insertError } = await supabase
        .from("universities")
        .insert(universities);

      if (insertError) {
        console.error(
          `Failed to insert universities for ${sheetName}: ${insertError.message}`
        );
      } else {
        console.log(
          `Inserted ${universities.length} universities for ${sheetName}`
        );
      }
    }
  }

  await pgClient.end();
  console.log("Data upload completed");
};

run().catch((e) => {
  console.error("Seed script failed:", e.message);
  process.exit(1);
});
