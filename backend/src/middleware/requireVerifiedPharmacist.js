export function requireVerifiedPharmacist(req, res, next) {
  // If user is not pharmacist, allow (other role checks handle role restrictions).
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (req.user.role !== 'pharmacist') return next();

  // For pharmacists, require isVerified true
  if (req.user.isVerified) return next();

  return res.status(403).json({ message: 'Pharmacist account is not verified' });
}

export default requireVerifiedPharmacist;
