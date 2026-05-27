import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import Pharmacy from '../src/models/Pharmacy.js'
import Prescription from '../src/models/Prescription.js'
import Order from '../src/models/Order.js'

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/medisync'

async function list() {
  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
    const users = await User.find({}).lean()
    const pharmacies = await Pharmacy.find({}).lean()
    const prescriptions = await Prescription.find({}).lean()
    const orders = await Order.find({}).lean()

    console.log('USERS')
    users.forEach(u => console.log(JSON.stringify({ id: u._id, name: u.name, email: u.email, role: u.role }, null, 2)))
    console.log('\nPHARMACIES')
    pharmacies.forEach(p => console.log(JSON.stringify({ id: p._id, name: p.name, city: p.city, pharmacist: p.pharmacist }, null, 2)))
    console.log('\nPRESCRIPTIONS')
    prescriptions.forEach(r => console.log(JSON.stringify({ id: r._id, patient: r.patient, pharmacy: r.pharmacy, status: r.status }, null, 2)))
    console.log('\nORDERS')
    orders.forEach(o => console.log(JSON.stringify({ id: o._id, prescription: o.prescription, patient: o.patient, status: o.status, paymentStatus: o.paymentStatus }, null, 2)))

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('Error listing records:', err)
    process.exit(1)
  }
}

list()
