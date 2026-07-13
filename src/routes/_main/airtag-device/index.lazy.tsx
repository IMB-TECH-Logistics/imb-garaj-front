import AirtagDevice from '@/pages/home/airtag-device'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/airtag-device/')({
    component: AirtagDevice
})
