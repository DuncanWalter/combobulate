const { spawn } = require('child_process')
const { watch } = require('fs')

let server
watch('./build/main.js', () => {
  if (server) {
    server.kill('SIGINT')
  }
  server = spawn('node', ['./build/main.js'], { stdio: 'inherit' })
})

const compiler = spawn('tsc', [
  '--outDir',
  './build',
  '-p',
  './tsconfig.server.json',
  '--watch',
])

const application = spawn('parcel', ['./src/index.html', '-d', 'build/'], {
  stdio: 'inherit',
})

process.on('SIGINT', () => {
  if (server) {
    server.kill('SIGINT')
  }
  compiler.kill('SIGINT')
  application.kill('SIGINT')
  process.exit()
})
