import * as fs from 'fs-extra'
import * as Koa from 'koa'
import * as route from 'koa-route'
import * as path from 'path'
import {
  DELETELogResponse,
  ErrorResponse,
  GETLogResponse,
  GETLogsResponse,
  POSTLogResponse,
  LogData,
  LogHeader,
  LogRequest,
  LogUpdate,
} from './types'
import { unwrapStream } from '../utils/streamUtils'
import { config } from '../config'

export const app = new Koa()

function retrieveHeader(log: LogHeader) {
  return {
    sessionName: log.sessionName,
    agentType: log.agentType,
    simplified: log.simplified,
    epochsTrained: log.epochsTrained,
    lastUpdate: log.lastUpdate,
  } as LogHeader
}

function sanitizeSessionName(sessionName: string) {
  return sessionName
    .split('')
    .filter(ch => ch.match(validFileNameChars))
    .join('')
}

function updateValid(newLog: LogData, update: LogUpdate, session: string) {
  return (
    newLog.agentType == update.agentType &&
    newLog.simplified == update.simplified &&
    newLog.sessionName == session
  )
}

const validFileNameChars = /[a-zA-Z0-9\_]/

async function listLogs() {
  await fs.ensureDir('.logs')
  const logPromises = (await fs.readdir('.logs'))
    .filter(file => file.slice(-5) === '.json')
    .map(async file =>
      retrieveHeader((await fs.readJson(path.join('.logs', file))) as LogData),
    )

  return Promise.all(logPromises)
    .then(results => JSON.stringify({ logs: results } as GETLogsResponse))
    .catch(e => {
      throw e
    })
}

async function grabLog(session: string) {
  await fs.ensureDir('.logs')
  const fileName = sanitizeSessionName(session)
  return JSON.stringify((await fs.readJson(
    path.join('.logs/', `${fileName}.json`),
  )) as GETLogResponse)
}

async function updateLog(session: string, update: LogUpdate) {
  await fs.ensureDir('.logs')
  const fileName = sanitizeSessionName(session)
  const filePath = `${fileName}.json`
  const existingFilePaths = await fs.readdir('.logs/')
  let newLog: LogData
  const doUpdate = existingFilePaths.includes(filePath)
  const currentTime = Date.now()
  if (doUpdate) {
    const logContent: LogData = await fs.readJson(path.join('.logs', filePath))
    try {
      newLog = {
        ...logContent,
        epochsTrained:
          logContent.epochsTrained + update.additionalEpochsTrained,
        serializedContent: update.serializedContent,
        lastUpdate: currentTime,
      }
    } catch {
      throw new Error(`Log file ${fileName}.json is malformed`)
    }
    if (!updateValid(newLog, update, session)) {
      throw new Error(`Log file ${fileName}.json did not match request`)
    }
  } else {
    newLog = {
      agentType: update.agentType,
      simplified: update.simplified,
      sessionName: session,
      epochsTrained: update.additionalEpochsTrained,
      creationTime: currentTime,
      lastUpdate: currentTime,
      serializedContent: update.serializedContent,
    }
  }
  return fs.writeJSON(path.join('.logs', filePath), newLog).then(() =>
    JSON.stringify({
      message: doUpdate
        ? `Successfully updated ${session}`
        : `Successfully created ${session}`,
    } as POSTLogResponse),
  )
}

async function deleteLog(session: string) {
  await fs.ensureDir('.logs')
  const fileName = sanitizeSessionName(session)
  return fs.remove(path.join('.logs/', `${fileName}.json`)).then(() =>
    JSON.stringify({
      message: `Successfully deleted file ${session}`,
    } as DELETELogResponse),
  )
}

async function processRequest<Rest extends any[]>(
  ctx: Koa.Context,
  requestFunction: (ctx: Koa.Context, ...rest: Rest) => Promise<void>,
  ...rest: Rest
) {
  ctx.type = 'text/json'
  try {
    await requestFunction(ctx, ...rest)
  } catch (err) {
    ctx.response.body = JSON.stringify({
      error: 'Malformed request! Unable to process',
    } as ErrorResponse)
    ctx.response.status = 400
    console.error(err)
  }
  return ctx
}

async function requestLogs(ctx: Koa.Context) {
  try {
    ctx.response.body = await listLogs()
    ctx.response.status = 200
  } catch {
    ctx.response.body = JSON.stringify({
      error: 'unable to process request for log headers',
    } as ErrorResponse)
    ctx.response.status = 500
  }
}

async function requestLog(ctx: Koa.Context, session: string) {
  try {
    const body = await grabLog(session)
    ctx.response.body = body
    ctx.response.status = 200
  } catch {
    ctx.response.body = JSON.stringify({
      error:
        typeof session !== 'string'
          ? 'no file requested'
          : `file ${session}.json not found`,
    } as ErrorResponse)
    ctx.response.status = 400
  }
}

async function requestLogUpdate(ctx: Koa.Context, session: string) {
  const request = (await unwrapStream(ctx.req)) as LogUpdate
  try {
    ctx.response.body = await updateLog(session, request)
    ctx.response.status = 200
  } catch {
    ctx.response.body = JSON.stringify({
      error:
        typeof session !== 'string'
          ? 'no file requested for update'
          : `unable to process update for ${session}`,
    } as ErrorResponse)
    ctx.response.status = 500
  }
}

async function requestLogDelete(ctx: Koa.Context, session: string) {
  const request = (await unwrapStream(ctx.req)) as LogRequest
  try {
    ctx.response.body = await deleteLog(session)
    ctx.response.status = 200
  } catch {
    ctx.response.body = JSON.stringify({
      error:
        typeof request.sessionName !== 'string'
          ? 'no file requested for deletion'
          : `unable to process delete for ${request.sessionName}`,
    } as ErrorResponse)
    ctx.response.status = 500
  }
}
app.use(async (ctx, next) => {
  ctx.set(
    'Access-Control-Allow-Origin',
    `http://localhost:${config.clientPort}`,
  )
  ctx.set(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  )
  ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
  if (ctx.method === 'OPTIONS') {
    ctx.status = 200
  } else {
    await next()
  }
})
app.use(route.get('/logs', ctx => processRequest(ctx, requestLogs)))
app.use(
  route.get('/log/:session', (ctx, session) =>
    processRequest(ctx, requestLog, session),
  ),
)
app.use(
  route.post('/log/:session', (ctx, session) =>
    processRequest(ctx, requestLogUpdate, session),
  ),
)
app.use(
  route.delete('/log/:session', (ctx, session) =>
    processRequest(ctx, requestLogDelete, session),
  ),
)
app.use(ctx => {
  ctx.status = 404
  ctx.body = JSON.stringify({
    error: 'This is not the endpoint you are looking for',
  })
})
