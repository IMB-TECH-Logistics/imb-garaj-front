import MoliyaPage from '@/pages/home/moliya'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/moliya/')({
  component: MoliyaPage,
})
