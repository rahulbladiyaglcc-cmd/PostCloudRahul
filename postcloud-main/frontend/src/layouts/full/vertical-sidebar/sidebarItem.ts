import { AddressBookIcon, CircleIcon, DashboardIcon } from 'vue-tabler-icons'

export interface menu {
  header?: string
  title?: string
  icon?: object
  to?: string
  divider?: boolean
  chip?: string
  chipColor?: string
  chipVariant?: string
  chipIcon?: string
  children?: menu[]
  disabled?: boolean
  type?: string
  subCaption?: string
}

const sidebarItem: menu[] = [
  { header: 'Dashboard' },
  {
    title: 'Home',
    icon: DashboardIcon,
    to: '/dashboard/default'
  },
  { divider: true },
  { header: 'Directory' },
  {
    title: 'Records',
    icon: AddressBookIcon,
    to: '/create/record',
    children: [
      {
        title: 'All Records',
        icon: CircleIcon,
        to: '/list/record'
      },
      {
        title: 'Upload Bulk PDF',
        icon: CircleIcon,
        to: '/list/record?action=upload'
      },
      {
        title: 'Create Record',
        icon: CircleIcon,
        to: '/create/record'
      }
    ]
  },
  // {
  //   title: 'Auth',
  //   icon: KeyIcon,
  //   to: '/auth',
  //   children: [
  //     {
  //       title: 'Login',
  //       icon: CircleIcon,
  //       to: '/auth/login'
  //     },
  //     {
  //       title: 'Register',
  //       icon: CircleIcon,
  //       to: '/auth/register'
  //     }
  //   ]
  // }
]

export default sidebarItem
