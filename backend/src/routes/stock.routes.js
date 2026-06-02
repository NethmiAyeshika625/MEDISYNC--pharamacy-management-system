import express from 'express';
import Pharmacy from '../models/Pharmacy.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import requireVerifiedPharmacist from '../middleware/requireVerifiedPharmacist.js';
import { pharmacistStockView, computeMedicineStockState } from '../utils/stock.js';

const router = express.Router();

async function loadPharmacyForCurrentUser(req) {
  const pharmacyId = req.user?.pharmacyId || req.query.pharmacyId;
  if (!pharmacyId) {
    return null;
  }

  return Pharmacy.findById(pharmacyId).populate('pharmacist', 'name role avatarUrl phone');
}

function findMedicine(pharmacy, medicineKey) {
  const byId = pharmacy.medicines.id?.(medicineKey);
  if (byId) {
    return byId;
  }

  const [name, brand] = String(medicineKey).split('::');
  const normalizedName = String(name || '').trim().toLowerCase();
  const normalizedBrand = String(brand || '').trim().toLowerCase();
  return pharmacy.medicines.find((medicine) => String(medicine.name || '').trim().toLowerCase() === normalizedName && String(medicine.brand || '').trim().toLowerCase() === normalizedBrand);
}

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }

  return fallback;
}

router.get('/me/stock', authRequired, allowRoles('pharmacist', 'admin'), requireVerifiedPharmacist, async (req, res, next) => {
  try {
    const pharmacy = await loadPharmacyForCurrentUser(req);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found for current user' });
    }

    res.json(pharmacistStockView(pharmacy));
  } catch (error) {
    next(error);
  }
});

router.patch('/me/stock/:medicineId', authRequired, allowRoles('pharmacist', 'admin'), requireVerifiedPharmacist, async (req, res, next) => {
  try {
    const pharmacy = await loadPharmacyForCurrentUser(req);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found for current user' });
    }

    const medicine = findMedicine(pharmacy, req.params.medicineId);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const { name, brand, price, imageUrl, stockCount, expiryDate, available, lowStockThreshold, nearExpiryThresholdDays } = req.body;
    const parsedPrice = parseNumber(price);
    const parsedStockCount = parseNumber(stockCount);
    const parsedLowStockThreshold = parseNumber(lowStockThreshold);
    const parsedNearExpiryThresholdDays = parseNumber(nearExpiryThresholdDays);

    if (typeof name === 'string') medicine.name = name;
    if (typeof brand === 'string') medicine.brand = brand;
    if (parsedPrice !== null) medicine.price = parsedPrice;
    if (typeof imageUrl === 'string') medicine.imageUrl = imageUrl;
    if (parsedLowStockThreshold !== null) medicine.lowStockThreshold = parsedLowStockThreshold;
    if (parsedNearExpiryThresholdDays !== null) medicine.nearExpiryThresholdDays = parsedNearExpiryThresholdDays;
    if (typeof expiryDate === 'string' && expiryDate) medicine.expiryDate = new Date(expiryDate);
    if (parsedStockCount !== null) {
      medicine.stockCount = parsedStockCount;
      medicine.lastStockedAt = new Date();
      if (typeof available !== 'boolean' && typeof available !== 'string') {
        medicine.available = parsedStockCount > 0;
      }
    }
    const parsedAvailable = parseBoolean(available, null);
    if (parsedAvailable !== null) {
      medicine.available = parsedAvailable;
    }

    await pharmacy.save();

    const updated = findMedicine(pharmacy, req.params.medicineId);
    const stockState = computeMedicineStockState(updated);
    const io = req.app.get('io');
    io?.to(`pharmacy:${pharmacy.id}`).emit('stock:updated', {
      pharmacyId: pharmacy.id,
      medicine: stockState,
      stockSummary: pharmacistStockView(pharmacy).stockSummary
    });

    if (stockState.nearExpiry || stockState.expired) {
      io?.to(`pharmacy:${pharmacy.id}`).emit('stock:alert', {
        pharmacyId: pharmacy.id,
        message: stockState.expired
          ? `${stockState.name} has expired`
          : `${stockState.name} is near expiry in ${stockState.daysToExpiry} day${stockState.daysToExpiry === 1 ? '' : 's'}`
      });
      // notify admins as well
      io?.to('admin:global').emit('stock:alert', {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        message: stockState.expired
          ? `${stockState.name} has expired`
          : `${stockState.name} is near expiry in ${stockState.daysToExpiry} day${stockState.daysToExpiry === 1 ? '' : 's'}`,
        medicine: { id: stockState.id || null, name: stockState.name }
      });
    }

    res.json(pharmacistStockView(pharmacy));
  } catch (error) {
    next(error);
  }
});

