import { app } from './logger/logger'
import { config } from './config'

app.listen(config.loggerPort)
console.log(`> Logger listening on port ${config.loggerPort}`)
