import fs from "fs";
import path from "path";

/**
 * Folder containing your CURRENTLY named images
 * (the old names like "CityAid Network.jpg")
 */
const DIR = "./resource-images";

/**
 * EXPLICIT, LOGICAL, ONE-TO-ONE MAPPING
 * old image filename  ->  correct Supabase title filename
 */

const renamesMap = {
  // Leftover / Duplicate Mappings (Not used in SQL)
  "Bright Futures Fund.jpg": "robin-hood-foundation.jpg", // Duplicate target
  "Library Learning Network.jpg": "nyc-publics-libraries.jpg", // Typo in target (plural publics)
  "Job Fairs NYC.jpg": "jobs-nyc.jpg", // Correct spelling, but 'job-nyc.jpg' was used
  "Clothing Closet NYC.jpg": "mutual-aid-nyc.jpg", // Correct spelling, but 'mutuals-aid-nyc.jpg' was used
  "School Supply Drive.jpg": "unite-way-nyc.jpg", // Typo in target (unite)
  "Volunteer Action Days.jpg": "volunteers-nyc-events.jpg", // Typo in target (plural volunteers)
  "Youth Employment Prep.jpg": "years-up-nyc.jpg", // Typo in target (years)
  "Court Navigation Services.jpg": "housing-court-answers.jpg", // Correct plural title, but singular file was used
  "Government Services Locator.jpg": "311-nyc-services.jpg" // Correct target, but '3111' file was used
};
const renameMap = {
  // Nonprofit & Charitable Organizations
  "CityAid Network.jpg": "nyc-relief.jpg",
  "Hands Together NYC.jpg": "mutuals-aid-nyc.jpg",
  "HopeBridge Foundation.jpg": "united-way-nyc.jpg",
  "Community Lift Project.jpg": "riseboro-community-partnership.jpg",
  "New Roots Initiative.jpg": "robin-hoods-foundation.jpg",
  "CareForward NYC.jpg": "city-harvest.jpg",
  "Urban Relief Alliance.jpg": "nyc-food-bank-network.jpg",
  "Neighbors First.jpg": "coalition-for-the-homeless.jpg",
  "Bright Futures Fund.jpg": "robin-hood-foundation.jpg",
  "Unity Outreach NYC.jpg": "gods-love-we-deliver.jpg",

  // Health & Wellness Services
  "NYC Community Health Clinics.jpg": "community-healthcare-network.jpg",
  "WellMind Counseling Center.jpg": "healthy-minds-nyc.jpg",
  "Healthy Steps Mobile Clinic.jpg": "nyc-care-program.jpg",
  "NYC Recovery Support.jpg": "nyc-mental-health-helpline.jpg",
  "CareAccess Urgent Clinics.jpg": "nyc-health-hospitals.jpg",
  "Mind & Body Wellness Hub.jpg": "callen-lorde-community-health.jpg",
  "Senior Health Connect.jpg": "ryan-health-centers.jpg",
  "Family Care Network.jpg": "apicha-community-health.jpg",
  "Women’s Health Alliance NYC.jpg": "planned-parenthood-nyc.jpg",
  "Community Dental Outreach.jpg": "mount-sinai-community-clinics.jpg",

  // Education & Learning
  "NYC Adult Learning Centers.jpg": "nyc-adult-literacy-program.jpg",
  "FutureCoders NYC.jpg": "mouse-coding-education.jpg",
  "City Scholars Program.jpg": "cuny-continuing-education.jpg",
  "SkillUp Workshops.jpg": "coursera-workforce-program.jpg",
  "AfterSchool Boost.jpg": "nyc-afterschool-programs.jpg",
  "Language Bridge NYC.jpg": "khan-academy-nyc-access.jpg",
  "Career Tech Academy.jpg": "per-scholas-nyc.jpg",
  "Community Learning Labs.jpg": "gotham-writers-workshop.jpg",
  "Financial Literacy NYC.jpg": "nyc-public-libraries.jpg",
  "Library Learning Network.jpg": "nyc-publics-libraries.jpg",

  // Employment & Career Support
  "NYC Job Connect.jpg": "nyc-workforce1.jpg",
  "Resume Ready NYC.jpg": "job-nyc.jpg",
  "Workforce Pathways Program.jpg": "careeredge-nyc.jpg",
  "CareerLaunch Youth.jpg": "cuny-career-launch.jpg",
  "Second Chance Employment.jpg": "streetwise-partners.jpg",
  "TechHire NYC.jpg": "techhire-nyc.jpg",
  "Small Business Starter Hub.jpg": "nyc-small-business-services.jpg",
  "GigReady NYC.jpg": "year-up-nyc.jpg",
  "Job Fairs NYC.jpg": "jobs-nyc.jpg",
  "Professional Mentors Network.jpg": "goodwill-career-centers.jpg",

  // Housing & Utilities Assistance
  "NYC Housing Help Center.jpg": "nyc-housing-connect.jpg",
  "Emergency Rent Relief Program.jpg": "emergency-rent-assistance.jpg",
  "Utility Support NYC.jpg": "heap-energy-assistance.jpg",
  "HomeSafe NYC.jpg": "homebase-eviction-prevention.jpg",
  "Affordable Housing Connect.jpg": "section-8-housing-help.jpg",
  "Shelter Access Network.jpg": "coalition-for-affordable-homes.jpg",
  "Senior Housing Assistance.jpg": "senior-housing-nyc.jpg",
  "Disability Housing Services.jpg": "nycha-resident-services.jpg",
  "Tenant Rights Hotline.jpg": "housing-court-answer.jpg",
  "Weatherization Help NYC.jpg": "nyc-utility-shutoff-protection.jpg",

  // Food & Basic Needs
  "NYC Food Pantry Network.jpg": "nyc-food-pantries.jpg",
  "Community Fridge Initiative.jpg": "community-fridges-nyc.jpg",
  "Meals for Seniors NYC.jpg": "meals-on-wheels-nyc.jpg",
  "Family Nutrition Program.jpg": "wic-nutrition-program.jpg",
  "Emergency Food Relief.jpg": "emergency-grocery-assistance.jpg",
  "Baby Essentials Bank.jpg": "snap-benefits-nyc.jpg",
  "Clothing Closet NYC.jpg": "mutual-aid-nyc.jpg",
  "School Supply Drive.jpg": "unite-way-nyc.jpg",
  "Holiday Meal Program.jpg": "free-meal-locations-nyc.jpg",
  "Nutrition Access NYC.jpg": "no-kid-hungry-nyc.jpg",

  // Community Events & Programs
  "Neighborhood Meetups NYC.jpg": "community-board-meetings.jpg",
  "Cultural Arts Series.jpg": "local-cultural-festivals.jpg",
  "Community Fitness Days.jpg": "open-streets-nyc.jpg",
  "Public Workshops NYC.jpg": "public-art-walks.jpg",
  "Community Clean-Up Days.jpg": "neighborhood-cleanup-days.jpg",
  "Local Markets & Fairs.jpg": "street-fairs-nyc.jpg",
  "Youth Leadership Forums.jpg": "volunteer-nyc-events.jpg",
  "Community Movie Nights.jpg": "free-museum-days-nyc.jpg",
  "Volunteer Action Days.jpg": "volunteers-nyc-events.jpg",
  "Holiday Festivals NYC.jpg": "nyc-summer-streets.jpg",

  // Youth, Family & Senior Services
  "Youth Mentorship NYC.jpg": "big-brothers-big-sisters-nyc.jpg",
  "Family Support Centers.jpg": "family-support-nyc.jpg",
  "AfterSchool Care Network.jpg": "after-school-all-stars-nyc.jpg",
  "Senior Companionship Program.jpg": "senior-companionship-program.jpg",
  "Childcare Assistance NYC.jpg": "child-care-connect.jpg",
  "Teen Leadership Academy.jpg": "nyc-youth-programs.jpg",
  "Family Counseling Services.jpg": "family-justice-centers.jpg",
  "Senior Activity Hubs.jpg": "senior-centers-nyc.jpg",
  "Youth Employment Prep.jpg": "years-up-nyc.jpg",
  "Caregiver Support Network.jpg": "nyc-aging-services.jpg",

  // Legal, Civic & Government Services
  "NYC Legal Aid Society.jpg": "nyc-legal-aid-society.jpg",
  "Tenant Legal Support.jpg": "legal-services-nyc.jpg",
  "Immigration Assistance Center.jpg": "immigrant-legal-resource-center.jpg",
  "Civic Engagement NYC.jpg": "nyc-civic-engagement.jpg",
  "Public Benefits Help Desk.jpg": "3111-nyc-services.jpg",
  "Consumer Protection Office.jpg": "nyc-tenant-protection.jpg",
  "Small Claims Assistance.jpg": "civil-court-help-center.jpg",
  "Know Your Rights Workshops.jpg": "know-your-rights-nyc.jpg",
  "Court Navigation Services.jpg": "housing-court-answers.jpg",
  "Government Services Locator.jpg": "311-nyc-services.jpg"
};

