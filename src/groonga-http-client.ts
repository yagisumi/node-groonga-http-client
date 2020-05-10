import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import { parseCommand, TypeGuards } from '@yagisumi/groonga-command'
import { getResponseBody, chomp } from './client_utils'

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
      const config: AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' } }
      if (cmd.output_type === 'msgpack') {
        config.responseType = 'arraybuffer'
      }
      response = this.axios.post(url, values, config)
    } else {
      const url = chomp(this.host, '/') + cmd.to_uri_format()
      const config: AxiosRequestConfig = {}
      if (cmd.output_type === 'msgpack') {
        config.responseType = 'arraybuffer'
      }
      response = this.axios.get(url, config)
    }

    response
      .then((res) => {
        const { error, value } = getResponseBody(res.data)
        cb(error, value)
      })
      .catch((err) => {
        if (err?.response?.data) {
          const { error, value } = getResponseBody(err.response.data)
          cb(error, value)
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

export function createClient(axios: AxiosInstance, host: string) {
  return new GroongaHttpClient(axios, host)
}

export type GroongaHttpClientClass = typeof GroongaHttpClient
export type GroongaHttpClientInstance = GroongaHttpClient
