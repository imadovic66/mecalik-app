import { useParams, useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import Garage from '../components/garage/Garage'

/** Private garage link for customers without an account: /garage/:token */
export default function GaragePage() {
  const { token } = useParams<{ token: string }>()
  return (
    <>
      <SEO title="Mon garage — MecaLIK" description="Vos véhicules, papiers, entretien et dépenses." path="/garage" noindex />
      <Garage token={token ?? null} />
    </>
  )
}

/** Logged-in customer: /dashboard/voitures */
export function MyGarage() {
  const navigate = useNavigate()
  return (
    <>
      <SEO title="Mon garage — MecaLIK" description="Vos véhicules, papiers, entretien et dépenses." path="/dashboard/voitures" noindex />
      <Garage token={null} onBack={() => navigate('/dashboard')} />
    </>
  )
}
