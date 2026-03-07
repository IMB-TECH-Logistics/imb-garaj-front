import Kassa from '@/pages/home/kassa'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/kassa/')({
  component:Kassa,
})
