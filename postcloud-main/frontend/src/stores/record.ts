import axios from '@/axiosInstance.interceptor'
import type {
  PaginatedRecords,
  RecordDetail,
  RecordStatus,
  StepFive,
  StepFour,
  StepOne,
  StepSix,
  StepThree,
  StepTwo
} from '@/interfaces/record.interface'
import { defineStore } from 'pinia'
import votersDatabase from '@/voters_database.json'
import { matchesSearch } from '@/utils/searchHelper'
import { getStoredVoters } from '@/utils/voterStorage'

const baseUrl = `${import.meta.env.VITE_API_URL}/records`


interface FetchRecordsOptions {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  status?: RecordStatus | 'ALL'
  wardPart?: string
}


export const useRecordStore = defineStore('Record', {
  state: () => ({
    records: {} as PaginatedRecords,
    record: {} as RecordDetail,
    stepByRecordId: {} as Record<string, number>
  }),
  actions: {
    setCurrentStep(recordId: string, step: number) {
      this.stepByRecordId[recordId] = step
    },
    getCurrentStep(recordId: string) {
      return this.stepByRecordId[recordId]
    },
    async createPersonalData(formData: StepOne, status: RecordStatus): Promise<{ id: number }> {
      try {
        const payload = {
          id: formData.id || undefined,
          profileImage: formData.profileImage || undefined,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          email: formData.email || undefined,
          gender: formData.gender || undefined,
          houseName: formData.houseName || undefined,
          houseNumber: formData.houseNumber || undefined,
          streetName: formData.streetName || undefined,
          streetNumber: formData.streetNumber || undefined,
          postOffice: formData.postOffice || undefined,
          village: formData.village || undefined,
          panchayat: formData.panchayat || undefined,
          district: formData.district || undefined,
          mobileNumber: formData.mobileNumber || undefined,
          whatsappNumber: formData.whatsappNumber || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          status
        }
        const response = await axios.post(`${baseUrl}/step/one`, payload, {
          headers: { 'Content-Type': 'application/json' }
        })
        // this.addRecord(formData)
        return response.data
      } catch (err) {
        console.error('Error creating record:', err)
        throw err
      }
    },
    async createIdentificationData(formData: StepTwo, id: string, status: RecordStatus) {
      try {
        const payload = {
          aadhaarNumber: formData.aadhaarNumber || undefined,
          drivingLicense: formData.drivingLicense || undefined,
          electionID: formData.electionID || undefined,
          passportNumber: formData.passportNumber || undefined,
          postBoxNumber: formData.postBoxNumber || undefined,
          status
        }
        const response = await axios.post(`${baseUrl}/step/two/${id}`, payload, {
          headers: { 'Content-Type': 'application/json' }
        })
        return response.data
      } catch (err) {
        console.error('Error creating record:', err)
        throw err
      }
    },
    async createOccupationData(formData: StepThree, id: string, status: RecordStatus) {
      try {
        const payload = {
          redirectionAddress: formData.redirectionAddress,
          isAbroad: formData.isAbroad,
          redirectedHouseName: formData.redirectedHouseName || undefined,
          redirectedHouseNumber: formData.redirectedHouseNumber || undefined,
          job: formData.job || undefined,
          retirementDate: formData.retirementDate || undefined,
          isRedirected: formData.isRedirected,
          addresses: (formData.addresses || []).map((address) => ({
            id: address.id || undefined,
            houseName: address.houseName || undefined,
            houseNumber: address.houseNumber || undefined,
            streetName: address.streetName || undefined,
            streetNumber: address.streetNumber || undefined,
            village: address.village || undefined,
            postOffice: address.postOffice || undefined,
            locationType: address.locationType || undefined
          })),
          status
        }
        const response = await axios.post(`${baseUrl}/step/three/${id}`, payload, {
          headers: { 'Content-Type': 'application/json' }
        })
        return response.data
      } catch (err) {
        console.error('Error creating record:', err)
        throw err
      }
    },
    async createFamilyData(formData: StepFour, id: string, status: RecordStatus) {
      try {
        const payload = {
          marriageDate: formData.marriageDate || undefined,
          previousAddress: formData.previousAddress || undefined,
          children: (formData.children || []).map((child) => ({
            id: child.id || undefined,
            name: child.name || undefined,
            dateOfBirth: child.dateOfBirth || undefined,
            gender: child.gender || undefined
          })),
          status
        }
        const response = await axios.post(`${baseUrl}/step/four/${id}`, payload, {
          headers: { 'Content-Type': 'application/json' }
        })
        return response.data
      } catch (err) {
        console.error('Error creating record:', err)
        throw err
      }
    },
    async createPolicyData({ policies }: StepFive, id: string, status: RecordStatus) {
      try {
        const response = await axios.post(
          `${baseUrl}/step/five/${id}`,
          {
            status,
            policies: (policies || []).map((policy) => ({
              type: policy.type || undefined,
              number: policy.number || undefined
            }))
          },
          {
          headers: { 'Content-Type': 'application/json' }
          }
        )
        return response.data
      } catch (err) {
        console.error('Error creating record:', err)
        throw err
      }
    },
    async createDocumentsData({ documents }: StepSix, id: string, status: RecordStatus) {
      try {
        const response = await axios.post(
          `${baseUrl}/step/six/${id}`,
          {
            status,
            documents: (documents || []).map((document) => ({
              name: document.name || undefined,
              file: document.file || undefined
            }))
          },
          {
          headers: { 'Content-Type': 'application/json' }
          }
        )
        return response.data
      } catch (err) {
        console.error('Error creating record:', err)
        throw err
      }
    },
    async fetchAllRecords({
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'DESC',
      status,
      wardPart
    }: FetchRecordsOptions = {}) {
      let list: any[] = getStoredVoters()

      if (wardPart && wardPart !== 'ALL') {
        const partMatch = wardPart.match(/91_(\d+)/) || wardPart.match(/_(\d+)/)
        const partNum = partMatch ? partMatch[1] : wardPart
        list = list.filter((r) =>
          String(r.partNumber) === String(partNum) ||
          String(r.wardPart || '').includes(`भाग ${partNum}`) ||
          String(r.wardPart || '') === wardPart
        )
      }

      if (status && status !== 'ALL') {
        list = list.filter((r) => r.status === status)
      }

      if (search && search.trim()) {
        list = list.filter((r) => matchesSearch(r, search.trim()))
      }

      const total = list.length
      const start = (page - 1) * limit
      const paged = list.slice(start, start + limit)
      const result = {
        data: paged as any,
        total
      }
      this.records = result as any
      return result
    },

    async fetchRecordById(id: string) {
      try {
        const response = await axios.get(`${baseUrl}/${id}`)
        if (response?.data && response.data.id) {
          this.record = response.data
          return response.data
        }
      } catch (err) {
        console.warn('Backend unavailable, fetching from stored voters:', err)
      }

      const list = getStoredVoters()
      const found = list.find((r) => String(r.id) === String(id)) || list[0]
      if (found) {
        this.record = found
        return found
      }
      throw new Error('Record not found')
    },
    async remove(id: string) {
      try {
        const response = await axios.delete(`${baseUrl}/${id}`, {
          headers: { 'Content-Type': 'application/json' }
        })
        return response.data
      } catch (err) {
        console.error('Error creating record:', err)
        throw err
      }
    },
    async reopen(id: string) {
      try {
        const response = await axios.post(`${baseUrl}/reopen/${id}`, '{}', {
          headers: { 'Content-Type': 'application/json' }
        })
        return response.data
      } catch (err) {
        console.error('Error reopening record:', err)
        throw err
      }
    },
    async retryDocumentSearchIndex(
      recordId: string,
      documentIds: Array<string | number>
    ) {
      try {
        const response = await axios.post(
          `${baseUrl}/${recordId}/documents/search-index/retry`,
          { documentIds },
          {
            headers: { 'Content-Type': 'application/json' }
          }
        )
        return response.data
      } catch (err) {
        console.error('Error retrying document search indexing:', err)
        throw err
      }
    },
    addRecord(newRecord: StepOne) {
      this.records.data = [...this.records.data, newRecord] // ✅ Replacing state reactively
    }
  }
})
