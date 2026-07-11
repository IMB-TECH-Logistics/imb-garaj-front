import { TexnikCheck } from '@/pages/home/texnik-check'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/_managers/technic-check/')({
  component: TexnikCheck,
})
