import type { AxiosInstance, AxiosResponse } from 'axios'
import { parseCommand, TypeGuards } from '@yagisumi/groonga-command'

function chomp(str: string, rs: string) {
  return str.endsWith(rs) ? str.slice(0, -rs.length) : str
}

type OK = { error: undefined; data: any }
type ERR = { error: Error; data: null }
type Result = OK | ERR

function ERR(error: Error): ERR {
  return { error, data: null }
}

function OK(data: any): OK {
  return { error: undefined, data }
}

export class GroongaError extends Error {
  readonly data: any
  constructor(message: string, data: any) {
    super(message)
    this.data = data
  }
}

function checkOutput(data: any): Result {
  const data_type = typeof data
  if (data_type === 'string') {
    return OK(data)
  }

  let header: any = undefined
  let body: any = undefined
  let return_code: any = undefined
  let error_message: string | undefined = undefined

  if (Array.isArray(data)) {
    header = data[0]
    body = data[1]
    if (Array.isArray(header)) {
      return_code = header[0]
      error_message = header[3]
    }
  } else if (typeof data === 'object') {
    header = data.header
    body = data.body
    return_code = header?.return_code
    error_message = header?.error?.message
  }

  if (header === undefined || body === undefined || return_code === undefined) {
    return ERR(new GroongaError('unexpected data type', data))
  }

  if (return_code === 0) {
    return OK(body)
  }

  return ERR(new GroongaError(error_message ?? 'unexpected error', data))
}

export type CommandCallback = (err: Error | undefined, data: any) => void

export class GroongaHttpClient {
  readonly axios: AxiosInstance
  readonly host: string
  constructor(axios: AxiosInstance, host: string) {
    this.axios = axios
    this.host = host
  }

  command(command: string, options: object, callback: CommandCallback): void
  command(command: string, callback: CommandCallback): void
  command(command: string, arg2: object | CommandCallback, callback?: CommandCallback): void {
    const opts = typeof arg2 === 'object' ? arg2 : undefined
    const cb = typeof arg2 === 'function' ? (arg2 as CommandCallback) : callback

    if (cb == null) {
      return
    }

    const cmd = parseCommand(command, opts as { [key: string]: string | number })
    if (cmd === undefined) {
      cb(new Error("can't parse command"), null)
      return
    }

    let response: Promise<AxiosResponse<any>>

    if (TypeGuards.isLoad(cmd)) {
      const url = chomp(this.host, '/') + cmd.to_uri_format({ exclude: ['values'] })
      let values = cmd.arguments['values'] ?? '[]'
      if (typeof values !== 'string') {
        try {
          values = JSON.stringify(values)
        } catch (err) {
          cb(new Error('unexpected type of values'), null)
        }
      }
      response = this.axios.post(url, values, { headers: { 'Content-Type': 'application/json' } })
    } else {
      const url = chomp(this.host, '/') + cmd.to_uri_format()
      response = this.axios.get(url)
    }

    response
      .then((res) => {
        const { error, data } = checkOutput(res.data)
        cb(error, data)
      })
      .catch((err) => {
        if (err.response) {
          const { error, data } = checkOutput(err.response.data)
          cb(error, data)
        } else {
          cb(err, null)
        }
      })
  }

  commandAsync(command: string, options: object): Promise<any>
  commandAsync(command: string): Promise<any>
  commandAsync(command: string, options?: object): Promise<any> {
    return new Promise((resolve, reject) => {
      this.command(command, options || {}, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
}

export function createGroongaHttpClient(axios: AxiosInstance, host: string) {
  return new GroongaHttpClient(axios, host)
}
