const sharp = require('sharp')
const fs = require('fs')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

const possibleInputs = [
  'public/logo.jpg',
  'public/Logo_MecaLIK_Transparent.jpg',
  'public/logo.png',
  'public/mecalik-logo.png',
  'public/favicon.png',
]

let logoFile = null
for (const f of possibleInputs) {
  if (fs.existsSync(f)) { logoFile = f; break }
}

if (!logoFile) {
  console.error('No logo file found. Checked:', possibleInputs)
  process.exit(1)
}

console.log('Using logo:', logoFile)
fs.mkdirSync('public/icons', { recursive: true })

const promises = sizes.map(size =>
  sharp(logoFile)
    .resize(size, size, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`)
    .then(() => console.log(`✓ icon-${size}x${size}.png`))
    .catch(err => console.error(`✗ ${size}x${size}:`, err.message))
)

// Also generate apple-touch-icon at 180x180
promises.push(
  sharp(logoFile)
    .resize(180, 180, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .png()
    .toFile('public/apple-touch-icon.png')
    .then(() => console.log('✓ apple-touch-icon.png'))
    .catch(err => console.error('✗ apple-touch-icon.png:', err.message))
)

Promise.all(promises).then(() => console.log('\nAll icons generated.'))
