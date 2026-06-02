import 'dotenv/config'
import mongoose from 'mongoose'

import User from '../src/models/User.js'
import Pharmacy from '../src/models/Pharmacy.js'
import Prescription from '../src/models/Prescription.js'
import Order from '../src/models/Order.js'

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/medisync'

async function upsertUser(email, props) {
  let user = await User.findOne({ email })
  if (!user) user = await User.create({ email, ...props })
  return user
}

async function seed() {
  try {
    console.log('Connecting to', MONGO)
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })

    // Ensure some patients and pharmacists exist
    const admin = await upsertUser('admin@medisync.test', { name: 'Admin User', password: 'password123', role: 'admin' })
    const pharmacistJoe = await upsertUser('pharmacist@medisync.test', { name: 'Pharmacist Joe', password: 'password123', role: 'pharmacist' })
    const patientMary = await upsertUser('patient@medisync.test', { name: 'Patient Mary', password: 'password123', role: 'patient' })

    const extraPatient = await upsertUser('alice@medisync.test', { name: 'Alice Patient', password: 'password123', role: 'patient' })
    const extraPharmacist = await upsertUser('pharm2@medisync.test', { name: 'Pharmacy Sam', password: 'password123', role: 'pharmacist' })

    console.log('Creating pharmacies...')
    const pharmacies = [
      {
        name: 'Riverbank Pharmacy', coordinates: { lat: 40.7128, lng: -74.0060 },
        address: '45 Riverbank Ave',
        phone: '+1111111111',
        description: 'Open 24/7 near the river',
        locationLabel: 'Riverbank Ave',
        city: 'Rivertown',
        slug: 'riverbank-pharmacy',
        pharmacist: pharmacistJoe._id,
        medicines: [
          { name: 'Ibuprofen', price: 6.5, stockCount: 150, brand: 'Wellness', imageUrl: '/images/ibuprofen.jpg', expiryDate: '2026-07-10', lowStockThreshold: 25 },
          { name: 'Cough Syrup', price: 8.0, stockCount: 75, brand: 'ColdAway', imageUrl: '/images/cough.jpg', expiryDate: '2026-06-12', lowStockThreshold: 20 }
        ]
      },
      {
        name: 'Green Cross Pharmacy', coordinates: { lat: 34.0522, lng: -118.2437 },
        address: '10 Green St',
        phone: '+2222222222',
        description: 'Friendly service and home delivery',
        locationLabel: 'Green St',
        city: 'Greenville',
        slug: 'green-cross',
        pharmacist: extraPharmacist._id,
        medicines: [
          { name: 'Vitamin C', price: 10.0, stockCount: 200, brand: 'Nutra', imageUrl: '/images/vitc.jpg', expiryDate: '2026-11-20', lowStockThreshold: 30 },
          { name: 'Paracetamol', price: 4.0, stockCount: 500, brand: 'Acme', imageUrl: '/images/paracetamol.jpg', expiryDate: '2026-12-15', lowStockThreshold: 50 }
        ]
      },
      {
        name: 'Main St Pharmacy', coordinates: { lat: 41.8781, lng: -87.6298 },
        address: '123 Main St',
        phone: '+1234567890',
        description: 'Friendly neighborhood pharmacy',
        locationLabel: 'Main St & 1st',
        city: 'Metro City',
        slug: 'main-st-pharmacy',
        pharmacist: pharmacistJoe._id,
        medicines: [
          { name: 'Amoxicillin', price: 12.5, stockCount: 100, brand: 'Generic', imageUrl: '/images/amoxicillin.jpg', expiryDate: '2026-10-01', lowStockThreshold: 20 },
          { name: 'Paracetamol', price: 4.0, stockCount: 500, brand: 'Acme', imageUrl: '/images/paracetamol.jpg', expiryDate: '2026-12-01', lowStockThreshold: 50 }
        ]
      }
    ]

    const created = []
    for (const p of pharmacies) {
      let ph = await Pharmacy.findOne({ slug: p.slug })
      if (!ph) ph = await Pharmacy.create(p)
      created.push(ph)
    }

    pharmacistJoe.pharmacyId = created[0]._id
    extraPharmacist.pharmacyId = created[1]._id
    await Promise.all([pharmacistJoe.save(), extraPharmacist.save()])

    console.log('Creating prescriptions...')
    // create sample prescriptions for patientMary and extraPatient
    const pres1 = await Prescription.create({
      patient: patientMary._id,
      pharmacy: created[0]._id,
      items: [{ name: 'Ibuprofen', price: 6.5, brand: 'Wellness', imageUrl: '/images/ibuprofen.jpg' }],
      description: 'Pain management',
      imageUrl: '/images/pres1.jpg',
      status: 'pending'
    })

    const pres2 = await Prescription.create({
      patient: extraPatient._id,
      pharmacy: created[1]._id,
      items: [{ name: 'Vitamin C', price: 10.0, brand: 'Nutra', imageUrl: '/images/vitc.jpg' }],
      description: 'Supplement',
      imageUrl: '/images/pres2.jpg',
      status: 'approved'
    })

    console.log('Creating orders...')
    const order1 = await Order.create({
      prescription: pres2._id,
      pharmacy: created[1]._id,
      patient: extraPatient._id,
      subtotal: 10.0,
      total: 10.0,
      fulfillmentMode: 'delivery',
      status: 'preparing',
      paymentStatus: 'paid'
    })

    console.log('Added data:')
    console.log('Pharmacies:', created.map((p) => ({ id: p._id, name: p.name, city: p.city })))
    console.log('Prescriptions:', [pres1._id.toString(), pres2._id.toString()])
    console.log('Orders:', [order1._id.toString()])

    await mongoose.disconnect()
    console.log('Done')
    process.exit(0)
  } catch (err) {
    console.error('Seed more error:', err)
    process.exit(1)
  }
}

seed()


