import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { decodeVin, createVehicle, updateVehicle, uploadImage } from '../../api/vehicles';
import { vehicleSchema } from '../../schemas/vehicleSchema';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import Label from '../../components/ui/Label';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';

const specFields = [
  { key: 'year', label: 'Year', type: 'number', required: true },
  { key: 'make', label: 'Make', required: true },
  { key: 'model', label: 'Model', required: true },
  { key: 'trim', label: 'Trim' },
  { key: 'engine', label: 'Engine' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'drivetrain', label: 'Drivetrain' },
  { key: 'bodyStyle', label: 'Body Style' }
];

const inventoryFields = [
  { key: 'price', label: 'Price ($)', type: 'number', step: '0.01', required: true },
  { key: 'mileage', label: 'Mileage (mi)', type: 'number', required: true },
  { key: 'stockNumber', label: 'Stock Number', required: true }
];

function toDefaultValues(vehicle) {
  if (!vehicle) {
    return {
      vin: '', year: '', make: '', model: '', trim: '', engine: '', transmission: '',
      drivetrain: '', bodyStyle: '', price: '', mileage: '', stockNumber: '', description: ''
    };
  }
  return {
    vin: vehicle.vin || '',
    year: vehicle.year ?? '',
    make: vehicle.make || '',
    model: vehicle.model || '',
    trim: vehicle.trim || '',
    engine: vehicle.engine || '',
    transmission: vehicle.transmission || '',
    drivetrain: vehicle.drivetrain || '',
    bodyStyle: vehicle.body_style || '',
    price: vehicle.price ?? '',
    mileage: vehicle.mileage ?? '',
    stockNumber: vehicle.stock_number || '',
    description: vehicle.description || ''
  };
}

export default function VehicleForm({ onSaved, vehicle }) {
  const isEditing = Boolean(vehicle);
  const [images, setImages] = useState(() => (isEditing ? (vehicle.images || []).map((img) => img.url) : []));
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState('');
  const [vinSuccess, setVinSuccess] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    mode: 'onBlur',
    defaultValues: toDefaultValues(vehicle)
  });

  async function handleVinLookup() {
    setVinError('');
    setVinSuccess(false);
    const vin = getValues('vin');
    if (!vin || vin.length !== 17) {
      setVinError('Enter a 17-character VIN before decoding');
      return;
    }
    setVinLoading(true);
    try {
      const decoded = await decodeVin(vin);
      const setIfPresent = (field, value) => {
        if (value) setValue(field, value, { shouldValidate: true });
      };
      setIfPresent('year', decoded.year);
      setIfPresent('make', decoded.make);
      setIfPresent('model', decoded.model);
      setIfPresent('trim', decoded.trim);
      setIfPresent('engine', decoded.engine);
      setIfPresent('transmission', decoded.transmission);
      setIfPresent('drivetrain', decoded.drivetrain);
      setIfPresent('bodyStyle', decoded.bodyStyle);
      setVinSuccess(true);
    } catch (err) {
      setVinError(err.response?.data?.message || 'VIN lookup failed, please enter details manually');
    } finally {
      setVinLoading(false);
    }
  }

  async function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0, 2 - images.length);
    if (files.length === 0) return;

    setImageError('');
    setImageUploading(true);
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        setImages((prev) => [...prev, url].slice(0, 2));
      } catch (err) {
        setImageError(err.response?.data?.message || 'Image upload failed');
      }
    }
    setImageUploading(false);
    e.target.value = '';
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values) {
    setSaveError('');
    setSaved(false);
    try {
      if (isEditing) {
        await updateVehicle(vehicle.id, values);
      } else {
        await createVehicle({ ...values, imageUrls: images });
        reset(toDefaultValues(null));
        setImages([]);
      }
      setSaved(true);
      if (onSaved) onSaved();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save vehicle');
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold">{isEditing ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0">
            <Label htmlFor="vin">VIN</Label>
            <div className="flex gap-2">
              <Input
                id="vin"
                maxLength={17}
                placeholder="17-character VIN"
                readOnly={isEditing}
                aria-invalid={!!errors.vin}
                className={`flex-1 uppercase ${isEditing ? 'bg-muted cursor-not-allowed' : ''}`}
                {...register('vin', {
                  onChange: (e) => { e.target.value = e.target.value.toUpperCase(); }
                })}
              />
              {!isEditing && (
                <Button type="button" variant="secondary" onClick={handleVinLookup} disabled={vinLoading}>
                  {vinLoading ? 'Decoding...' : 'Decode VIN'}
                </Button>
              )}
            </div>
            {errors.vin && <p className="text-xs text-destructive">{errors.vin.message}</p>}
            {isEditing && <p className="text-xs text-muted-foreground">VIN can't be changed after the vehicle is created.</p>}
            {vinError && <p className="text-xs text-destructive">{vinError}</p>}
            {vinSuccess && !vinError && (
              <p className="text-xs text-green-700">Decoded - check the fields below and adjust anything that's off.</p>
            )}
          </fieldset>

          <hr className="border-border" />

          <fieldset className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-0 p-0 m-0">
            <legend className="col-span-full text-sm font-semibold mb-1">Specifications</legend>
            {specFields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <Label htmlFor={f.key}>
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>
                <Input id={f.key} type={f.type || 'text'} aria-invalid={!!errors[f.key]} {...register(f.key)} />
                {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key].message}</p>}
              </div>
            ))}
          </fieldset>

          <hr className="border-border" />

          <fieldset className="flex flex-col gap-4 border-0 p-0 m-0">
            <legend className="text-sm font-semibold mb-1">Pricing &amp; Inventory</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {inventoryFields.map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={f.key}>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input id={f.key} type={f.type || 'text'} step={f.step} min={0} aria-invalid={!!errors[f.key]} {...register(f.key)} />
                  {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key].message}</p>}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} placeholder="Condition, features, service history, etc." {...register('description')} />
            </div>
          </fieldset>

          <hr className="border-border" />

          <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
            <legend className="text-sm font-semibold mb-1">Photos</legend>
            {!isEditing && (
              <label
                htmlFor="vehicle-images"
                className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border px-4 py-6 text-center transition-colors ${
                  images.length >= 2 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/40 hover:bg-muted'
                }`}
              >
                <span className="text-sm font-medium">
                  {imageUploading ? 'Uploading...' : 'Click to upload photos (1-2 required)'}
                </span>
                <span className="text-xs text-muted-foreground">JPEG, PNG, or WEBP, up to 5MB each</span>
                <input
                  id="vehicle-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={images.length >= 2 || imageUploading}
                  className="hidden"
                />
              </label>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">Photos are set when the vehicle is added and can't be changed here.</p>
            )}

            {images.length > 0 && (
              <div className="flex gap-3 mt-1">
                {images.map((url, i) => (
                  <div key={url} className="relative">
                    <img src={url} alt={`Vehicle photo ${i + 1}`} className="w-28 h-20 object-cover rounded-md border border-border" />
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label="Remove photo"
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center shadow"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {imageError && <p className="text-xs text-destructive">{imageError}</p>}
          </fieldset>

          {saveError && (
            <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {saveError}
            </div>
          )}
          {saved && (
            <div role="status" className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              {isEditing ? 'Vehicle updated.' : 'Vehicle saved.'}
            </div>
          )}

          <div>
            <Button type="submit" disabled={isSubmitting || (!isEditing && images.length === 0)}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Vehicle' : 'Save Vehicle'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
