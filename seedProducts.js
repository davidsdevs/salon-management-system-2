import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-6AX8N96wuqEL-p0rQmJFiS-OZ9JEqGo",
  authDomain: "david-salon-fff6d.firebaseapp.com",
  projectId: "david-salon-fff6d",
  storageBucket: "david-salon-fff6d.firebasestorage.app",
  messagingSenderId: "248565145509",
  appId: "1:248565145509:web:a7861697801ebf3848524c",
  measurementId: "G-PB1LMRZD7J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample salon products data
const products = [
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "L'Oreal Professional",
    category: "Hair Care",
    name: "L'Oreal Professional Shampoo",
    description: "Professional salon shampoo for all hair types. Provides deep cleansing and nourishment.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 850,
    salonUsePrice: 650,
    unitCost: 450,
    upc: "1234567890123",
    supplier: "L'Oreal Philippines",
    variants: "500ml",
    shelfLife: "24 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Kerastase",
    category: "Hair Care",
    name: "Kerastase Deep Conditioning Mask",
    description: "Intensive hair mask for damaged and color-treated hair. Provides deep repair and moisture.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 2200,
    salonUsePrice: 1800,
    unitCost: 1200,
    upc: "2345678901234",
    supplier: "Kerastase Philippines",
    variants: "200ml",
    shelfLife: "36 months",
    status: "Active",
    commissionPercentage: 20,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Wella",
    category: "Hair Color",
    name: "Wella Color Touch Developer 20 Vol",
    description: "Professional hair color developer for gentle lifting and color application.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 520,
    salonUsePrice: 420,
    unitCost: 280,
    upc: "3456789012345",
    supplier: "Wella Philippines",
    variants: "1000ml",
    shelfLife: "18 months",
    status: "Active",
    commissionPercentage: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "OPI",
    category: "Nail Care",
    name: "OPI Nail Polish - Bubble Bath",
    description: "Classic nude nail polish perfect for professional and everyday wear.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 450,
    salonUsePrice: 350,
    unitCost: 220,
    upc: "4567890123456",
    supplier: "OPI Philippines",
    variants: "15ml",
    shelfLife: "48 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Schwarzkopf",
    category: "Hair Care",
    name: "Schwarzkopf Professional Shampoo",
    description: "Professional salon shampoo with keratin for strength and shine.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 780,
    salonUsePrice: 580,
    unitCost: 380,
    upc: "5678901234567",
    supplier: "Schwarzkopf Philippines",
    variants: "750ml",
    shelfLife: "24 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Matrix",
    category: "Hair Color",
    name: "Matrix Color Sync Permanent Hair Color",
    description: "Permanent hair color with advanced color technology for vibrant, long-lasting results.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 680,
    salonUsePrice: 480,
    unitCost: 320,
    upc: "6789012345678",
    supplier: "Matrix Philippines",
    variants: "60ml",
    shelfLife: "24 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Redken",
    category: "Hair Care",
    name: "Redken All Soft Shampoo",
    description: "Moisturizing shampoo for dry, brittle hair. Provides intense hydration and softness.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 920,
    salonUsePrice: 720,
    unitCost: 480,
    upc: "7890123456789",
    supplier: "Redken Philippines",
    variants: "300ml",
    shelfLife: "24 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "CND",
    category: "Nail Care",
    name: "CND Shellac Top Coat",
    description: "Professional top coat for gel manicures. Provides long-lasting shine and protection.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 580,
    salonUsePrice: 480,
    unitCost: 320,
    upc: "8901234567890",
    supplier: "CND Philippines",
    variants: "14.8ml",
    shelfLife: "36 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Goldwell",
    category: "Hair Care",
    name: "Goldwell Dualsenses Shampoo",
    description: "Color-safe shampoo for color-treated hair. Maintains vibrancy and prevents fading.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 750,
    salonUsePrice: 550,
    unitCost: 350,
    upc: "9012345678901",
    supplier: "Goldwell Philippines",
    variants: "250ml",
    shelfLife: "24 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Joico",
    category: "Hair Care",
    name: "Joico K-Pak Reconstructing Treatment",
    description: "Intensive hair treatment for damaged hair. Rebuilds and strengthens hair structure.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 1200,
    salonUsePrice: 900,
    unitCost: 600,
    upc: "0123456789012",
    supplier: "Joico Philippines",
    variants: "150ml",
    shelfLife: "36 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Paul Mitchell",
    category: "Hair Care",
    name: "Paul Mitchell Tea Tree Shampoo",
    description: "Invigorating shampoo with tea tree oil. Provides deep cleansing and scalp stimulation.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 680,
    salonUsePrice: 480,
    unitCost: 320,
    upc: "1122334455667",
    supplier: "Paul Mitchell Philippines",
    variants: "300ml",
    shelfLife: "24 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Olaplex",
    category: "Hair Care",
    name: "Olaplex No.3 Hair Perfector",
    description: "At-home hair treatment that rebuilds broken hair bonds. Reduces breakage and improves hair health.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 1800,
    salonUsePrice: 1400,
    unitCost: 900,
    upc: "2233445566778",
    supplier: "Olaplex Philippines",
    variants: "100ml",
    shelfLife: "24 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Dyson",
    category: "Tools",
    name: "Dyson Supersonic Hair Dryer",
    description: "Professional hair dryer with intelligent heat control. Protects hair from extreme heat damage.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 25000,
    salonUsePrice: 20000,
    unitCost: 15000,
    upc: "3344556677889",
    supplier: "Dyson Philippines",
    variants: "1 unit",
    shelfLife: "60 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "GHD",
    category: "Tools",
    name: "GHD Classic Hair Straightener",
    description: "Professional hair straightener with ceramic plates. Provides smooth, shiny results.",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 8500,
    salonUsePrice: 6500,
    unitCost: 4500,
    upc: "4455667788990",
    supplier: "GHD Philippines",
    variants: "1 unit",
    shelfLife: "60 months",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    branches: ["KYiL9JprSX3LBOYzrF6e"],
    brand: "Testing Cloudinary",
    category: "Testing Cloudinary",
    name: "Testing Cloudinary",
    description: "hehe",
    imageUrl: "https://res.cloudinary.com/dn0jgdjts/image/upload/v1761221961/ifnvwh3jpy4pzwviljrt.jpg",
    otcPrice: 123,
    salonUsePrice: 123,
    unitCost: 123,
    upc: "2142141251251251252151512521",
    supplier: "Testing Cloudinary",
    variants: "250ml",
    shelfLife: "12",
    status: "Active",
    commissionPercentage: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Function to seed products
async function seedProducts() {
  try {
    console.log('Starting to seed products...');
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const docRef = await addDoc(collection(db, 'products'), product);
      console.log(`Product ${i + 1} added with ID: ${docRef.id}`);
      console.log(`- Name: ${product.name}`);
      console.log(`- Category: ${product.category}`);
      console.log(`- Brand: ${product.brand}`);
      console.log(`- OTC Price: ₱${product.otcPrice}`);
      console.log('---');
    }
    
    console.log('✅ Successfully seeded all 15 products!');
    console.log('Products have been added to the "products" collection in Firestore.');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
}

// Run the seed function
seedProducts();
