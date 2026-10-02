import type { Metadata } from 'next'
import JakaruPage from '@/components/jakaru/jakaru-page'

export const metadata: Metadata = {
  title: 'Jakaru Porá | Agronautas',
  description: 'Propuesta de Agronautas para acompañar la evolución de cada huerta de Jakaru Porá.',
}

export default function JakaruRoute() {
  return <JakaruPage />
}
