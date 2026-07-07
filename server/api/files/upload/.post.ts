import { defineEventHandler } from 'h3'
import { api } from '../../utils/api'
import multer from 'multer'
import FormData from 'form-data'

const storage = multer.memoryStorage()
const upload = multer({ storage })

export default defineEventHandler(async (event) => {
  return new Promise((resolve, reject) => {
    upload.array('files')(event.node.req, event.node.res, async (err) => {
      if (err) return reject(err)

      try {
        const files = event.node.req.files
        const body = event.node.req.body
        const PATH = body.path

        // Prepare FormData to forward
        const formData = new FormData()
        files.forEach(file => {
          formData.append('files', file.buffer, file.originalname)
        })
        formData.append('path', PATH)

        // Forward to backend
        const res = await api.post('/api/files/upload', formData, {
          headers: {
            ...formData.getHeaders()
          }
        })

        resolve(res.data)
      } catch (error) {
        console.error('Forward upload failed:', error)
        reject(error)
      }
    })
  })
})
