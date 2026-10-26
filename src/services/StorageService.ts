import ApiService from './ApiService'

/**
 * Upload an image file to DigitalOcean Spaces via backend
 */
export const uploadImageToStorage = async (file: File, folder = 'photos'): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('folder', folder)
  const res = await ApiService.post('storage/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data?.data?.url
}

/**
 * Upload an export file (PDF, Excel, CSV) to DigitalOcean Spaces via backend
 */
export const uploadExportToStorage = async (
  file: File | Blob,
  folder = 'general',
  fileName?: string
): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file, fileName)
  formData.append('folder', folder)
  if (fileName) formData.append('file_name', fileName)
  const res = await ApiService.post('storage/upload-export', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data?.data?.url
}
