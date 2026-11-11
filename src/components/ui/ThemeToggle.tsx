/** Day / night controls for the customer account: round sun-moon button and a Jour / Nuit segment. */
import { Sun, Moon } from 'lucide-react'
import { useCustTheme } from '../../lib/custTheme'

export function ThemeButton() {
  const { mode, setMode } = useCustTheme()
  const dark = mode === 'dark'
  return (
    <button className="mkc-round" onClick={() => setMode(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Passer en mode jour' : 'Passer en mode nuit'}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export function ThemeSegment() {
  const { mode, setMode } = useCustTheme()
  return (
    <div className="mkc-seg">
      <button className={mode === 'light' ? 'is-on' : ''} onClick={() => setMode('light')}><Sun size={15} /> Jour</button>
      <button className={mode === 'dark' ? 'is-on' : ''} onClick={() => setMode('dark')}><Moon size={15} /> Nuit</button>
    </div>
  )
}
