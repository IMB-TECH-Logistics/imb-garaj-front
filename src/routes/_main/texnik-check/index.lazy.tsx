import {TexnikCheck } from '@/pages/home/texnik-check'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/texnik-check/')({
  component:TexnikCheck
})
