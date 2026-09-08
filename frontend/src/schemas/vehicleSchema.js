import { z } from 'zod';

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;
const currentYear = new Date().getFullYear();

// Empty string inputs from number fields must fail "required" validation
// instead of silently coercing to 0 (z.coerce.number('') === 0).
const requiredNumber = (message) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number({ invalid_type_error: message, required_error: message })
  );

export const vehicleSchema = z.object({
  vin: z.string().regex(VIN_PATTERN, 'VIN must be exactly 17 valid characters (no I, O, Q)'),
  year: requiredNumber('Year is required')
    .pipe(z.number().int('Year must be a whole number').min(1900, 'Year must be 1900 or later').max(currentYear + 1, `Year cannot be later than ${currentYear + 1}`)),
  make: z.string().trim().min(1, 'Make is required'),
  model: z.string().trim().min(1, 'Model is required'),
  trim: z.string().trim().optional().or(z.literal('')),
  engine: z.string().trim().optional().or(z.literal('')),
  transmission: z.string().trim().optional().or(z.literal('')),
  drivetrain: z.string().trim().optional().or(z.literal('')),
  bodyStyle: z.string().trim().optional().or(z.literal('')),
  price: requiredNumber('Price is required')
    .pipe(z.number().finite('Price must be a valid number').nonnegative('Price cannot be negative')),
  mileage: requiredNumber('Mileage is required')
    .pipe(z.number().int('Mileage must be a whole number').nonnegative('Mileage cannot be negative')),
  stockNumber: z.string().trim().min(1, 'Stock number is required'),
  description: z.string().trim().optional().or(z.literal(''))
});
