const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || ''

export const useApi = () => {
  const request = async (method, url, data = null, config = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      ...config,
    }

    if (data) {
      // If data is FormData (for file uploads), don't set Content-Type manually
      if (data instanceof FormData) {
        delete options.headers['Content-Type']
        options.body = data
      } else {
        options.body = JSON.stringify(data)
      }
    }

    try {
      const response = await fetch(fullUrl, options)
      const responseData = await response.json()

      if (!response.ok) {
        // Throw a structured error object similar to Axios error shape
        throw {
          response: {
            status: response.status,
            data: responseData,
          },
          message: responseData.error || response.statusText,
        }
      }

      return responseData
    } catch (error) {
      // Re-throw a consistent error shape
      if (error.response) {
        throw error.response.data || error.message
      }
      throw error.message || 'Network error'
    }
  }

  const get = (url, config = {}) => request('GET', url, null, config)
  const post = (url, data, config = {}) => request('POST', url, data, config)

  return { get, post }
}
