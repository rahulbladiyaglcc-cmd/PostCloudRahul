import axiosInstance from '@/axiosInstance.interceptor'
import { defineStore } from 'pinia'

const ocrBaseUrl = `${import.meta.env.VITE_API_URL}/extract/text`
export const useFileStore = defineStore('File', {
  state: () => ({
    fileUrl: ''
  }),
  actions: {
    async uploadFile(formData: FormData, uploadPath: string) {
      try {
        const response = await axiosInstance.post(uploadPath, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        this.fileUrl = response.data.url
      } catch (error) {
        this.fileUrl = ''
        console.error('Upload failed:', error)
        throw error
      } finally {
      }
    },
    async submitOcrFile(formData: FormData): Promise<string | null> {
      try {
        const response = await axiosInstance.post(ocrBaseUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data?.jobId ? String(response.data.jobId) : null
      } catch (error) {
        console.error('OCR submit failed:', error)
        return null
      }
    },
    async getOcrResult(jobId: string) {
      try {
        const response = await axiosInstance.get(`${ocrBaseUrl}/${jobId}`)
        return response.data?.result
      } catch (error) {
        console.error('OCR result fetch failed:', error)
        return null
      }
    }
  }
})
