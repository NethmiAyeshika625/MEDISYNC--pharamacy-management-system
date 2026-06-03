import 'dotenv/config';
import mongoose from 'mongoose';

import User from '../src/models/User.js';
import Pharmacy from '../src/models/Pharmacy.js';
import Prescription from '../src/models/Prescription.js';
import Order from '../src/models/Order.js';
import Review from '../src/models/Review.js';
import Message from '../src/models/Message.js';
import SystemFeedback from '../src/models/SystemFeedback.js';

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/medisync-db';

const medicines = [
  { name: 'Paracetamol 500mg', brand: 'Panadol', price: 280, stockCount: 420, expiryDate: new Date('2026-12-01'), lowStockThreshold: 50, nearExpiryThresholdDays: 30 },
  { name: 'Amoxicillin 500mg', brand: 'State Pharmaceuticals', price: 650, stockCount: 95, expiryDate: new Date('2026-10-01'), lowStockThreshold: 20, nearExpiryThresholdDays: 30 },
  { name: 'Ibuprofen 400mg', brand: 'Link Natural', price: 420, stockCount: 180, expiryDate: new Date('2026-07-10'), lowStockThreshold: 25, nearExpiryThresholdDays: 45 },
  { name: 'Cetirizine 10mg', brand: 'Glomed', price: 350, stockCount: 210, expiryDate: new Date('2026-09-20'), lowStockThreshold: 30, nearExpiryThresholdDays: 30 },
  { name: 'Metformin 500mg', brand: 'Hemas Pharmaceuticals', price: 480, stockCount: 260, expiryDate: new Date('2027-01-15'), lowStockThreshold: 40, nearExpiryThresholdDays: 30 },
  { name: 'Salbutamol Inhaler', brand: 'GlaxoSmithKline', price: 1850, stockCount: 45, expiryDate: new Date('2026-08-30'), lowStockThreshold: 15, nearExpiryThresholdDays: 30 },
  { name: 'ORS Sachets', brand: 'Samson', price: 120, stockCount: 500, expiryDate: new Date('2026-11-20'), lowStockThreshold: 80, nearExpiryThresholdDays: 30 },
  { name: 'Vitamin C 500mg', brand: 'Vida', price: 320, stockCount: 140, expiryDate: new Date('2026-06-12'), lowStockThreshold: 20, nearExpiryThresholdDays: 30 },
  { name: 'Omeprazole 20mg', brand: 'Astron', price: 540, stockCount: 12, expiryDate: new Date('2026-09-15'), lowStockThreshold: 15, nearExpiryThresholdDays: 30 },
  { name: 'Chlorpheniramine Syrup', brand: 'Piriton', price: 390, stockCount: 88, expiryDate: new Date('2026-07-25'), lowStockThreshold: 20, nearExpiryThresholdDays: 30 }
];

