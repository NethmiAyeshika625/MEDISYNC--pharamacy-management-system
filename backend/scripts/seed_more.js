import 'dotenv/config';
import mongoose from 'mongoose';

import User from '../src/models/User.js';
import Pharmacy from '../src/models/Pharmacy.js';
import Prescription from '../src/models/Prescription.js';
import Order from '../src/models/Order.js';

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/medisync-db';

async function upsertUser(email, props) {
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email, ...props });
  return user;
}

async function seed() {
  try {
    console.log('Connecting to', MONGO);
    await mongoose.connect(MONGO);

    const admin = await upsertUser('admin@medisync.test', {
      name: 'Kumara Senanayake',
      password: 'password123',
      role: 'admin',
      phone: '+94 11 500 0001'
    });

    const pharmacist = await upsertUser('pharmacist@medisync.test', {
      name: 'Dr. Nimal Perera',
      password: 'password123',
      role: 'pharmacist',
      isVerified: true,
      verification: { status: 'approved' },
      phone: '+94 77 123 4567'
    });

    const patient = await upsertUser('patient@medisync.test', {
      name: 'Sithumi Jayawardena',
      password: 'password123',
      role: 'patient',
      phone: '+94 71 111 2233'
    });

    const extraPatient = await upsertUser('patient2@medisync.test', {
      name: 'Kasun Silva',
      password: 'password123',
      role: 'patient',
      phone: '+94 71 222 3344'
    });

    const extraPharmacist = await upsertUser('pharmacist2@medisync.test', {
      name: 'Dr. Priya Fernando',
      password: 'password123',
      role: 'pharmacist',
      isVerified: true,
      verification: { status: 'approved' },
      phone: '+94 77 234 5678'
    });

    const pharmacies = [
      {
        name: 'Ratnapura Gem City Pharmacy',
        slug: 'ratnapura-gem-city-pharmacy',
        coordinates: { lat: 6.6828, lng: 80.3992 },
        address: 'No. 33, Main Street, Ratnapura',
        phone: '+94 45 222 6677',
        description: 'Sabaragamuwa province pharmacy near gem trading area',
        locationLabel: 'Ratnapura Main Street',
        city: 'Ratnapura',
        pharmacist: pharmacist._id,
        deliveryEnabled: true,
        deliveryFee: 300,
        openingHours: '8:00 AM - 9:00 PM',
        medicines: [
          { name: 'Paracetamol 500mg', price: 280, stockCount: 300, brand: 'Panadol', imageUrl: '/images/paracetamol.jpg', expiryDate: new Date('2026-12-15'), lowStockThreshold: 50 },
          { name: 'Ibuprofen 400mg', price: 420, stockCount: 120, brand: 'Link Natural', imageUrl: '/images/ibuprofen.jpg', expiryDate: new Date('2026-07-10'), lowStockThreshold: 25 }
        ]
      },
      {
        name: 'Batticaloa East Coast Pharmacy',
        slug: 'batticaloa-east-coast-pharmacy',
        coordinates: { lat: 7.7102, lng: 81.6924 },
        address: 'No. 41, Central Road, Batticaloa',
        phone: '+94 65 222 8899',
        description: 'Eastern province pharmacy serving Batticaloa town',
        locationLabel: 'Batticaloa Central Road',
        city: 'Batticaloa',
        pharmacist: extraPharmacist._id,
        deliveryEnabled: true,
        deliveryFee: 350,
        openingHours: '8:00 AM - 8:30 PM',
        medicines: [
          { name: 'Vitamin C 500mg', price: 320, stockCount: 180, brand: 'Vida', imageUrl: '/images/vitamin-c.jpg', expiryDate: new Date('2026-11-20'), lowStockThreshold: 30 },
          { name: 'Cetirizine 10mg', price: 350, stockCount: 90, brand: 'Glomed', imageUrl: '/images/cetirizine.jpg', expiryDate: new Date('2026-09-20'), lowStockThreshold: 20 }
        ]
      }
    ];

    const created = [];
    for (const p of pharmacies) {
      let ph = await Pharmacy.findOne({ slug: p.slug });
      if (!ph) ph = await Pharmacy.create(p);
      created.push(ph);
    }

    pharmacist.pharmacyId = created[0]._id;
    extraPharmacist.pharmacyId = created[1]._id;
    await Promise.all([pharmacist.save(), extraPharmacist.save()]);

    const pres1 = await Prescription.create({
      patient: patient._id,
      pharmacy: created[0]._id,
      items: [{ name: 'Ibuprofen 400mg', price: 420, brand: 'Link Natural', imageUrl: '/images/ibuprofen.jpg' }],
      description: 'Joint pain management prescription',
      imageUrl: '/images/pres1.jpg',
      status: 'pending',
      subtotal: 420,
      total: 420
    });

    const pres2 = await Prescription.create({
      patient: extraPatient._id,
      pharmacy: created[1]._id,
      items: [{ name: 'Vitamin C 500mg', price: 320, brand: 'Vida', imageUrl: '/images/vitamin-c.jpg' }],
      description: 'Vitamin supplement after flu recovery',
      imageUrl: '/images/pres2.jpg',
      status: 'approved',
      subtotal: 320,
      total: 320
    });

    const order1 = await Order.create({
      prescription: pres2._id,
      pharmacy: created[1]._id,
      patient: extraPatient._id,
      subtotal: 320,
      deliveryFee: 350,
      total: 670,
      fulfillmentMode: 'delivery',
      paymentMethod: 'card',
      status: 'preparing',
      paymentStatus: 'paid',
      deliveryAddress: 'No. 5, Lake Road, Batticaloa'
    });

    console.log('Added Sri Lanka extra data:');
    console.log('Admin:', admin.email);
    console.log('Pharmacies:', created.map((p) => ({ name: p.name, city: p.city })));
    console.log('Prescriptions:', [pres1._id.toString(), pres2._id.toString()]);
    console.log('Orders:', [order1._id.toString()]);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed more error:', err);
    process.exit(1);
  }
}

seed();
