import client from './client';

export function decodeVin(vin) {
  return client.get(`/vin/${vin}`).then((res) => res.data.data);
}

export function listMyVehicles() {
  return client.get('/vehicles/mine').then((res) => res.data.data);
}

export function createVehicle(payload) {
  return client.post('/vehicles', payload).then((res) => res.data.data);
}

export function updateVehicle(id, payload) {
  return client.put(`/vehicles/${id}`, payload).then((res) => res.data.data);
}

export function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  return client
    .post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data.data.url);
}

export function listPublicVehicles(tenantSlug, filters) {
  return client.get(`/vehicles/public/${tenantSlug}`, { params: filters }).then((res) => res.data.data);
}
