const mongoose = require("mongoose");
const Medication = require("./models/Medication");

// Use the same connection string as in server.js
const MONGODB_URI =
  "mongodb+srv://Haak:OpenRxRoute@cluster0.zgkbgn7.mongodb.net/?appName=Cluster0";

// Sample medications to seed the database
const sampleMedications = [
  {
    name: "Paracetamol",
    description: "Pain reliever and fever reducer",
    category: "Pain Relief",
    dose: "500mg",
    quantity: "10 tabs",
    price: 15,
    originalPrice: 20,
    rating: 4.8,
    inStock: true,
    requiresPrescription: false,
    tags: ["pain", "fever", "headache"],
    activeIngredients: ["Paracetamol"],
    sideEffects: ["Rare allergic reactions"],
    manufacturer: "PharmaCorp",
    imageUrl: "https://example.com/paracetamol.jpg",
  },
  {
    name: "Vitamin C",
    description: "Immune system support supplement",
    category: "Vitamins",
    dose: "1000mg",
    quantity: "30 efferves",
    price: 45,
    originalPrice: 60,
    rating: 4.6,
    inStock: true,
    requiresPrescription: false,
    tags: ["vitamin", "immune", "supplement"],
    activeIngredients: ["Ascorbic Acid"],
    sideEffects: ["Generally well tolerated"],
    manufacturer: "HealthPlus",
    imageUrl: "https://example.com/vitamin-c.jpg",
  },
  {
    name: "Amoxicillin",
    description: "Antibiotic for bacterial infections",
    category: "Antibiotics",
    dose: "250mg",
    quantity: "20 caps",
    price: 38,
    originalPrice: 50,
    rating: 4.5,
    inStock: true,
    requiresPrescription: true,
    tags: ["antibiotic", "infection", "bacterial"],
    activeIngredients: ["Amoxicillin"],
    sideEffects: ["Nausea", "Diarrhea", "Allergic reactions"],
    manufacturer: "PharmaCorp",
    imageUrl: "https://example.com/amoxicillin.jpg",
  },
  {
    name: "Ibuprofen",
    description: "Anti-inflammatory pain reliever",
    category: "Pain Relief",
    dose: "400mg",
    quantity: "20 tabs",
    price: 25,
    originalPrice: 35,
    rating: 4.2,
    inStock: true,
    requiresPrescription: false,
    tags: ["pain", "inflammation", "headache"],
    activeIngredients: ["Ibuprofen"],
    sideEffects: ["Stomach upset", "Dizziness"],
    manufacturer: "PainRelief Inc",
    imageUrl: "https://example.com/ibuprofen.jpg",
  },
];

async function seedMedications() {
  try {
    console.log("🌱 Starting medication seeding...");

    // Connect to database
    await mongoose.connect(MONGODB_URI);

    // Clear existing medications
    await Medication.deleteMany({});

    // Insert sample medications
    const insertedMedications = await Medication.insertMany(sampleMedications);

    console.log(
      `✅ Successfully seeded ${insertedMedications.length} medications`,
    );
    console.log("📦 Available medications:");

    insertedMedications.forEach((med, index) => {
      console.log(
        `${index + 1}. ${med.name} - ${med.category} - GHS ${med.price}`,
      );
    });

    await mongoose.disconnect();
    return insertedMedications;
  } catch (error) {
    console.error("❌ Error seeding medications:", error);
    throw error;
  }
}

module.exports = { seedMedications };
