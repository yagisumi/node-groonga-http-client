import { getResponseBody, GroongaError, chomp, isArrayBuffer } from '@/client_utils'

describe('client utils', () => {
  test('chomp', () => {
    expect(chomp('/hello/world/', '/')).toBe('/hello/world')
    expect(chomp('/hello/world', '/')).toBe('/hello/world')
  })

  test('isArrayBuffer', () => {
    expect(isArrayBuffer(new ArrayBuffer(10))).toBe(true)
    expect(isArrayBuffer(new Int8Array(10))).toBe(true)
    expect(isArrayBuffer(new DataView(new ArrayBuffer(10)))).toBe(true)
    expect(isArrayBuffer({})).toBe(false)
    expect(isArrayBuffer('string')).toBe(false)
    expect(isArrayBuffer([])).toBe(false)
    expect(isArrayBuffer(true)).toBe(false)
    expect(isArrayBuffer(undefined)).toBe(false)
    expect(isArrayBuffer(null)).toBe(false)
  })

  describe('getResponseBody', () => {
    test('success (command_version=1)', () => {
      const head = [0, 1589033257.93, 0]
      const body = [
        [
          ['id', 'UInt32'],
          ['name', 'ShortText'],
          ['path', 'ShortText'],
          ['flags', 'ShortText'],
          ['domain', 'ShortText'],
          ['range', 'ShortText'],
          ['default_tokenizer', 'ShortText'],
          ['normalizer', 'ShortText'],
        ],
      ]
      const response = [head, body]
      const result = getResponseBody(response)

      expect(result.error).toBeUndefined()
      expect(result.value).toEqual(body)
    })

    test('success (command_version=3)', () => {
      const response = {
        header: {
          return_code: 0,
          start_time: 1589035099.416,
          elapsed_time: 0.001000165939331055,
        },
        body: [
          [
            ['id', 'UInt32'],
            ['name', 'ShortText'],
            ['path', 'ShortText'],
            ['flags', 'ShortText'],
            ['domain', 'ShortText'],
            ['range', 'ShortText'],
            ['default_tokenizer', 'ShortText'],
            ['normalizer', 'ShortText'],
          ],
        ],
      }

      const result = getResponseBody(response)

      expect(result.error).toBeUndefined()
      expect(result.value).toEqual(response.body)
    })

    test('failure (command_version=1)', () => {
      const head = [
        -22,
        1589033722.275,
        0.0149998664855957,
        "[column][create] table doesn't exist: <Memos>",
        [['command_column_create', '/example/proc_column.c', 198]],
      ]
      const body = false
      const response = [head, body]
      const result = getResponseBody(response)

      expect(result.error).toBeInstanceOf(Error)
      expect(result.error).toBeInstanceOf(GroongaError)
      expect(result.value).toBeNull()
      expect((result.error as GroongaError).returnCode).toBe(head[0])
      expect((result.error as GroongaError).message).toBe(head[3])
      expect((result.error as GroongaError).response).toEqual(response)
    })
  })

  test('failure (command_version=3)', () => {
    const response = {
      header: {
        return_code: -22,
        start_time: 1589034498.866,
        elapsed_time: 0,
        error: {
          message: "[column][create] table doesn't exist: <Memos>",
          function: 'command_column_create',
          file: 'G:\\data\\workspace\\script\\groonga\\src\\groonga-10.0.2\\lib\\proc\\proc_column.c',
          line: 198,
        },
      },
      body: false,
    }

    const result = getResponseBody(response)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error).toBeInstanceOf(GroongaError)
    expect(result.value).toBeNull()
    expect((result.error as GroongaError).returnCode).toBe(response.header.return_code)
    expect((result.error as GroongaError).message).toBe(response.header.error.message)
    expect((result.error as GroongaError).response).toEqual(response)
  })

  test('text argument', () => {
    const arg = 'table_create Memos TABLE_NO_KEY\n'

    const result = getResponseBody(arg)

    expect(result.error).toBeUndefined()
    expect(result.value).toBe(arg)
  })

  test('invalid argument', () => {
    const response = undefined
    const result = getResponseBody(response)

    expect(result.error).toBeInstanceOf(Error)
    expect(result.error).toBeInstanceOf(GroongaError)
    expect(result.value).toBeNull()
    expect((result.error as GroongaError).returnCode).toBeUndefined()
    expect((result.error as GroongaError).response).toEqual(response)
  })
})
