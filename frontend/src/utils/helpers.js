export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const truncateText = (text, max = 100) => {
  return text?.length > max ? text.slice(0, max) + '...' : text
}