/** Day / night mode for the customer account (night by default). Saved on the device; every page using
 *  the hook updates together. The attribute is set on each page's wrapper, so the public site is untouched. */
import { useEffect, useState } from 'react'

export type Mode = 'dark' | 'light'
const KEY = 'mk-theme'
const read = (): Mode => { try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark' } catch { return 'dark' } }

export function useCustTheme() {
  const [mode, setM] = useState<Mode>(read)
  useEffect(() => {
    const on = () => setM(read())
    window.addEventListener('mk-theme', on)
    return () => window.removeEventListener('mk-theme', on)
  }, [])
  // iPhone / Android browser bar colour follows the mode while on the account pages
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    const prev = meta?.getAttribute('content') ?? null
    meta?.setAttribute('content', mode === 'light' ? '#FFFFFF' : '#000000')
    return () => { if (meta && prev) meta.setAttribute('content', prev) }
  }, [mode])
  const setMode = (m: Mode) => {
    try { localStorage.setItem(KEY, m) } catch { /* private mode: keep for this page only */ }
    setM(m)
    window.dispatchEvent(new Event('mk-theme'))
  }
  return { mode, setMode }
}
