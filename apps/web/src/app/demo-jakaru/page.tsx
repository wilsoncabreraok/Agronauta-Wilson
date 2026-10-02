import type { Metadata } from 'next'
import DemoJakaruPage from '@/components/jakaru/demo-jakaru-page'

export const metadata: Metadata = {
  title: 'Demo Jakaru Porá | Agronautas',
  description: 'Demostración con datos simulados para explorar el seguimiento de huertas de Jakaru Porá.',
}

export default function DemoJakaruRoute() {
  return <DemoJakaruPage />
}
