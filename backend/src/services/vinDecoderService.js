const NHTSA_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues';

// VINs never contain I, O, or Q (to avoid confusion with 1, 0).
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;

function isValidVinFormat(vin) {
  return typeof vin === 'string' && VIN_PATTERN.test(vin);
}

function cleanField(value) {
  if (!value || value === 'Not Applicable' || value === 'Not Applicable ') return null;
  return value;
}

async function decodeVin(vin) {
  if (!isValidVinFormat(vin)) {
    const err = new Error('VIN must be 17 characters and contain only valid VIN characters (no I, O, Q)');
    err.status = 400;
    throw err;
  }

  let response;
  try {
    response = await fetch(`${NHTSA_URL}/${vin}?format=json`, {
      signal: AbortSignal.timeout(8000)
    });
  } catch (err) {
    const wrapped = new Error('VIN decoding service is unavailable, please enter vehicle details manually');
    wrapped.status = 503;
    throw wrapped;
  }

  if (!response.ok) {
    const err = new Error('VIN decoding service returned an error, please enter vehicle details manually');
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const result = data.Results && data.Results[0];

  if (!result) {
    const err = new Error('No data returned for this VIN, please enter vehicle details manually');
    err.status = 404;
    throw err;
  }

  const decoded = {
    year: cleanField(result.ModelYear),
    make: cleanField(result.Make),
    model: cleanField(result.Model),
    trim: cleanField(result.Trim),
    engine: cleanField(result.EngineModel) || cleanField(result.EngineConfiguration),
    transmission: cleanField(result.TransmissionStyle),
    drivetrain: cleanField(result.DriveType),
    bodyStyle: cleanField(result.BodyClass)
  };

  const hasAnyData = Object.values(decoded).some((v) => v !== null);
  if (!hasAnyData) {
    const err = new Error('VIN could not be decoded, please enter vehicle details manually');
    err.status = 404;
    throw err;
  }

  return decoded;
}

module.exports = { decodeVin, isValidVinFormat };
