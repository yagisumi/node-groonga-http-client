import axios from 'axios'
import { GroongaHttpClient, GroongaError, createGroongaHttpClient } from '@/groonga-http-client'
import { spawnGroonga, shutdownGroonga, mkdir, rimraf } from './test_utils'
import path from 'path'

describe('GroongaHttpClient', () => {
  const db_dir = path.join(__dirname, 'db_main')

  beforeAll(() => {
    rimraf(db_dir)
    mkdir(db_dir)
  })

  afterAll(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        rimraf(db_dir)
        resolve()
      }, 800)
    })
  })

  test('invalid command', (done) => {
    const db_path = path.join(db_dir, `invalid_command.db`)
    spawnGroonga(db_path)
      .then((server) => {
        const client = new GroongaHttpClient(axios, server.host)
        client.command('', (err, data) => {
          try {
            expect(err).toBeInstanceOf(Error)
            expect(data).toBeNull()
          } finally {
            shutdownGroonga(server, done)
          }
        })
      })
      .catch((err) => {
        throw err
      })
  })

  test('command success', (done) => {
    const db_path = path.join(db_dir, 'command_success.db')
    spawnGroonga(db_path)
      .then((server) => {
        const client = new GroongaHttpClient(axios, server.host)
        client.command('status', (err, data) => {
          try {
            expect(err).toBeUndefined()
            expect(typeof data).toBe('object')
          } finally {
            shutdownGroonga(server, done)
          }
        })
      })
      .catch((err) => {
        throw err
      })
  })

  test('command fail', (done) => {
    const db_path = path.join(db_dir, 'command_fail.db')
    spawnGroonga(db_path)
      .then((server) => {
        const client = new GroongaHttpClient(axios, server.host)
        client.command('table_create', (err, data) => {
          try {
            expect(err).toBeInstanceOf(GroongaError)
            expect(data).toBeNull()
          } finally {
            shutdownGroonga(server, done)
          }
        })
      })
      .catch((err) => {
        throw err
      })
  })

  test('message pack (unsupported)', (done) => {
    const db_path = path.join(db_dir, 'message_pack.db')
    spawnGroonga(db_path)
      .then((server) => {
        const client = new GroongaHttpClient(axios, server.host)
        client.command('status --output_type msgpack', (err, data) => {
          try {
            expect(err).toBeUndefined()
            expect(typeof data).toBe('string')
          } finally {
            shutdownGroonga(server, done)
          }
        })
      })
      .catch((err) => {
        throw err
      })
  })

  test('commandAsync', async () => {
    const db_path = path.join(db_dir, 'commandAsync.db')
    const server = await spawnGroonga(db_path).catch((err) => {
      throw err
    })
    const client = createGroongaHttpClient(axios, server.host)

    try {
      const r1 = await client
        .commandAsync('table_create People TABLE_HASH_KEY', { key_type: 'ShortText' })
        .catch(() => undefined)
      expect(r1).not.toBeUndefined()
      expect(r1).toBe(true)

      const r2 = await client.commandAsync('dump').catch(() => undefined)
      expect(r2).not.toBeUndefined()
      expect((r2 as string).trim()).toBe('table_create People TABLE_HASH_KEY ShortText')

      const r3 = await client
        .commandAsync('column_create --table People --name age --flags COLUMN_SCALAR --type UInt8')
        .catch(() => undefined)
      expect(r3).not.toBeUndefined()
      expect(r3).toBe(true)

      const r4 = await client
        .commandAsync('load --table People', { values: JSON.stringify([{ _key: 'alice', age: 7 }]) })
        .catch(() => undefined)
      expect(r4).not.toBeUndefined()
      expect(r4).toBe(1)

      const r5 = await client.commandAsync('table_create').catch((err) => err)
      expect(r5).toBeInstanceOf(GroongaError)
    } finally {
      await shutdownGroonga(server)
    }
  })
})
