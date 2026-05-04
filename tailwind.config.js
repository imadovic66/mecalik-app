/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:       '#080808',
          bg2:      '#0F0F0F',
          bg3:      '#141414',
          bg4:      '#1A1A1A',
          bg5:      '#202020',
          cyan:     '#43BCC9',
          'cyan-d': '#2FA8B5',
          'cyan-dim': 'rgba(67,188,201,0.08)',
          gold:     '#F0C040',
          green:    '#00DD88',
          red:      '#FF3333',
          orange:   '#FF9900',
          border:   'rgba(255,255,255,0.06)',
          border2:  'rgba(255,255,255,0.11)',
          text:     'rgba(255,255,255,0.88)',
          muted:    'rgba(255,255,255,0.42)',
          white:    '#FFFFFF',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"Outfit"', 'sans-serif'],
      },
      borderRadius: {
        xl2: '20px',
        xl3: '28px',
      },
    },
  },
  plugins: [],
}
