const DAY_MS = 24 * 60 * 60 * 1000;

export function computeMedicineStockState(medicine) {
  const base = typeof medicine?.toObject === 'function' ? medicine.toObject() : medicine;
  const stockCount = typeof medicine?.stockCount === 'number'
    ? medicine.stockCount
    : typeof medicine?.stock === 'number'
      ? medicine.stock
      : 0;
  const lowStockThreshold = typeof medicine?.lowStockThreshold === 'number' ? medicine.lowStockThreshold : null;
  const nearExpiryThresholdDays = typeof medicine?.nearExpiryThresholdDays === 'number' ? medicine.nearExpiryThresholdDays : null;
  const available = typeof medicine?.available === 'boolean' ? medicine.available : stockCount > 0;
  const expiryDate = medicine?.expiryDate ? new Date(medicine.expiryDate) : null;
  const now = Date.now();
  const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now) / DAY_MS) : null;
  const expired = expiryDate ? expiryDate.getTime() < now : false;
  const nearExpiry = typeof daysToExpiry === 'number' && nearExpiryThresholdDays !== null ? daysToExpiry <= nearExpiryThresholdDays : false;
  const lowStock = lowStockThreshold !== null ? stockCount <= lowStockThreshold : false;

  let status = 'in-stock';
  if (!available || stockCount <= 0) {
    status = 'out-of-stock';
  } else if (expired) {
    status = 'expired';
  } else if (nearExpiry) {
    status = 'near-expiry';
  } else if (lowStock) {
    status = 'low-stock';
  }

  return {
    ...base,
    medicineKey: base._id ? String(base._id) : `${String(base.name || '').trim().toLowerCase()}::${String(base.brand || '').trim().toLowerCase()}`,
    stockCount,
    lowStockThreshold,
    nearExpiryThresholdDays,
    available,
    expiryDate: expiryDate ? expiryDate.toISOString() : null,
    daysToExpiry,
    status,
    expired,
    nearExpiry,
    lowStock
  };
}

export function summarizeStock(medicines = []) {
  return medicines.reduce(
    (summary, medicine) => {
      const stockState = computeMedicineStockState(medicine);
      summary.totalMedicines += 1;
      summary.totalUnits += stockState.stockCount;
      if (stockState.status === 'out-of-stock') summary.outOfStock += 1;
      if (stockState.lowStock) summary.lowStock += 1;
      if (stockState.nearExpiry) summary.nearExpiry += 1;
      return summary;
    },
    {
      totalMedicines: 0,
      totalUnits: 0,
      outOfStock: 0,
      lowStock: 0,
      nearExpiry: 0
    }
  );
}

export function publicMedicinePreview(medicine) {
  const state = computeMedicineStockState(medicine);
  return {
    name: state.name,
    brand: state.brand,
    available: state.available
  };
}

export function publicPharmacyView(pharmacy) {
  const medicines = Array.isArray(pharmacy.medicines) ? pharmacy.medicines : [];
  return {
    ...(typeof pharmacy?.toObject === 'function' ? pharmacy.toObject() : pharmacy),
    medicines: medicines.map(publicMedicinePreview),
    medicinePreview: medicines.map(publicMedicinePreview),
    stockSummary: summarizeStock(medicines)
  };
}

export function pharmacistStockView(pharmacy) {
  const medicines = Array.isArray(pharmacy.medicines) ? pharmacy.medicines : [];
  const stockItems = medicines.map(computeMedicineStockState);
  const alerts = stockItems.flatMap((item) => {
    const messages = [];
    if (item.expired) messages.push(`${item.name} has expired`);
    else if (item.nearExpiry) messages.push(`${item.name} expires in ${item.daysToExpiry} day${item.daysToExpiry === 1 ? '' : 's'}`);
    if (item.lowStock) messages.push(`${item.name} is low on stock (${item.stockCount})`);
    if (!item.available) messages.push(`${item.name} is marked unavailable`);
    return messages;
  });

  return {
    ...(typeof pharmacy?.toObject === 'function' ? pharmacy.toObject() : pharmacy),
    medicines: stockItems,
    stockSummary: summarizeStock(medicines),
    alerts
  };
}