const pharmacies = [
  {
    name: 'Lanka Pharmacy – Colombo Fort',
    slug: 'lanka-pharmacy-colombo-fort',
    address: 'No. 45, Sir Baron Jayathilaka Mawatha, Colombo 01',
    city: 'Colombo',
    locationLabel: 'Colombo Fort, near Fort Railway Station',
    coordinates: { lat: 6.9344, lng: 79.8428 },
    phone: '+94 11 232 4567',
    description: 'Trusted city-centre pharmacy serving Colombo Fort commuters and office workers since 1998.',
    deliveryEnabled: true,
    deliveryFee: 350,
    openingHours: '7:00 AM - 10:00 PM'
  },
  {
    name: 'Nawaloka Pharmacy – Bambalapitiya',
    slug: 'nawaloka-pharmacy-bambalapitiya',
    address: 'No. 115, Galle Road, Bambalapitiya, Colombo 04',
    city: 'Colombo',
    locationLabel: 'Galle Road, Bambalapitiya',
    coordinates: { lat: 6.8881, lng: 79.8603 },
    phone: '+94 11 258 9012',
    description: 'Full-service pharmacy linked to Nawaloka Hospital network with home delivery across Colombo.',
    deliveryEnabled: true,
    deliveryFee: 400,
    openingHours: '8:00 AM - 11:00 PM'
  },
  {
    name: 'Kandy City Pharmacy',
    slug: 'kandy-city-pharmacy',
    address: 'No. 78, Dalada Veediya, Kandy',
    city: 'Kandy',
    locationLabel: 'Dalada Veediya, near Temple of the Sacred Tooth Relic',
    coordinates: { lat: 7.2936, lng: 80.6413 },
    phone: '+94 81 222 3344',
    description: 'Central Kandy pharmacy stocking essential medicines for locals and pilgrims.',
    deliveryEnabled: true,
    deliveryFee: 300,
    openingHours: '7:30 AM - 9:30 PM'
  },
  {
    name: 'Galle Fort Chemists',
    slug: 'galle-fort-chemists',
    address: 'No. 12, Lighthouse Street, Galle Fort, Galle',
    city: 'Galle',
    locationLabel: 'Galle Fort, Lighthouse Street',
    coordinates: { lat: 6.0267, lng: 80.2169 },
    phone: '+94 91 223 7788',
    description: 'Heritage pharmacy inside Galle Fort with tourist-friendly service and English-speaking staff.',
    deliveryEnabled: false,
    deliveryFee: 0,
    openingHours: '8:00 AM - 8:00 PM'
  },
  {
    name: 'Negombo MediCare Pharmacy',
    slug: 'negombo-medicare-pharmacy',
    address: 'No. 56, Main Street, Negombo',
    city: 'Negombo',
    locationLabel: 'Negombo Main Street, near fish market',
    coordinates: { lat: 7.2084, lng: 79.8358 },
    phone: '+94 31 222 5566',
    description: 'Coastal pharmacy serving Negombo residents with quick prescription filling.',
    deliveryEnabled: true,
    deliveryFee: 250,
    openingHours: '7:00 AM - 10:00 PM'
  },
  {
    name: 'Jaffna Green Cross Pharmacy',
    slug: 'jaffna-green-cross-pharmacy',
    address: 'No. 90, Hospital Road, Jaffna',
    city: 'Jaffna',
    locationLabel: 'Hospital Road, Jaffna',
    coordinates: { lat: 9.6615, lng: 80.0255 },
    phone: '+94 21 222 8899',
    description: 'Northern province pharmacy with Tamil and Sinhala speaking pharmacists on duty.',
    deliveryEnabled: true,
    deliveryFee: 350,
    openingHours: '8:00 AM - 9:00 PM'
  },
  {
    name: 'Nugegoda HealthFirst Pharmacy',
    slug: 'nugegoda-healthfirst-pharmacy',
    address: 'No. 234, High Level Road, Nugegoda',
    city: 'Colombo',
    locationLabel: 'High Level Road, Nugegoda',
    coordinates: { lat: 6.8728, lng: 79.8894 },
    phone: '+94 11 281 6677',
    description: 'Suburban pharmacy on High Level Road with extended evening hours.',
    deliveryEnabled: true,
    deliveryFee: 300,
    openingHours: '7:00 AM - 11:00 PM'
  },
  {
    name: 'Matara Southern Pharmacy',
    slug: 'matara-southern-pharmacy',
    address: 'No. 18, Anagarika Dharmapala Mawatha, Matara',
    city: 'Matara',
    locationLabel: 'Matara town centre',
    coordinates: { lat: 5.9483, lng: 80.5353 },
    phone: '+94 41 222 4433',
    description: 'Southern pharmacy serving Matara district with chronic disease medicine support.',
    deliveryEnabled: true,
    deliveryFee: 280,
    openingHours: '8:00 AM - 9:00 PM'
  },
  {
    name: 'Dehiwala Hemas Pharmacy',
    slug: 'dehiwala-hemas-pharmacy',
    address: 'No. 67, Galle Road, Dehiwala',
    city: 'Dehiwala',
    locationLabel: 'Galle Road, Dehiwala-Mount Lavinia',
    coordinates: { lat: 6.8566, lng: 79.8597 },
    phone: '+94 11 272 9900',
    description: 'Hemas-affiliated outlet on Galle Road with wide OTC and prescription range.',
    deliveryEnabled: true,
    deliveryFee: 350,
    openingHours: '8:00 AM - 10:00 PM'
  },
  {
    name: 'Nuwara Eliya Hill Country Pharmacy',
    slug: 'nuwara-eliya-hill-pharmacy',
    address: 'No. 5, Queen Elizabeth Drive, Nuwara Eliya',
    city: 'Nuwara Eliya',
    locationLabel: 'Nuwara Eliya town, near Gregory Lake',
    coordinates: { lat: 6.9497, lng: 80.7891 },
    phone: '+94 52 222 1155',
    description: 'Cool-climate hill station pharmacy for residents, tea estate workers, and tourists.',
    deliveryEnabled: false,
    deliveryFee: 0,
    openingHours: '8:30 AM - 8:30 PM'
  }
];

