const supabase = require('../config/supabase');

const BUCKET = 'vehicle-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

async function uploadImage(file, tenantId) {
  const ext = EXTENSION_BY_MIME[file.mimetype];
  if (!ext) {
    const err = new Error('Only JPEG, PNG, or WEBP images are allowed');
    err.status = 400;
    throw err;
  }
  if (file.size > MAX_SIZE_BYTES) {
    const err = new Error('Image must be smaller than 5MB');
    err.status = 400;
    throw err;
  }

  // Extension derived from validated mimetype, never from user-supplied originalname.
  const path = `${tenantId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype
  });

  if (error) {
    const err = new Error('Image upload failed');
    err.status = 502;
    throw err;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { uploadImage };
