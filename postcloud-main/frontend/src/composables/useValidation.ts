import { reactive } from 'vue'

export function useValidation() {
  const isEmpty = (value: unknown) => value === null || value === undefined || String(value).trim() === ''

  const validationRules = reactive({
    onlyNumbers: (value: string) => isEmpty(value) || /^\d*$/.test(value) || 'Only numbers are allowed.',
    // General
    required: (value: string) => !isEmpty(value) || 'This field is required.',
    minLength: (min: number) => (value: string) => {
      if (isEmpty(value)) return true
      return String(value).length >= min || `Minimum ${min} characters required.`
    },
    maxLength: (max: number) => (value: string) => {
      if (isEmpty(value)) return true
      return String(value).length <= max || `Maximum ${max} characters allowed.`
    },
    pattern: (regex: RegExp, message: string) => (value: string) => {
      if (isEmpty(value)) return true
      return regex.test(value) || message
    },

    // Email
    email: (value: string) => isEmpty(value) || /.+@.+\..+/.test(value) || 'E-mail must be valid.',

    // Mobile Number
    mobileNumber: (value: string) =>
      isEmpty(value) || /^\d{10}$/.test(value) || 'Mobile number must be 10 digits.',

    // Aadhaar Number
    aadhaarNumber: (value: string) =>
      isEmpty(value) || /^\d{12}$/.test(value) || 'Aadhaar number must be 12 digits.',

    // Date of Birth
    dateOfBirth: (value: string) => {
      if (isEmpty(value)) return true
      const today = new Date()
      const birthDate = new Date(value)
      return birthDate < today || 'Date of birth must be in the past.'
    },

    // Gender
    gender: (value: string) =>
      isEmpty(value) ||
      ['male', 'female', 'other'].includes(value) ||
      'Gender must be Male, Female, or Other.',

    // Policies
    policyNumber: (value: string) =>
      isEmpty(value) ||
      /^[A-Z0-9]{8,12}$/.test(value) ||
      'Policy number must be 8-12 alphanumeric characters.',

    // Dynamic rules for children or arrays
    childName: (value: string) => isEmpty(value) || true,
    childGender: (value: string) =>
      isEmpty(value) ||
      ['Male', 'Female', 'Other'].includes(value) ||
      'Child gender must be Male, Female, or Other.',
    childDateOfBirth: (value: string) => {
      if (isEmpty(value)) return true
      const today = new Date()
      const birthDate = new Date(value)
      return birthDate < today || "Child's date of birth must be in the past."
    }
  })

  return validationRules
}
