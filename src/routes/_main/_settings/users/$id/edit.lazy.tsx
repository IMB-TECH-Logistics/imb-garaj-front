import { createLazyFileRoute } from '@tanstack/react-router'
import UserFormPage from '@/pages/home/settings/users/user-form-page'

export const Route = createLazyFileRoute('/_main/_settings/users/$id/edit')({
    component: UserFormPage,
})
