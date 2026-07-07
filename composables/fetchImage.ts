// composables/fetchImageAPI.js
import axios from 'axios'

export async function fetchImage(path) {
  try {
    const res = await axios.get(`/api/upload`, {
        params: {path:path}
    })
    // Assuming backend returns an array of image URLs
    return res.data.DATA || []
  } catch (error) {
    console.error('Failed to fetch images for ticket', path, error)
    return []
  }
}