const pharmacistProfiles = [
  { name: 'Dr. Nimal Perera', email: 'pharmacist@medisync.test', phone: '+94 77 123 4567' },
  { name: 'Dr. Priya Fernando', email: 'pharmacist2@medisync.test', phone: '+94 77 234 5678' },
  { name: 'Tharindu Wickramasinghe', email: 'pharmacist3@medisync.test', phone: '+94 77 345 6789' },
  { name: 'Kavitha Sivakumar', email: 'pharmacist4@medisync.test', phone: '+94 77 456 7890' },
  { name: 'Rohan Jayawardena', email: 'pharmacist5@medisync.test', phone: '+94 77 567 8901' },
  { name: 'Dr. Anoma Dissanayake', email: 'pharmacist6@medisync.test', phone: '+94 77 678 9012' },
  { name: 'Mithun Rajaratnam', email: 'pharmacist7@medisync.test', phone: '+94 77 789 0123' },
  { name: 'Sanduni Gunasekara', email: 'pharmacist8@medisync.test', phone: '+94 77 890 1234' },
  { name: 'Dr. Lasith Mendis', email: 'pharmacist9@medisync.test', phone: '+94 77 901 2345' },
  { name: 'Yasodha Weerasinghe', email: 'pharmacist10@medisync.test', phone: '+94 77 012 3456' }
];

const patientProfiles = [
  { name: 'Sithumi Jayawardena', email: 'patient1@medisync.test', phone: '+94 71 111 2233' },
  { name: 'Kasun Silva', email: 'patient2@medisync.test', phone: '+94 71 222 3344' },
  { name: 'Nethmi Rajapaksa', email: 'patient3@medisync.test', phone: '+94 71 333 4455' },
  { name: 'Dilshan Perera', email: 'patient4@medisync.test', phone: '+94 71 444 5566' },
  { name: 'Tharushi Fernando', email: 'patient5@medisync.test', phone: '+94 71 555 6677' },
  { name: 'Ashan Kumara', email: 'patient6@medisync.test', phone: '+94 71 666 7788' },
  { name: 'Malini Seneviratne', email: 'patient7@medisync.test', phone: '+94 71 777 8899' },
  { name: 'Vithushan Nadarajah', email: 'patient8@medisync.test', phone: '+94 71 888 9900' },
  { name: 'Ishara Bandara', email: 'patient9@medisync.test', phone: '+94 71 999 0011' },
  { name: 'Chathurika Wickramasinghe', email: 'patient10@medisync.test', phone: '+94 71 100 1122' },
  { name: 'Ruwan Dissanayake', email: 'patient11@medisync.test', phone: '+94 71 211 2233' },
  { name: 'Kamani Peiris', email: 'patient12@medisync.test', phone: '+94 71 322 3344' }
];

function medImage(name) {
  return `/images/${name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}.jpg`;
}

function stockMedicines(offset = 0) {
  return medicines.map((med, index) => ({
    ...med,
    stockCount: Math.max(5, med.stockCount - ((index + offset) % 4) * 12),
    imageUrl: medImage(med.name),
    lastStockedAt: new Date()
  }));
}

