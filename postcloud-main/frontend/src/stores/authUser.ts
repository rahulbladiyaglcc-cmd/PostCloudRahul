import { fetchWrapper } from '@/utils/helpers/fetch-wrapper'
import { defineStore } from 'pinia'

const baseUrl = `${import.meta.env.VITE_API_URL}/users`

export const useUsersStore = defineStore('Authuser', {
  state: () => ({
    users: {}
  }),
  actions: {
    async getAll() {
      this.users = { loading: true }
      fetchWrapper
        .get(baseUrl)
        .then((users) => (this.users = users))
        .catch((error) => (this.users = { error }))
    }
  }
})
