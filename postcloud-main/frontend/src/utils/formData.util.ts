export function createFormData(data: Record<string, any>): FormData {
  const formData = new FormData()

  Object.keys(data).forEach((key) => {
    const value = data[key]
    if (value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })

  return formData
}