async function seed() {
  try {
    console.log('Connecting to', MONGO);
    await mongoose.connect(MONGO);

    console.log('Clearing collections...');
    await Promise.all([
      User.deleteMany({}),
      Pharmacy.deleteMany({}),
      Prescription.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Message.deleteMany({}),
      SystemFeedback.deleteMany({})
    ]);

    console.log('Creating users...');
    const admin = await User.create({
      name: 'Kumara Senanayake',
      email: 'admin@medisync.test',
      password: 'password123',
      role: 'admin',
      phone: '+94 11 500 0001'
    });

    const pharmacists = [];
    for (const profile of pharmacistProfiles) {
      pharmacists.push(await User.create({
        ...profile,
        password: 'password123',
        role: 'pharmacist',
        isVerified: true,
        verification: { status: 'approved' }
      }));
    }

    const patients = [];
    for (const profile of patientProfiles) {
      patients.push(await User.create({
        ...profile,
        password: 'password123',
        role: 'patient'
      }));
    }

    console.log('Creating pharmacies and medicine stock...');
    const createdPharmacies = [];
    for (let i = 0; i < pharmacies.length; i++) {
      const pharmacyData = pharmacies[i];
      const pharmacistUser = pharmacists[i];

      const pharmacy = await Pharmacy.create({
        ...pharmacyData,
        pharmacist: pharmacistUser._id,
        medicines: stockMedicines(i)
      });

      pharmacistUser.pharmacyId = pharmacy._id;
      await pharmacistUser.save();
      createdPharmacies.push(pharmacy);
    }

    console.log('Creating prescriptions...');
    const prescriptions = [];

    prescriptions.push(await Prescription.create({
      patient: patients[0]._id,
      pharmacy: createdPharmacies[0]._id,
      description: 'Prescription for chest infection – Amoxicillin course',
      imageUrl: '/images/prescription-scan.jpg',
      patientNote: 'Doctor at Colombo National Hospital advised 5-day course',
      status: 'pending',
      items: [
        { name: 'Amoxicillin 500mg', brand: 'State Pharmaceuticals', price: 650, imageUrl: medImage('Amoxicillin 500mg') }
      ],
      subtotal: 650,
      total: 650
    }));

    prescriptions.push(await Prescription.create({
      patient: patients[1]._id,
      pharmacy: createdPharmacies[1]._id,
      description: 'Fever and body pain management',
      imageUrl: '/images/prescription-fever.jpg',
      patientNote: 'High fever since yesterday evening',
      status: 'approved',
      pharmacistNote: 'Approved – Paracetamol and Ibuprofen available in stock',
      items: [
        { name: 'Paracetamol 500mg', brand: 'Panadol', price: 280, imageUrl: medImage('Paracetamol 500mg') },
        { name: 'Ibuprofen 400mg', brand: 'Link Natural', price: 420, imageUrl: medImage('Ibuprofen 400mg') }
      ],
      subtotal: 700,
      total: 700
    }));

    prescriptions.push(await Prescription.create({
      patient: patients[2]._id,
      pharmacy: createdPharmacies[2]._id,
      description: 'Diabetes follow-up medicines',
      imageUrl: '/images/prescription-diabetes.jpg',
      status: 'rejected',
      pharmacistNote: 'Prescription image unclear – please re-upload with doctor signature visible',
      items: [
        { name: 'Metformin 500mg', brand: 'Hemas Pharmaceuticals', price: 480, imageUrl: medImage('Metformin 500mg') }
      ],
      subtotal: 480,
      total: 480
    }));

    prescriptions.push(await Prescription.create({
      patient: patients[3]._id,
      pharmacy: createdPharmacies[3]._id,
      description: 'Allergy relief – seasonal hay fever',
      imageUrl: '/images/prescription-allergy.jpg',
      status: 'approved',
      items: [
        { name: 'Cetirizine 10mg', brand: 'Glomed', price: 350, imageUrl: medImage('Cetirizine 10mg') }
      ],
      subtotal: 350,
      total: 350
    }));

    prescriptions.push(await Prescription.create({
      patient: patients[4]._id,
      pharmacy: createdPharmacies[4]._id,
      description: 'Asthma inhaler refill',
      imageUrl: '/images/prescription-asthma.jpg',
      status: 'approved',
      items: [
        { name: 'Salbutamol Inhaler', brand: 'GlaxoSmithKline', price: 1850, imageUrl: medImage('Salbutamol Inhaler') }
      ],
      subtotal: 1850,
      deliveryFee: 250,
      total: 2100
    }));

    prescriptions.push(await Prescription.create({
      patient: patients[5]._id,
      pharmacy: createdPharmacies[5]._id,
      description: 'Dehydration – ORS after stomach flu',
      imageUrl: '/images/prescription-ors.jpg',
      status: 'pending',
      items: [
        { name: 'ORS Sachets', brand: 'Samson', price: 120, imageUrl: medImage('ORS Sachets') }
      ],
      subtotal: 120,
      total: 120
    }));

    prescriptions.push(await Prescription.create({
      patient: patients[6]._id,
      pharmacy: createdPharmacies[6]._id,
      description: 'Vitamin supplement course',
      imageUrl: '',
      patientNote: 'Doctor recommended Vitamin C for recovery',
      status: 'approved',
      items: [
        { name: 'Vitamin C 500mg', brand: 'Vida', price: 320, imageUrl: medImage('Vitamin C 500mg') }
      ],
      subtotal: 320,
      total: 320
    }));

    prescriptions.push(await Prescription.create({
      patient: patients[7]._id,
      pharmacy: createdPharmacies[7]._id,
      description: 'Acid reflux treatment',
      imageUrl: '/images/prescription-acid.jpg',
      status: 'approved',
      items: [
        { name: 'Omeprazole 20mg', brand: 'Astron', price: 540, imageUrl: medImage('Omeprazole 20mg') }
      ],
      subtotal: 540,
      total: 540
    }));

    console.log('Creating orders...');
    const orders = [];

    orders.push(await Order.create({
      prescription: prescriptions[0]._id,
      pharmacy: createdPharmacies[0]._id,
      patient: patients[0]._id,
      subtotal: 650,
      total: 650,
      fulfillmentMode: 'pickup',
      paymentMethod: 'card',
      status: 'awaiting-payment',
      paymentStatus: 'pending'
    }));

    orders.push(await Order.create({
      prescription: prescriptions[1]._id,
      pharmacy: createdPharmacies[1]._id,
      patient: patients[1]._id,
      subtotal: 700,
      deliveryFee: 400,
      total: 1100,
      fulfillmentMode: 'delivery',
      paymentMethod: 'card',
      status: 'preparing',
      paymentStatus: 'paid',
      deliveryAddress: 'No. 22, Duplication Road, Colombo 04'
    }));

    orders.push(await Order.create({
      prescription: prescriptions[3]._id,
      pharmacy: createdPharmacies[3]._id,
      patient: patients[3]._id,
      subtotal: 350,
      total: 350,
      fulfillmentMode: 'pickup',
      paymentMethod: 'cash',
      status: 'ready',
      paymentStatus: 'pending',
      pickupCode: 'GAL-4821'
    }));

    orders.push(await Order.create({
      prescription: prescriptions[4]._id,
      pharmacy: createdPharmacies[4]._id,
      patient: patients[4]._id,
      subtotal: 1850,
      deliveryFee: 250,
      total: 2100,
      fulfillmentMode: 'delivery',
      paymentMethod: 'cash',
      status: 'preparing',
      paymentStatus: 'pending',
      deliveryAddress: 'No. 14, Beach Road, Negombo'
    }));

    orders.push(await Order.create({
      prescription: prescriptions[6]._id,
      pharmacy: createdPharmacies[6]._id,
      patient: patients[6]._id,
      subtotal: 320,
      deliveryFee: 300,
      total: 620,
      fulfillmentMode: 'delivery',
      paymentMethod: 'card',
      status: 'out-for-delivery',
      paymentStatus: 'paid',
      deliveryAddress: 'No. 88, High Level Road, Nugegoda'
    }));

    orders.push(await Order.create({
      prescription: prescriptions[7]._id,
      pharmacy: createdPharmacies[7]._id,
      patient: patients[7]._id,
      subtotal: 540,
      total: 540,
      fulfillmentMode: 'pickup',
      paymentMethod: 'cash',
      status: 'completed',
      paymentStatus: 'paid',
      pickupCode: 'MAT-7730'
    }));

    console.log('Creating reviews and feedback...');
    await Review.create([
      {
        patient: patients[0]._id,
        pharmacy: createdPharmacies[0]._id,
        rating: 5,
        comment: 'Very helpful staff at Lanka Pharmacy. Got my medicine within 15 minutes.'
      },
      {
        patient: patients[1]._id,
        pharmacy: createdPharmacies[1]._id,
        rating: 4,
        comment: 'Good service and fast delivery to Bambalapitiya. Delivery fee is reasonable.'
      },
      {
        patient: patients[3]._id,
        pharmacy: createdPharmacies[3]._id,
        rating: 5,
        comment: 'Lovely pharmacy inside Galle Fort. Pharmacist spoke good English.'
      },
      {
        patient: patients[5]._id,
        pharmacy: createdPharmacies[5]._id,
        rating: 3,
        comment: 'Medicine was available but had to wait 30 minutes during lunch break.'
      },
      {
        patient: patients[8]._id,
        pharmacy: createdPharmacies[8]._id,
        rating: 5,
        comment: 'Hemas pharmacy on Galle Road always has what I need. Highly recommend.'
      },
      {
        patient: patients[9]._id,
        pharmacy: createdPharmacies[2]._id,
        rating: 4,
        comment: 'Kandy City Pharmacy is convenient near the temple. Friendly service.'
      }
    ]);

    await SystemFeedback.create([
      {
        patient: patients[2]._id,
        rating: 4,
        comment: 'MEDISYNC app is easy to use. Would like Sinhala language support in future.'
      },
      {
        patient: patients[4]._id,
        rating: 5,
        comment: 'Excellent platform! Found a pharmacy in Negombo and tracked my order easily.'
      },
      {
        patient: patients[7]._id,
        rating: 3,
        comment: 'Payment page took a few seconds to load on mobile data. Otherwise works well.'
      }
    ]);

    console.log('Creating messages...');
    await Message.create([
      {
        patient: patients[0]._id,
        pharmacist: pharmacists[0]._id,
        pharmacy: createdPharmacies[0]._id,
        senderRole: 'patient',
        text: 'Ayubowan, is Amoxicillin 500mg available today at your Fort branch?'
      },
      {
        patient: patients[0]._id,
        pharmacist: pharmacists[0]._id,
        pharmacy: createdPharmacies[0]._id,
        senderRole: 'pharmacist',
        text: 'Ayubowan! Yes, State Pharmaceuticals Amoxicillin is in stock. Please upload your prescription.'
      },
      {
        patient: patients[1]._id,
        pharmacist: pharmacists[1]._id,
        pharmacy: createdPharmacies[1]._id,
        senderRole: 'patient',
        text: 'Can you deliver to Duplication Road today before 6 PM?'
      },
      {
        patient: patients[1]._id,
        pharmacist: pharmacists[1]._id,
        pharmacy: createdPharmacies[1]._id,
        senderRole: 'pharmacist',
        text: 'Yes, delivery to Colombo 04 is available. Order before 4 PM for same-day delivery.'
      },
      {
        patient: patients[4]._id,
        pharmacist: pharmacists[4]._id,
        pharmacy: createdPharmacies[4]._id,
        senderRole: 'patient',
        text: 'Do you have Salbutamol inhaler in stock? My child needs it urgently.'
      },
      {
        patient: patients[4]._id,
        pharmacist: pharmacists[4]._id,
        pharmacy: createdPharmacies[4]._id,
        senderRole: 'pharmacist',
        text: 'Salbutamol inhaler (GSK) is available. Please upload the prescription and we will prepare it.'
      },
      {
        patient: patients[8]._id,
        pharmacist: pharmacists[8]._id,
        pharmacy: createdPharmacies[8]._id,
        senderRole: 'patient',
        text: 'What are your opening hours on Poya days?'
      }
    ]);

    console.log('\nSeed complete (Sri Lanka dataset):');
    console.log(`Admin: ${admin.email} / password123`);
    console.log(`Pharmacists: ${pharmacists.length} (e.g. ${pharmacists[0].email})`);
    console.log(`Patients: ${patients.length} (e.g. ${patients[0].email})`);
    console.log(`Pharmacies: ${createdPharmacies.length}`);
    console.log(`Prescriptions: ${prescriptions.length}`);
    console.log(`Orders: ${orders.length}`);
    console.log('Reviews: 6 | System feedback: 3 | Messages: 7');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
