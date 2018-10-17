const { spawn } = require('child_process')
const { watch, ensureFileSync } = require('fs-extra')

ensureFileSync('./build/main.js')
const isWin = process.platform.slice(0, 3) === 'win'

let server
watch('./build/main.js', () => {
  if (server) {
    server.kill('SIGINT')
  }
  server = spawn('node', ['./build/main.js'], { stdio: 'inherit' })
})

const compiler = spawn(isWin ? 'tsc.cmd' : 'tsc', [
  '--outDir',
  './build',
  '-p',
  './tsconfig.server.json',
  '--watch',
])

const application = spawn(
  isWin ? 'parcel.cmd' : 'parcel',
  ['./src/index.html', '-d', 'build/'],
  {
    stdio: 'inherit',
  },
)

process.on('SIGINT', () => {
  if (server) {
    server.kill('SIGINT')
  }
  compiler.kill('SIGINT')
  application.kill('SIGINT')
  process.exit()
})
