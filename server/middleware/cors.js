export default defineEventHandler((event) => {
  const origin = getRequestHeader(event, 'origin')
  const requestOrigin = origin || getRequestURL(event).origin

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': requestOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  })

  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
