const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic']

export type UploadValidationResult =
  | { valid: true }
  | { valid: false; error: string }

export function validatePhotoFile(file: File): UploadValidationResult {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    // HEIC files sometimes come through with an empty MIME type on some
    // Android browsers — fall back to checking the file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, WebP, and HEIC photos are accepted.',
      }
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1)
    return {
      valid: false,
      error: `This photo is ${sizeMB} MB. Please use a photo under ${MAX_FILE_SIZE_MB} MB.`,
    }
  }

  return { valid: true }
}

export function validatePhotoFiles(files: File[]): UploadValidationResult {
  // Limit number of photos per listing
  if (files.length > 6) {
    return {
      valid: false,
      error: 'You can upload a maximum of 6 photos per listing.',
    }
  }

  for (const file of files) {
    const result = validatePhotoFile(file)
    if (!result.valid) return result
  }

  return { valid: true }
}