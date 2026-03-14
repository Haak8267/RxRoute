const mongoose = require('mongoose');
const Medication = require('./models/Medication')');

// Sample medications to seed the database
const medications = [
  {
    name: 'Paracetamol',
    description: 'Pain reliever and fever reducer',
    category: 'Pain Relief',
    dose: '500mg',
    quantity: '10 tabs',
    price: 5.50,
    originalPrice: 7.00,
    rating: 4.5,
    inStock: true,
    requiresPrescription: false,
    tags: ['pain', 'fever', 'headache'],
    activeIngredients: ['Paracetamol'],
    sideEffects: ['Rare allergic reactions'],
    manufacturer: 'PharmaCorp'
  },
  {
    name: 'Amoxicillin',
    description: 'Antibiotic for bacterial infections',
    category: 'Antibiotics',
    dose: '250mg',
    quantity: '21 caps',
    price: 25.00,
    rating: 4.2,
    inStock: true,
    requiresPrescription: true,
    tags: ['antibiotic', 'bacterial', 'infection'],
    activeIngredients: ['Amoxicillin'],
    sideEffects: ['Nausea', 'Diarrhea', 'Allergic reactions'],
    manufacturer: 'MediTech'
  },
  {
    name: 'Vitamin C',
    description: 'Immune system support supplement',
    category: 'Vitamins',
    dose: '500mg',
    quantity: '30 tabs',
    price: 12.00,
    originalPrice: 15.00,
    rating: 4.8,
    inStock: true,
    requiresPrescription: false,
    tags: ['vitamin', 'immune', 'supplement'],
    activeIngredients: ['Ascorbic Acid'],
    sideEffects: ['Generally well tolerated'],
    manufacturer: 'HealthPlus'
  },
  {
    name: 'Loratadine',
    description: 'Antihistamine for allergy relief',
    category: 'Allergy',
    dose: '10mg',
    quantity: '10 tabs',
    price: 18.50,
    rating: 4.3,
    inStock: true,
    requiresPrescription: false,
    tags: ['allergy', 'antihistamine', 'hay fever'],
    activeIngredients: ['Loratadine'],
    sideEffects: ['Drowsiness', 'Dry mouth', 'Headache'],
    manufacturer: 'AllerFree'
  },
  {
    name: 'Omeprazole',
    description: 'Proton pump inhibitor for acid reflux',
    category: 'Digestive',
    dose: '20mg',
    quantity: '14 caps',
    price: 22.00,
    rating: 4.4,
    inStock: true,
    requiresPrescription: true,
    tags: ['acid reflux', 'heartburn', 'stomach'],
    activeIngredients: ['Omeprazole'],
    sideEffects: ['Headache', 'Nausea', 'Diarrhea'],
    manufacturer: 'GastroCare'
  },
  {
    name: 'Ibuprofen',
    description: 'Anti-inflammatory pain reliever',
    category: 'Pain Relief',
    dose: '400mg',
    quantity: '20 tabs',
    price: 8.00,
    originalPrice: 10.00,
    rating: 4.6,
    inStock: true,
    requiresPrescription: false,
    tags: ['pain', 'inflammation', 'fever'],
    activeIngredients: ['Ibuprofen'],
    sideEffects: ['Stomach upset', 'Dizziness'],
    manufacturer: 'PainAway'
  },
  {
    name: 'Azithromycin',
    description: 'Broad-spectrum antibiotic',
    category: 'Antibiotics',
    dose: '250mg',
    quantity: '6 tabs',
    price: 35.00,
    rating: 4.1,
    inStock: true,
    requiresPrescription: true,
    tags: ['antibiotic', 'infection', 'bacterial'],
    activeIngredients: ['Azithromycin'],
    sideEffects: ['Nausea', 'Diarrhea', 'Stomach pain'],
    manufacturer: 'BioPharm'
  },
  {
    name: 'Multivitamin',
    description: 'Complete daily vitamin supplement',
    category: 'Vitamins',
    dose: '1 tablet',
    quantity: '60 tabs',
    price: 20.00,
    originalPrice: 25.00,
    rating: 4.7,
    inStock: true,
    requiresPrescription: false,
    tags: ['multivitamin', 'daily', 'supplement'],
    activeIngredients: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'B Vitamins', 'Iron', 'Calcium'],
    sideEffects: ['Generally well tolerated'],
    manufacturer: 'VitaLife'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rxroute');
    console.log('Connected to MongoDB');

    // Clear existing medications
    await Medication.deleteMany({});
    console.log('Cleared existing medications');

    // Insert new medications
    await Medication.insertMany(medications);
    console.log('Inserted medications successfully');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
