import * as http from 'http'
import { app } from './logger'
import { GETLogsResponse, LogUpdate, GETLogResponse } from './types'
import { unwrapStream } from '../utils/streamUtils'
import { config } from '../config'

const port = config.testPort

function requestOptions(path: string, method: string) {
  return {
    hostname: '127.0.0.1',
    port,
    path,
    method,
  } as http.RequestOptions
}

const testFileUpdate: LogUpdate = {
  agentType: 'contextless',
  simplified: true,
  additionalEpochsTrained: 1,
  serializedContent: 'null',
}

function testCreateLog(): Promise<void> {
  return new Promise(resolve => {
    const postLogRequest = http.request(
      requestOptions('/log/test-session', 'POST'),
      async res => {
        expect(res.statusCode).toBe(200)
        resolve()
      },
    )
    postLogRequest.write(JSON.stringify(testFileUpdate))
    postLogRequest.end()
  })
}

function testGetLogs(): Promise<void> {
  return new Promise(resolve => {
    const getLogsRequest = http.request(
      requestOptions('/logs', 'GET'),
      async res => {
        expect(res.statusCode).toEqual(200)
        const logs = (await unwrapStream<GETLogsResponse>(res)).logs
        const testLog = logs.find(
          ({ sessionName }) => sessionName === 'test-session',
        )
        expect(testLog).toBeTruthy()
        expect(testLog!.agentType).toBe('contextless')

        resolve()
      },
    )
    getLogsRequest.end()
  })
}

function testUpdateLog(): Promise<void> {
  return new Promise(resolve => {
    const updateLogRequest = http.request(
      requestOptions('/log/test-session', 'POST'),
      async res => {
        expect(res.statusCode).toBe(200)
        resolve()
      },
    )
    updateLogRequest.write(JSON.stringify(testFileUpdate))
    updateLogRequest.end()
  })
}

function testGetLog(): Promise<void> {
  return new Promise(resolve => {
    const getLogRequest = http.request(
      requestOptions('/log/test-session', 'GET'),
      async res => {
        expect(res.statusCode).toEqual(200)
        const body = await unwrapStream<GETLogResponse>(res)
        expect(body).toBeTruthy()
        resolve()
      },
    )
    getLogRequest.end()
  })
}

function testDeleteLog(): Promise<void> {
  return new Promise(resolve => {
    const deleteLogRequest = http.request(
      requestOptions('/log/test-session', 'DELETE'),
      async res => {
        expect(res.statusCode).toBe(200)
        resolve()
      },
    )
    deleteLogRequest.end()
  })
}

test(
  'The process of creating a new log, checking its existence, updating it, ' +
    'and deleting it will occur without error',
  async done => {
    const server = app.listen(port)
    try {
      await testCreateLog()
      await testGetLogs()
      await testUpdateLog()
      await testGetLog()
      await testDeleteLog()
    } finally {
      server.close(done)
    }
  },
)
