import 'dotenv/config'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '../src')

// import models
import User from '../src/models/User.js'
import Pharmacy from '../src/models/Pharmacy.js'
import Prescription from '../src/models/Prescription.js'
import Order from '../src/models/Order.js'

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/medisync'

const medicines = [
  { name: 'Amoxicillin', brand: 'Generic', price: 12.5, stockCount: 100, expiryDate: new Date('2026-10-01'), lowStockThreshold: 20, nearExpiryThresholdDays: 30 },
  { name: 'Paracetamol', brand: 'Acme', price: 4.0, stockCount: 500, expiryDate: new Date('2026-12-01'), lowStockThreshold: 50, nearExpiryThresholdDays: 30 },
  { name: 'Ibuprofen', brand: 'Advil', price: 8.5, stockCount: 150, expiryDate: new Date('2026-07-10'), lowStockThreshold: 25, nearExpiryThresholdDays: 45 },
  { name: 'Cough Syrup', brand: 'RoboRx', price: 6.0, stockCount: 75, expiryDate: new Date('2026-06-12'), lowStockThreshold: 15, nearExpiryThresholdDays: 30 },
  { name: 'Vitamin C', brand: 'Nature Lab', price: 5.5, stockCount: 200, expiryDate: new Date('2026-11-20'), lowStockThreshold: 30, nearExpiryThresholdDays: 30 },
  { name: 'Aspirin', brand: 'Bayer', price: 3.5, stockCount: 8, expiryDate: new Date('2026-09-15'), lowStockThreshold: 15, nearExpiryThresholdDays: 30 },
  { name: 'Loratadine', brand: 'Claritin', price: 9.0, stockCount: 120, expiryDate: new Date('2026-08-30'), lowStockThreshold: 20, nearExpiryThresholdDays: 30 },
  { name: 'Metformin', brand: 'Glucophage', price: 15.0, stockCount: 300, expiryDate: new Date('2027-01-15'), lowStockThreshold: 50, nearExpiryThresholdDays: 30 },
];

const pharmacies = [
  {
    name: 'Main St Pharmacy',
    slug: 'main-st-pharmacy',
    address: '123 Main St',
    city: 'Metro City',
    locationLabel: 'Main St & 1st Ave',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    phone: '+1-555-0101',
    description: 'Friendly neighborhood pharmacy with fast service',
    deliveryEnabled: true,
    deliveryFee: 2.5,
    openingHours: '8:00 AM - 10:00 PM'
  },
  {
    name: 'Downtown Pharmacy',
    slug: 'downtown-pharmacy',
    address: '456 Oak Ave',
    city: 'Metro City',
    locationLabel: 'Downtown Center',
    coordinates: { lat: 40.7138, lng: -74.0070 },
    phone: '+1-555-0102',
    description: 'Central location with extended hours',
    deliveryEnabled: true,
    deliveryFee: 3.0,
    openingHours: '7:00 AM - 11:00 PM'
  },
  {
    name: 'Riverside Pharmacy',
    slug: 'riverside-pharmacy',
    address: '789 River Rd',
    city: 'Riverside',
    locationLabel: 'Riverside Shopping Center',
    coordinates: { lat: 40.6800, lng: -74.0200 },
    phone: '+1-555-0103',
    description: 'Full-service pharmacy with vaccination services',
    deliveryEnabled: false,
    deliveryFee: 0,
    openingHours: '9:00 AM - 9:00 PM'
  },
  {
    name: 'Westside Clinic Pharmacy',
    slug: 'westside-pharmacy',
    address: '321 West Blvd',
    city: 'Westville',
    locationLabel: 'Westside Medical Complex',
    coordinates: { lat: 40.7400, lng: -74.0300 },
    phone: '+1-555-0104',
    description: 'Integrated with clinic for comprehensive care',
    deliveryEnabled: true,
    deliveryFee: 2.0,
    openingHours: '8:00 AM - 8:00 PM'
  },
  {
    name: 'Uptown Health Pharmacy',
    slug: 'uptown-pharmacy',
    address: '654 North St',
    city: 'Uptown Heights',
    locationLabel: 'Uptown Medical District',
    coordinates: { lat: 40.7600, lng: -73.9900 },
    phone: '+1-555-0105',
    description: 'Specialized in chronic disease management',
    deliveryEnabled: true,
    deliveryFee: 3.5,
    openingHours: '8:30 AM - 9:30 PM'
  }
];

