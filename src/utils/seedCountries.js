/**
 * Seed script — inserts countries data into Supabase
 * Usage: node src/scripts/seedCountries.js
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const countries = [
  {
    name: "BANGLADESH",
    icon: null,
    bachelors_tuition_fee: "3L - 5.5L per year",
    masters_tuition_fee: null,
    admission_intake: ["September", "October"],
    tuition_fee: "3L - 5.5L per year",
    living_expenses: "1.2L - 2.5L per year",
    post_study_work_permit: null,
    top_cities: [],
    top_universities: [],
    recognition: ["WHO", "NMC"],
    course_duration: "4.5 year + 1 year internship",
    neet_requirement: {
      min_score: {
        "General category": "147",
        "Reserved category": "113",
      },
    },
    why_study: [
      "Affordability",
      "Quality of Education",
      "Recognition and Licensure",
      "Support for Indian students",
      "FMGE Pass Rate",
      "Easy Admission Process",
      "Career Opportunities",
      "English Medium of Instruction",
    ],
    expenses: {
      tuition_fee: "3L - 5.5L per year.",
      hostel_accommodation: "1.2L - 3L per year",
      living_expenses: "1.5L - 2.5L per year",
    },
    faqs: [
      { question: "Is NEET required?", answer: "Yes, a valid NEET score is mandatory for Indian students seeking MBBS admission in Bangladesh." },
      { question: "What are the eligibility criteria?", answer: "Students must have passed 10+2 with a minimum of 60% in Physics, Chemistry, and Biology. They should also be at least 17 years old on the date of admission and have a valid NEET score." },
      { question: "What documents are required?", answer: "Passport, mark-sheets (10th, 12th), NEET scorecard, birth certificate, school leaving certificate, and possibly other documents like financial statements." },
      { question: "How do I apply?", answer: "You'll need to apply to the specific medical college, submit the required documents, and pay the seat booking fee." },
      { question: "Is there a preference for Indian students?", answer: "Yes, SAARC quota admissions may be available, requiring a higher NEET score." },
      { question: "What is the medium of instruction?", answer: "The medium of instruction for MBBS courses in Bangladesh is English." },
      { question: "Is the MBBS degree from Bangladesh recognized in India?", answer: "Yes, degrees from NMC-approved medical colleges in Bangladesh are recognized. Graduates need to clear the FMGE/NEXT exam to practice." },
      { question: "Do I need to take the FMGE exam?", answer: "Yes, if you're an Indian student, you'll need to qualify the FMGE exam (or its successor NEXT) to practice in India after completing your MBBS." },
      { question: "What is the internship like?", answer: "The internship is a mandatory 1-year period spent in hospitals affiliated with the medical college." },
      { question: "Do I need a visa?", answer: "Yes, you'll need a student visa to study in Bangladesh." },
    ],
    other_study_options: [
      { country: "GEORGIA", icon: null },
      { country: "NEPAL", icon: null },
      { country: "KAZAKHSTAN", icon: null },
      { country: "PHILIPPINES", icon: null },
      { country: "UZBEKISTAN", icon: null },
      { country: "RUSSIA", icon: null },
      { country: "VIETNAM", icon: null },
      { country: "KRYGYZTAN", icon: null },
    ],
  },
  {
    name: "GEORGIA",
    icon: null,
    bachelors_tuition_fee: "3.6L - 7L per year",
    masters_tuition_fee: null,
    admission_intake: ["September/October"],
    tuition_fee: "3.6L - 7L per year",
    living_expenses: "1.5L - 2.5L per year",
    post_study_work_permit: null,
    top_cities: [],
    top_universities: [
      "Georgian National University (SEU)",
      "Tbilisi State Medical University",
      "David Tvildiani Medical University",
    ],
    recognition: ["MCI", "NMC", "WHO", "FAIMER"],
    course_duration: "5 year + 1 year internship",
    neet_requirement: {
      min_score: {
        "General category": "164",
        "Reserved category": "129",
      },
    },
    why_study: [
      "Affordability",
      "Quality of Education",
      "Recognition and Licensure",
      "Support for Indian students",
      "FMGE Pass Rate",
      "Easy Admission Process",
      "Career Opportunities",
      "English Medium of Instruction",
    ],
    expenses: {
      tuition_fee: "3.6L - 7L per year.",
      hostel_accommodation: "2.5L to 3L per year.",
      living_expenses: "1.5L - 2.5L per year",
    },
    faqs: [
      { question: "What is the cost of MBBS in Georgia?", answer: "MBBS programs in Georgia are relatively affordable, with tuition fees typically ranging from 4,000 to 8,000 USD per year." },
      { question: "Is Georgia a safe and suitable place for MBBS studies?", answer: "Yes, Georgia is considered a safe country with a relatively low crime rate and a good learning environment for medical students, especially from India." },
      { question: "Is the MBBS degree from Georgia recognized in India?", answer: "Yes, medical degrees from NMC-approved universities in Georgia are recognized in India, but graduates must clear the FMGE to practice." },
      { question: "What is the medium of instruction for MBBS in Georgia?", answer: "The medium of instruction for most MBBS programs in Georgia is English." },
      { question: "Is NEET required for admission to MBBS in Georgia?", answer: "Yes, a valid NEET score is generally required for admission to medical universities in Georgia, especially for Indian students." },
    ],
    other_study_options: [
      { country: "RUSSIA", icon: null },
      { country: "NEPAL", icon: null },
      { country: "KAZAKHSTAN", icon: null },
      { country: "PHILIPPINES", icon: null },
      { country: "UZBEKISTAN", icon: null },
      { country: "BANGLADESH", icon: null },
      { country: "VIETNAM", icon: null },
      { country: "KRYGYZTAN", icon: null },
    ],
  },
  {
    name: "KAZAKHASTAN",
    icon: null,
    bachelors_tuition_fee: "2.5L - 6L per year",
    masters_tuition_fee: null,
    admission_intake: ["September", "March"],
    tuition_fee: "2.5L - 6L per year",
    living_expenses: "1L - 1.5L per year",
    post_study_work_permit: null,
    top_cities: [],
    top_universities: [],
    recognition: ["WHO", "NMC"],
    course_duration: "5 year + 1 year internship",
    neet_requirement: {
      min_score: {
        "General category": "150-200",
        "Reserved category": "100-120",
      },
    },
    why_study: [
      "Affordability",
      "Quality of Education",
      "Recognition and Licensure",
      "Support for Indian students",
      "FMGE Pass Rate",
      "Easy Admission Process",
      "Career Opportunities",
      "English Medium of Instruction",
    ],
    expenses: {
      tuition_fee: "2.5L - 6L per year.",
      hostel_accommodation: "1L - 1.5L per year.",
      living_expenses: "1L - 1.5 per year.",
    },
    faqs: [
      { question: "Is NEET required?", answer: "Yes. NEET qualification is mandatory for Indian students to pursue MBBS abroad, including in Kazakhstan." },
      { question: "What is the medium of instruction?", answer: "The medium of instruction is English." },
    ],
    other_study_options: [
      { country: "GEORGIA", icon: null },
      { country: "NEPAL", icon: null },
      { country: "RUSSIA", icon: null },
      { country: "PHILIPPINES", icon: null },
      { country: "UZBEKISTAN", icon: null },
      { country: "BANGLADESH", icon: null },
      { country: "VIETNAM", icon: null },
      { country: "KRYGYZTAN", icon: null },
    ],
  },
  {
    name: "NEPAL",
    icon: null,
    bachelors_tuition_fee: "6L - 11L per year",
    masters_tuition_fee: null,
    admission_intake: ["September", "October"],
    tuition_fee: "6L - 11L per year",
    living_expenses: "1.2L - 2L per year",
    post_study_work_permit: null,
    top_cities: [],
    top_universities: [
      "KIST Medical College",
      "Manipal College of Medical Sciences",
      "Kathmandu Medical College",
      "B.P. Koirala Institute of Health Sciences",
      "College of Medical Sciences, Bharatpur",
    ],
    recognition: ["WHO", "NMC"],
    course_duration: "4.5 year + 1 year internship",
    neet_requirement: { min_score: "50%" },
    why_study: [
      "Affordability",
      "Quality of Education",
      "Recognition and Licensure",
      "Support for Indian students",
      "FMGE Pass Rate",
      "Easy Admission Process",
      "Career Opportunities",
      "English Medium of Instruction",
    ],
    expenses: {
      tuition_fee: "6L - 11L per year.",
      hostel_accommodation: "70,000 - 1.6L per year.",
      living_expenses: "1.2L - 2L per year.",
    },
    faqs: [
      { question: "Is the MBBS degree from Nepal recognized in India?", answer: "Yes, MBBS degrees from NMC-approved medical colleges in Nepal are recognized in India. Graduates need to clear the FMGE/NEXT exam to practice in India." },
      { question: "Do I need to qualify NEET to study MBBS in Nepal?", answer: "Yes. A valid NEET score is mandatory for Indian students for admission." },
      { question: "What is the medium of instruction for MBBS in Nepal?", answer: "The MBBS course in Nepal is taught in English." },
    ],
    other_study_options: [
      { country: "GEORGIA", icon: null },
      { country: "RUSSIA", icon: null },
      { country: "KAZAKHSTAN", icon: null },
      { country: "PHILIPPINES", icon: null },
      { country: "UZBEKISTAN", icon: null },
      { country: "BANGLADESH", icon: null },
      { country: "VIETNAM", icon: null },
      { country: "KRYGYZTAN", icon: null },
    ],
  },
  {
    name: "PHILIPPINES",
    icon: null,
    bachelors_tuition_fee: "2.5L - 6L per year",
    masters_tuition_fee: null,
    admission_intake: ["September", "November"],
    tuition_fee: "2.5L - 6L per year",
    living_expenses: "70,000 - 1.5L per year",
    post_study_work_permit: null,
    top_cities: [],
    top_universities: [],
    recognition: ["WHO", "NMC"],
    course_duration: "5 year + 1 year internship",
    neet_requirement: {
      min_score: {
        "General category": "150",
        "Reserved category": "120",
      },
    },
    why_study: [
      "Affordability",
      "Quality of Education",
      "Recognition and Licensure",
      "Support for Indian students",
      "FMGE Pass Rate",
      "Easy Admission Process",
      "Career Opportunities",
      "English Medium of Instruction",
    ],
    expenses: {
      tuition_fee: "2.5L - 6L per year.",
      hostel_accommodation: "70,000 - 1.2L per year.",
      living_expenses: "1.8L - 2.5L per year.",
    },
    faqs: [
      { question: "Is an MBBS degree from the Philippines valid in India?", answer: "Yes, it is valid, but students must clear the FMGE conducted by the National Board of Examinations (NBE) in India, to practice as a doctor in India." },
      { question: "Is NEET required for admission?", answer: "Yes. NEET qualification is mandatory for Indian students to pursue MBBS abroad, including in the Philippines." },
      { question: "What is the medium of instruction?", answer: "The medium of instruction is English." },
    ],
    other_study_options: [
      { country: "GEORGIA", icon: null },
      { country: "NEPAL", icon: null },
      { country: "KAZAKHSTAN", icon: null },
      { country: "RUSSIA", icon: null },
      { country: "UZBEKISTAN", icon: null },
      { country: "BANGLADESH", icon: null },
      { country: "VIETNAM", icon: null },
      { country: "KRYGYZTAN", icon: null },
    ],
  },
  {
    name: "RUSSIA",
    icon: null,
    bachelors_tuition_fee: "2.5L - 5.5L per year",
    masters_tuition_fee: null,
    admission_intake: ["September"],
    tuition_fee: "2.5L - 5.5L per year",
    living_expenses: "1.5L - 2.5L per year",
    post_study_work_permit: null,
    top_cities: [],
    top_universities: [],
    recognition: ["WHO", "UNESCO"],
    course_duration: "5 year + 1 year internship",
    neet_requirement: { min_score: "164" },
    why_study: [
      "Affordability",
      "Quality of Education",
      "Recognition and Licensure",
      "Support for Indian students",
      "FMGE Pass Rate",
      "Easy Admission Process",
      "Career Opportunities",
      "English Medium of Instruction",
    ],
    expenses: {
      tuition_fee: "2.5L - 5.5L per year",
      hostel_accommodation: "46k - 90k per year",
      living_expenses: "1.5L - 2.5L per year",
    },
    faqs: [
      { question: "What are the eligibility requirements to study MBBS in Russia?", answer: "Generally, students must be at least 17 years old, have a high school diploma (12th standard), and have passed NEET with a qualifying score." },
      { question: "Is an entrance exam required for MBBS in Russia?", answer: "No, unlike some other countries, there are generally no entrance exams like TOEFL or IELTS required for MBBS admissions in Russia." },
      { question: "Is the MBBS degree from Russia recognized internationally?", answer: "Yes, Russian medical degrees are recognized by WHO and UNESCO, and they are generally valid in many countries." },
    ],
    other_study_options: [
      { country: "GEORGIA", icon: null },
      { country: "NEPAL", icon: null },
      { country: "KAZAKHSTAN", icon: null },
      { country: "PHILIPPINES", icon: null },
      { country: "UZBEKISTAN", icon: null },
      { country: "BANGLADESH", icon: null },
      { country: "VIETNAM", icon: null },
      { country: "KRYGYZTAN", icon: null },
    ],
  },
  {
    name: "UZBEKISTAN",
    icon: null,
    bachelors_tuition_fee: "2.5L - 3.6L per year",
    masters_tuition_fee: null,
    admission_intake: ["September", "October"],
    tuition_fee: "2.5L - 3.6L per year",
    living_expenses: "1.2L - 2.10L per year",
    post_study_work_permit: null,
    top_cities: [],
    top_universities: [
      "Fergana Medical Institute of Public Health",
      "Tashkent Medical Academy Uzbekistan",
      "Bukhara State Medical Institute",
      "Samarkand State Medical University",
    ],
    recognition: ["WHO", "NMC", "FAIMER"],
    course_duration: "5 year + 1 year internship",
    neet_requirement: {
      min_score: {
        "General category": "162",
        "Reserved category": "127",
      },
    },
    why_study: [
      "Affordability",
      "Quality of Education",
      "Recognition and Licensure",
      "Support for Indian students",
      "FMGE Pass Rate",
      "Easy Admission Process",
      "Career Opportunities",
      "English Medium of Instruction",
    ],
    expenses: {
      tuition_fee: "2.5L - 3.6L per year.",
      hostel_accommodation: "35,000 - 70,000 per year.",
      living_expenses: "1.2L - 2.10L per year.",
    },
    faqs: [
      { question: "Is the MBBS degree from Uzbekistan valid in India?", answer: "Yes, Indian students must ensure that the university is listed by the NMC. After completing the degree, graduates must qualify the FMGE to practice in India." },
      { question: "Is NEET required for MBBS admission in Uzbekistan?", answer: "Yes, a valid NEET score is mandatory for Indian students seeking admission to MBBS programs in Uzbekistan." },
      { question: "What is the medium of instruction?", answer: "The medium of instruction for MBBS courses in Uzbekistan for international students is English." },
    ],
    other_study_options: [
      { country: "GEORGIA", icon: null },
      { country: "NEPAL", icon: null },
      { country: "KAZAKHSTAN", icon: null },
      { country: "PHILIPPINES", icon: null },
      { country: "RUSSIA", icon: null },
      { country: "BANGLADESH", icon: null },
      { country: "VIETNAM", icon: null },
      { country: "KRYGYZTAN", icon: null },
    ],
  },
];

const run = async () => {
  console.log(`Seeding ${countries.length} countries...`);

  for (const country of countries) {
    // Check if already exists
    const { data: existing } = await supabase
      .from("countries")
      .select("id")
      .eq("name", country.name);

    if (existing && existing.length > 0) {
      console.log(`Skipping ${country.name} — already exists`);
      continue;
    }

    const { error } = await supabase.from("countries").insert(country);

    if (error) {
      console.error(`Failed to insert ${country.name}: ${error.message}`);
    } else {
      console.log(`Inserted: ${country.name}`);
    }
  }

  console.log("Countries seed completed.");
};

run().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
