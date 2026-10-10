import MoliyaPage from '@/pages/home/moliya'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

const MoliyaRoute = () => {
  const { t } = useTranslation()
  return (
    <>
      <h1 className="sr-only">{t('nav.finance')}</h1>
      <MoliyaPage />
    </>
  )
}

export const Route = createLazyFileRoute('/_main/moliya/')({
  component: MoliyaRoute,
})
