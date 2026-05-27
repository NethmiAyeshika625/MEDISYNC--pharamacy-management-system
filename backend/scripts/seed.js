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
    const pharmacist = await User.create({ name: 'Pharmacist Joe', email: 'pharmacist@medisync.test', password: 'password123', role: 'pharmacist' })
    const patient = await User.create({ name: 'Patient Mary', email: 'patient@medisync.test', password: 'password123', role: 'patient' })

    console.log('Creating pharmacy and medicines...')
    const pharmacy = await Pharmacy.create({
      name: 'Main St Pharmacy',
      address: '123 Main St',
      owner: pharmacist._id,
      pharmacist: pharmacist._id,
      phone: '+1234567890',
      description: 'Friendly neighborhood pharmacy',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      locationLabel: 'Main St & 1st',
      city: 'Metro City',
      slug: 'main-st-pharmacy',
      medicines: [
        { name: 'Amoxicillin', sku: 'AMX-500', price: 12.5, stock: 100, brand: 'Generic', imageUrl: '/images/amoxicillin.jpg' },
        { name: 'Paracetamol', sku: 'PCM-500', price: 4.0, stock: 500, brand: 'Acme', imageUrl: '/images/paracetamol.jpg' },
      ],
    })

    pharmacist.pharmacyId = pharmacy._id
    await pharmacist.save()

    console.log('Creating a sample prescription...')
    const prescription = await Prescription.create({
      patient: patient._id,
      pharmacy: pharmacy._id,
      items: [
        { name: 'Amoxicillin', dosage: '500mg', quantity: 10, price: 12.5, brand: 'Generic', imageUrl: '/images/amoxicillin.jpg' },
      ],
      notes: 'Take after meals',
      description: 'Prescription for Amoxicillin',
      imageUrl: '/images/prescription-scan.jpg',
      status: 'pending',
    })

    console.log('Creating a sample order...')
    const order = await Order.create({
      prescription: prescription._id,
      pharmacy: pharmacy._id,
      patient: patient._id,
      subtotal: 125.0,
      total: 125.0,
      fulfillmentMode: 'pickup',
      status: 'awaiting-payment',
    })

    console.log('Seed complete:')
    console.log({ admin: admin.email, pharmacist: pharmacist.email, patient: patient.email })
    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
}

seed()