// ---- EXECUTION ----
Object.entries(renameMap).forEach(([oldName, newName]) => {
  const oldPath = path.join(DIR, oldName);
  const newPath = path.join(DIR, newName);

  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`✔ ${oldName} → ${newName}`);
  } else {
    console.warn(`⚠ Missing file: ${oldName}`);
  }
});

console.log("✅ All logical renames completed");

// supabase names
[
  {
    "category": "Employment & Career Support",
    "title": "Year Up NYC"
  },
  {
    "category": "Food & Basic Needs",
    "title": "SNAP Benefits NYC"
  },
  {
    "category": "Employment & Career Support",
    "title": "Goodwill Career Centers"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "NYC Food Bank Network"
  },
  {
    "category": "Food & Basic Needs",
    "title": "NYC Food Pantries"
  },
  {
    "category": "Health & Wellness Services",
    "title": "NYC Health + Hospitals"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "Emergency Rent Assistance"
  },
  {
    "category": "Education & Learning",
    "title": "NYC Public Libraries"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "Coalition for the Homeless"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "NYC Housing Connect"
  },
  {
    "category": "Employment & Career Support",
    "title": "NYC Workforce1"
  },
  {
    "category": "Community Events & Programs",
    "title": "Community Sports Leagues"
  },
  {
    "category": "Education & Learning",
    "title": "CUNY Continuing Education"
  },
  {
    "category": "Education & Learning",
    "title": "Khan Academy NYC Access"
  },
  {
    "category": "Education & Learning",
    "title": "Coursera Workforce Program"
  },
  {
    "category": "Education & Learning",
    "title": "NYC EarlyLearn"
  },
  {
    "category": "Education & Learning",
    "title": "Mouse Coding Education"
  },
  {
    "category": "Education & Learning",
    "title": "Per Scholas NYC"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "HomeBase Eviction Prevention"
  },
  {
    "category": "Food & Basic Needs",
    "title": "WIC Nutrition Program"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "The Bowery Mission"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "NYC Relief"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "God’s Love We Deliver"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "Housing Works"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "Robin Hood Foundation"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "RiseBoro Community Partnership"
  },
  {
    "category": "Community Events & Programs",
    "title": "NYC Summer Streets"
  },
  {
    "category": "Food & Basic Needs",
    "title": "Free Meal Locations NYC"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "NYC Legal Aid Society"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "NYC Youth Programs"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "Family Justice Centers"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "After-School All-Stars NYC"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "Legal Services NYC"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "Immigrant Legal Resource Center"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "City Harvest"
  },
  {
    "category": "Nonprofit & Charitable Organizations",
    "title": "United Way NYC"
  },
  {
    "category": "Health & Wellness Services",
    "title": "Planned Parenthood NYC"
  },
  {
    "category": "Health & Wellness Services",
    "title": "Callen-Lorde Community Health"
  },
  {
    "category": "Health & Wellness Services",
    "title": "Ryan Health Centers"
  },
  {
    "category": "Health & Wellness Services",
    "title": "Apicha Community Health"
  },
  {
    "category": "Health & Wellness Services",
    "title": "Mount Sinai Community Clinics"
  },
  {
    "category": "Health & Wellness Services",
    "title": "NYC Mental Health Helpline"
  },
  {
    "category": "Health & Wellness Services",
    "title": "NYC Care Program"
  },
  {
    "category": "Health & Wellness Services",
    "title": "Healthy Minds NYC"
  },
  {
    "category": "Education & Learning",
    "title": "Gotham Writers Workshop"
  },
  {
    "category": "Education & Learning",
    "title": "NYC Afterschool Programs"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "NYC Tenant Protection"
  },
  {
    "category": "Education & Learning",
    "title": "NYC Adult Literacy Program"
  },
  {
    "category": "Employment & Career Support",
    "title": "Jobs NYC"
  },
  {
    "category": "Employment & Career Support",
    "title": "CUNY Career Launch"
  },
  {
    "category": "Employment & Career Support",
    "title": "NYC Small Business Services"
  },
  {
    "category": "Employment & Career Support",
    "title": "TechHire NYC"
  },
  {
    "category": "Employment & Career Support",
    "title": "StreetWise Partners"
  },
  {
    "category": "Employment & Career Support",
    "title": "CareerEdge NYC"
  },
  {
    "category": "Employment & Career Support",
    "title": "NYC Apprenticeship Program"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "NYCHA Resident Services"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "HEAP Energy Assistance"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "Section 8 Housing Help"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "NYC Utility Shutoff Protection"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "Housing Court Answers"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "Coalition for Affordable Homes"
  },
  {
    "category": "Housing & Utilities Assistance",
    "title": "Senior Housing NYC"
  },
  {
    "category": "Food & Basic Needs",
    "title": "Community Fridges NYC"
  },
  {
    "category": "Food & Basic Needs",
    "title": "No Kid Hungry NYC"
  },
  {
    "category": "Food & Basic Needs",
    "title": "Meals on Wheels NYC"
  },
  {
    "category": "Food & Basic Needs",
    "title": "Mutual Aid NYC"
  },
  {
    "category": "Food & Basic Needs",
    "title": "Senior Nutrition Program"
  },
  {
    "category": "Food & Basic Needs",
    "title": "Emergency Grocery Assistance"
  },
  {
    "category": "Community Events & Programs",
    "title": "Open Streets NYC"
  },
  {
    "category": "Community Events & Programs",
    "title": "Local Cultural Festivals"
  },
  {
    "category": "Community Events & Programs",
    "title": "Community Board Meetings"
  },
  {
    "category": "Community Events & Programs",
    "title": "Neighborhood Cleanup Days"
  },
  {
    "category": "Community Events & Programs",
    "title": "Free Museum Days NYC"
  },
  {
    "category": "Community Events & Programs",
    "title": "Public Art Walks"
  },
  {
    "category": "Community Events & Programs",
    "title": "Street Fairs NYC"
  },
  {
    "category": "Community Events & Programs",
    "title": "Volunteer NYC Events"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "Senior Centers NYC"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "Child Care Connect"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "Youth Mental Health NYC"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "Family Support NYC"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "Big Brothers Big Sisters NYC"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "Senior Companionship Program"
  },
  {
    "category": "Youth, Family & Senior Services",
    "title": "NYC Aging Services"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "Public Defender Services"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "Voter Registration NYC"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "Civil Court Help Center"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "NYC Civic Engagement"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "Know Your Rights NYC"
  },
  {
    "category": "Health & Wellness Services",
    "title": "Community Healthcare Network"
  },
  {
    "category": "Legal, Civic & Government Services",
    "title": "311 NYC Services"
  }
]