router.post('/me/stock', authRequired, allowRoles('pharmacist', 'admin'), requireVerifiedPharmacist, async (req, res, next) => {
  try {
    const pharmacy = await loadPharmacyForCurrentUser(req);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found for current user' });
    }

    const { medicineId, name, brand, price, imageUrl, stockCount, expiryDate, available = true, lowStockThreshold, nearExpiryThresholdDays } = req.body;
    const parsedPrice = parseNumber(price);
    const parsedStockCount = parseNumber(stockCount);
    const parsedLowStockThreshold = parseNumber(lowStockThreshold);
    const parsedNearExpiryThresholdDays = parseNumber(nearExpiryThresholdDays);
    const parsedAvailable = parseBoolean(available, true);

    if (!name || !brand || parsedPrice === null) {
      return res.status(400).json({ message: 'name, brand, and price are required' });
    }

    const existing = medicineId
      ? findMedicine(pharmacy, medicineId)
      : pharmacy.medicines.find((medicine) => String(medicine.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase() && String(medicine.brand || '').trim().toLowerCase() === String(brand || '').trim().toLowerCase());
    if (existing) {
      existing.price = parsedPrice;
      if (typeof imageUrl === 'string' && imageUrl.trim()) {
        existing.imageUrl = imageUrl;
      }
      existing.stockCount = parsedStockCount !== null ? parsedStockCount : existing.stockCount;
      existing.expiryDate = expiryDate ? new Date(expiryDate) : existing.expiryDate;
      existing.available = parsedAvailable !== null ? parsedAvailable : existing.stockCount > 0;
      existing.lowStockThreshold = parsedLowStockThreshold !== null ? parsedLowStockThreshold : existing.lowStockThreshold;
      existing.nearExpiryThresholdDays = parsedNearExpiryThresholdDays !== null ? parsedNearExpiryThresholdDays : existing.nearExpiryThresholdDays;
      existing.lastStockedAt = new Date();
    } else {
      pharmacy.medicines.push({
        name,
        brand,
        price: parsedPrice,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
        stockCount: parsedStockCount !== null ? parsedStockCount : 0,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        available: parsedAvailable,
        lowStockThreshold: parsedLowStockThreshold !== null ? parsedLowStockThreshold : undefined,
        nearExpiryThresholdDays: parsedNearExpiryThresholdDays !== null ? parsedNearExpiryThresholdDays : undefined,
        lastStockedAt: new Date()
      });
    }

    await pharmacy.save();

    const updated = findMedicine(pharmacy, medicineId || `${name}::${brand}`);
    const stockState = updated ? computeMedicineStockState(updated) : null;
    const io = req.app.get('io');
    io?.to(`pharmacy:${pharmacy.id}`).emit('stock:updated', {
      pharmacyId: pharmacy.id,
      medicine: stockState,
      stockSummary: pharmacistStockView(pharmacy).stockSummary
    });

    if (stockState && (stockState.nearExpiry || stockState.expired)) {
      io?.to(`pharmacy:${pharmacy.id}`).emit('stock:alert', {
        pharmacyId: pharmacy.id,
        message: stockState.expired
          ? `${stockState.name} has expired`
          : `${stockState.name} is near expiry in ${stockState.daysToExpiry} day${stockState.daysToExpiry === 1 ? '' : 's'}`
      });
      // notify admins as well
      io?.to('admin:global').emit('stock:alert', {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        message: stockState.expired
          ? `${stockState.name} has expired`
          : `${stockState.name} is near expiry in ${stockState.daysToExpiry} day${stockState.daysToExpiry === 1 ? '' : 's'}`,
        medicine: { id: stockState.id || null, name: stockState.name }
      });
    }

    res.status(existing ? 200 : 201).json(pharmacistStockView(pharmacy));
  } catch (error) {
    next(error);
  }
});

export default router;