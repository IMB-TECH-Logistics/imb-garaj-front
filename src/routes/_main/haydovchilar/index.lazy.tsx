import HaydovchilarList from '@/pages/home/haydovchilar'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/haydovchilar/')({
  component: HaydovchilarList,
})