async function seed() {
  try {
    console.log('Connecting to', MONGO)
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })

    console.log('Clearing collections...')
    await Promise.all([
      User.deleteMany({}),
      Pharmacy.deleteMany({}),
      Prescription.deleteMany({}),
      Order.deleteMany({}),
    ])

    console.log('Creating users...')
    const admin = await User.create({ name: 'Admin User', email: 'admin@medisync.test', password: 'password123', role: 'admin' })
    
    // Create multiple pharmacists
    const pharmacist1 = await User.create({ name: 'Pharmacist Joe', email: 'pharmacist@medisync.test', password: 'password123', role: 'pharmacist' })
    const pharmacist2 = await User.create({ name: 'Pharmacist Sarah', email: 'pharmacist2@medisync.test', password: 'password123', role: 'pharmacist' })
    const pharmacist3 = await User.create({ name: 'Pharmacist Mike', email: 'pharmacist3@medisync.test', password: 'password123', role: 'pharmacist' })
    const pharmacist4 = await User.create({ name: 'Pharmacist Lisa', email: 'pharmacist4@medisync.test', password: 'password123', role: 'pharmacist' })
    const pharmacist5 = await User.create({ name: 'Pharmacist David', email: 'pharmacist5@medisync.test', password: 'password123', role: 'pharmacist' })

    // Create multiple patients
    const patients = []
    for (let i = 1; i <= 5; i++) {
      const patient = await User.create({
        name: `Patient ${String.fromCharCode(64 + i)}`,
        email: `patient${i}@medisync.test`,
        password: 'password123',
        role: 'patient'
      })
      patients.push(patient)
    }
    const patient = patients[0] // Primary patient for demos

    console.log('Creating pharmacies and medicines...')
    const createdPharmacies = []
    const pharmacistList = [pharmacist1, pharmacist2, pharmacist3, pharmacist4, pharmacist5]

    for (let i = 0; i < pharmacies.length; i++) {
      const pharmacyData = pharmacies[i]
      const pharmacistUser = pharmacistList[i]
      
      const pharmacy = await Pharmacy.create({
        ...pharmacyData,
        pharmacist: pharmacistUser._id,
        medicines: medicines.map(med => ({
          ...med,
          imageUrl: `/images/${med.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          lastStockedAt: new Date()
        }))
      })

      pharmacistUser.pharmacyId = pharmacy._id
      await pharmacistUser.save()
      createdPharmacies.push(pharmacy)
    }

    console.log('Creating prescriptions at various stages...')
    const prescriptions = []

    // Pending prescription
    const pending = await Prescription.create({
      patient: patient._id,
      pharmacy: createdPharmacies[0]._id,
      items: [
        { name: 'Amoxicillin', dosage: '500mg', quantity: 10, price: 12.5, brand: 'Generic' },
      ],
      notes: 'Take after meals',
      description: 'Prescription for infection',
      imageUrl: '/images/prescription-scan.jpg',
      status: 'pending',
    })
    prescriptions.push(pending)

    // Accepted prescription
    const accepted = await Prescription.create({
      patient: patients[1]._id,
      pharmacy: createdPharmacies[1]._id,
      items: [
        { name: 'Paracetamol', dosage: '500mg', quantity: 20, price: 4.0, brand: 'Acme' },
        { name: 'Ibuprofen', dosage: '400mg', quantity: 15, price: 8.5, brand: 'Advil' },
      ],
      notes: 'For fever and pain',
      description: 'Fever management prescription',
      status: 'accepted',
    })
    prescriptions.push(accepted)

    // Rejected prescription
    const rejected = await Prescription.create({
      patient: patients[2]._id,
      pharmacy: createdPharmacies[2]._id,
      items: [
        { name: 'Metformin', dosage: '1000mg', quantity: 30, price: 15.0, brand: 'Glucophage' },
      ],
      notes: 'Diabetes management',
      status: 'rejected',
      rejectionReason: 'Prescription requires pharmacist review'
    })
    prescriptions.push(rejected)

    console.log('Creating orders at various stages...')

    // Awaiting payment
    const order1 = await Order.create({
      prescription: prescriptions[0]._id,
      pharmacy: createdPharmacies[0]._id,
      patient: patient._id,
      subtotal: 125.0,
      total: 125.0,
      fulfillmentMode: 'pickup',
      status: 'awaiting-payment',
    })

    // Preparing
    const order2 = await Order.create({
      prescription: prescriptions[1]._id,
      pharmacy: createdPharmacies[1]._id,
      patient: patients[1]._id,
      subtotal: 245.0,
      total: 248.0,
      fulfillmentMode: 'delivery',
      status: 'preparing',
    })

    // Ready for pickup
    const order3 = await Order.create({
      prescription: null,
      pharmacy: createdPharmacies[2]._id,
      patient: patients[2]._id,
      items: [
        { name: 'Vitamin C', quantity: 1, price: 5.5, brand: 'Nature Lab' }
      ],
      subtotal: 5.5,
      total: 5.5,
      fulfillmentMode: 'pickup',
      status: 'ready',
    })

    // Completed order
    const order4 = await Order.create({
      prescription: null,
      pharmacy: createdPharmacies[3]._id,
      patient: patients[3]._id,
      items: [
        { name: 'Aspirin', quantity: 2, price: 3.5, brand: 'Bayer' }
      ],
      subtotal: 7.0,
      total: 7.0,
      fulfillmentMode: 'pickup',
      status: 'completed',
    })

    // In transit (delivery)
    const order5 = await Order.create({
      prescription: null,
      pharmacy: createdPharmacies[4]._id,
      patient: patients[4]._id,
      items: [
        { name: 'Loratadine', quantity: 1, price: 9.0, brand: 'Claritin' },
        { name: 'Vitamin C', quantity: 1, price: 5.5, brand: 'Nature Lab' }
      ],
      subtotal: 14.5,
      total: 17.5,
      fulfillmentMode: 'delivery',
      status: 'out-for-delivery',
    })

    console.log('Seed complete:')
    console.log(`Admin: ${admin.email}`)
    console.log(`Pharmacists: ${pharmacistList.map(p => p.email).join(', ')}`)
    console.log(`Patients: ${patients.map(p => p.email).join(', ')}`)
    console.log(`Pharmacies: ${createdPharmacies.length}`)
    console.log(`Prescriptions: ${prescriptions.length}`)
    console.log(`Orders: 5`)
    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
}

seed()
