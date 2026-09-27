import Kassa from '@/pages/home/kassa'
import VstKassa from '@/pages/home/kassa/vst'
import { useUser } from '@/constants/useUser'
import { createLazyFileRoute } from '@tanstack/react-router'

const KassaPage = () => {
  const { data } = useUser()
  if (!data) return null
  return data.kassa_mode === 'driver_cash' ? <VstKassa /> : <Kassa />
}

export const Route = createLazyFileRoute('/_main/kassa/')({
  component: KassaPage,
})
