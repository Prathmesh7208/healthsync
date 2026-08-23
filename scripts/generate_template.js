const XLSX = require('xlsx');
const path = require('path');

const doctorsData = [
  {
    'Full Name': 'Dr. Vikramaditya Joshi',
    'Phone (10 digits)': '9822011111',
    'Registration Number': 'MMC-2008-04921',
    'Specializations (comma separated)': 'Cardiology, Interventional Cardiology',
    'Experience (Years)': 18,
    'Consultation Fee (INR)': 1000,
    'Languages (comma separated)': 'English, Hindi, Marathi',
    'Bio': 'Senior Interventional Cardiologist with over 18 years of experience in coronary angioplasty, pacemaker implantations, and complex cardiac interventions.',
    'Hospital Name (Optional)': 'Ruby Hall Clinic',
  },
  {
    'Full Name': 'Dr. Ananya Deshmukh',
    'Phone (10 digits)': '9822011112',
    'Registration Number': 'MMC-2014-08129',
    'Specializations (comma separated)': 'Pediatrics, Neonatology',
    'Experience (Years)': 11,
    'Consultation Fee (INR)': 600,
    'Languages (comma separated)': 'English, Hindi, Marathi',
    'Bio': 'Dedicated Pediatrician and Neonatal specialist focusing on infant development, pediatric emergencies, vaccination regimes, and adolescent health.',
    'Hospital Name (Optional)': 'Surya Mother & Child Care Hospital',
  },
  {
    'Full Name': 'Dr. Rajesh Kulkarni',
    'Phone (10 digits)': '9822011113',
    'Registration Number': 'MMC-2010-03214',
    'Specializations (comma separated)': 'Orthopedics, Joint Replacement',
    'Experience (Years)': 15,
    'Consultation Fee (INR)': 850,
    'Languages (comma separated)': 'English, Marathi, Hindi',
    'Bio': 'Renowned Orthopedic Surgeon specialized in robotic knee and hip replacements, arthroscopy, and sports trauma rehabilitation.',
    'Hospital Name (Optional)': 'Sahyadri Super Speciality Hospital',
  },
  {
    'Full Name': 'Dr. Meera Patil',
    'Phone (10 digits)': '9822011114',
    'Registration Number': 'MMC-2012-11045',
    'Specializations (comma separated)': 'Obstetrics & Gynecology, Infertility',
    'Experience (Years)': 13,
    'Consultation Fee (INR)': 750,
    'Languages (comma separated)': 'English, Hindi, Marathi',
    'Bio': 'Consultant Gynecologist and Obstetrician specializing in high-risk pregnancies, laparoscopic gynecological surgeries, and fertility counseling.',
    'Hospital Name (Optional)': 'Jupiter Hospital',
  },
  {
    'Full Name': 'Dr. Siddharth Sen',
    'Phone (10 digits)': '9822011115',
    'Registration Number': 'WB-2009-09412',
    'Specializations (comma separated)': 'Neurology, Stroke Care',
    'Experience (Years)': 16,
    'Consultation Fee (INR)': 1200,
    'Languages (comma separated)': 'English, Hindi, Bengali',
    'Bio': 'Expert Neurologist specializing in acute ischemic stroke management, epilepsy, Parkinson disease, and neurodegenerative disorders.',
    'Hospital Name (Optional)': 'Ruby Hall Clinic',
  },
  {
    'Full Name': 'Dr. Priya Nair',
    'Phone (10 digits)': '9822011116',
    'Registration Number': 'TCMC-2016-04291',
    'Specializations (comma separated)': 'Dermatology, Cosmetology',
    'Experience (Years)': 9,
    'Consultation Fee (INR)': 700,
    'Languages (comma separated)': 'English, Hindi, Malayalam',
    'Bio': 'Board-certified Dermatologist and Trichologist with clinical expertise in psoriasis, eczema, acne scar treatments, and medical laser therapies.',
    'Hospital Name (Optional)': 'Jupiter Hospital',
  },
  {
    'Full Name': 'Dr. Amitav Banerjee',
    'Phone (10 digits)': '9822011117',
    'Registration Number': 'MMC-2005-01823',
    'Specializations (comma separated)': 'Gastroenterology, Hepatology',
    'Experience (Years)': 20,
    'Consultation Fee (INR)': 950,
    'Languages (comma separated)': 'English, Hindi, Bengali',
    'Bio': 'Senior Gastroenterologist with extensive expertise in therapeutic endoscopy, colonoscopy, inflammatory bowel disease, and liver cirrhosis.',
    'Hospital Name (Optional)': 'Sahyadri Super Speciality Hospital',
  },
  {
    'Full Name': 'Dr. Pooja Shinde',
    'Phone (10 digits)': '9822011118',
    'Registration Number': 'MMC-2017-06382',
    'Specializations (comma separated)': 'General Medicine, Diabetology',
    'Experience (Years)': 8,
    'Consultation Fee (INR)': 500,
    'Languages (comma separated)': 'English, Hindi, Marathi',
    'Bio': 'Consultant Physician and Diabetologist dedicated to lifestyle disease management, hypertension, infectious diseases, and adult immunizations.',
    'Hospital Name (Optional)': 'Surya Mother & Child Care Hospital',
  },
  {
    'Full Name': 'Dr. Farhan Qureshi',
    'Phone (10 digits)': '9822011119',
    'Registration Number': 'MMC-2011-05719',
    'Specializations (comma separated)': 'Pulmonology, Critical Care',
    'Experience (Years)': 14,
    'Consultation Fee (INR)': 800,
    'Languages (comma separated)': 'English, Hindi, Urdu',
    'Bio': 'Senior Pulmonologist and Sleep Medicine specialist treating asthma, COPD, pulmonary fibrosis, post-COVID respiratory complications, and sleep apnea.',
    'Hospital Name (Optional)': 'Ruby Hall Clinic',
  },
  {
    'Full Name': 'Dr. Neha Agarwal',
    'Phone (10 digits)': '9822011120',
    'Registration Number': 'DMC-2015-07844',
    'Specializations (comma separated)': 'Psychiatry, Behavioral Health',
    'Experience (Years)': 10,
    'Consultation Fee (INR)': 900,
    'Languages (comma separated)': 'English, Hindi',
    'Bio': 'Compassionate Psychiatrist specializing in anxiety disorders, clinical depression, cognitive behavioral therapy (CBT), and stress management.',
    'Hospital Name (Optional)': 'Jupiter Hospital',
  },
  {
    'Full Name': 'Dr. Rohan Kelkar',
    'Phone (10 digits)': '9822011121',
    'Registration Number': 'MMC-2013-09184',
    'Specializations (comma separated)': 'Ophthalmology, Cataract & Refractive',
    'Experience (Years)': 12,
    'Consultation Fee (INR)': 650,
    'Languages (comma separated)': 'English, Hindi, Marathi',
    'Bio': 'Ophthalmic Surgeon specialized in micro-incision phacoemulsification cataract surgery, LASIK laser vision correction, and glaucoma therapy.',
    'Hospital Name (Optional)': 'Sahyadri Super Speciality Hospital',
  },
  {
    'Full Name': 'Dr. Shweta Bhattacharya',
    'Phone (10 digits)': '9822011122',
    'Registration Number': 'MMC-2007-02391',
    'Specializations (comma separated)': 'Medical Oncology, Hematology',
    'Experience (Years)': 17,
    'Consultation Fee (INR)': 1300,
    'Languages (comma separated)': 'English, Hindi, Bengali',
    'Bio': 'Senior Medical Oncologist specializing in targeted chemotherapy, precision immunotherapy, breast oncology, and hematological malignancies.',
    'Hospital Name (Optional)': 'Ruby Hall Clinic',
  }
];

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(doctorsData);

worksheet['!cols'] = [
  { wch: 28 }, // Full Name
  { wch: 20 }, // Phone
  { wch: 22 }, // Registration Number
  { wch: 42 }, // Specializations
  { wch: 18 }, // Experience
  { wch: 24 }, // Consultation Fee
  { wch: 30 }, // Languages
  { wch: 65 }, // Bio
  { wch: 36 }, // Hospital Name
];

XLSX.utils.book_append_sheet(workbook, worksheet, 'HealthSync_Doctors');

const outputPath = path.join(__dirname, '..', 'HealthSync_Doctor_Import_Template.xlsx');
XLSX.writeFile(workbook, outputPath);
console.log('✅ Successfully generated realistic Doctor Excel template at:', outputPath);
