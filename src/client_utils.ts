export function chomp(str: string, rs: string) {
  return str.endsWith(rs) ? str.slice(0, -rs.length) : str
}

export function isArrayBuffer(obj: any) {
  return ArrayBuffer.isView(obj) || Object.prototype.toString.call(obj) === '[object ArrayBuffer]'
}

type OK = { error: undefined; value: any }
type ERR = { error: Error; value: null }
type Result = OK | ERR

function ERR(error: Error): ERR {
  return { error, value: null }
}

function OK(value: any): OK {
  return { error: undefined, value }
}

export class GroongaError extends Error {
  readonly response: any
  readonly returnCode?: number
  constructor(message: string, response: any, returnCode?: number) {
    super(message)
    this.response = response
    this.returnCode = returnCode
  }
}

export function getResponseBody(response: any): Result {
  const data_type = typeof response
  if (data_type === 'string' || isArrayBuffer(response)) {
    return OK(response)
  }

  let header: any = undefined
  let body: any = undefined
  let return_code: any = undefined
  let error_message: string | undefined = undefined

  if (Array.isArray(response)) {
    header = response[0]
    body = response[1]
    if (Array.isArray(header)) {
      return_code = header[0]
      error_message = header[3]
    }
  } else if (typeof response === 'object') {
    if (response != null) {
      header = response.header
      body = response.body
      return_code = header?.return_code
      error_message = header?.error?.message
    }
  }

  if (header === undefined || return_code === undefined) {
    return ERR(new GroongaError('unexpected data type', response, return_code))
  }

  if (return_code === 0) {
    return OK(body)
  }

  return ERR(new GroongaError(error_message ?? 'unexpected error', response, return_code))
}
