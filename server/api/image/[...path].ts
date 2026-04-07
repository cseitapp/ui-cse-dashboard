export default defineEventHandler(async (event) => {
  const { path } = getRouterParams(event) // path is an array of segments
  const config = useRuntimeConfig()
  const backendUrl = config.VITE_URL_PATH_TICKET
  
  const imageUrl = `${backendUrl}/${path}`

  try {
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw createError({ statusCode: response.status, statusMessage: 'Image not found' })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    setHeader(event, 'Content-Type', contentType)

    return buffer
  } catch (err) {
    console.error('Image proxy error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch image' })
  }
})
