type LogBase = {
  agentType:
    | 'contextless'
    | 'suit-counting'
    | 'card-counting'
    | 'context-learning'
  simplified: boolean
}
type LogDataAttributes = {
  sessionName: string
  epochsTrained: number
  creationTime: number
  lastUpdate: number
  serializedContent: string
}
type LogHeaderAttributes = {
  sessionName: string
  epochsTrained: number
  lastUpdate: number
}
type LogUpdateAttributes = {
  additionalEpochsTrained: number
  serializedContent: string
}

export type LogData = LogBase & LogDataAttributes
export type LogHeader = LogBase & LogHeaderAttributes
export type LogRequest = {
  sessionName: string
}
export type LogUpdate = LogBase & LogUpdateAttributes

export type DefaultResponse = {
  message: string
}
export type ErrorResponse = {
  error: string
}
export type GETLogsResponse = {
  logs: LogHeader[]
}
export type GETLogResponse = {
  log: LogData
}
export type POSTLogResponse = DefaultResponse
export type DELETELogResponse = DefaultResponse
