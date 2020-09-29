import axios from 'axios'
import { GroongaHttpClient, createClient } from '@/groonga-http-client'
import { GroongaError, isArrayBuffer } from '@/client_utils'
import { spawnGroonga, shutdownGroonga, mkdir, rimraf, Server } from './test_utils'
import path from 'path'

describe('GroongaHttpClient', () => {
  let server: Server | undefined

  beforeEach(() => {
    server = undefined
  })

  afterEach(async () => {
    if (server) {
      await shutdownGroonga(server)
      rimraf(server.db_dir)
    }
  })

  test('invalid command', (done) => {
    const db_dir = path.join(__dirname, 'temp.invalid_command')
    const db_path = path.join(db_dir, `db`)
    rimraf(db_dir)
    mkdir(db_dir)

    spawnGroonga(db_path)
      .then((svr) => {
        server = svr
        const client = new GroongaHttpClient(axios, svr.host)
        client.command('', (err, data) => {
          expect(err).toBeInstanceOf(Error)
          expect(data).toBeNull()
          done()
        })
      })
      .catch((err) => {
        try {
          rimraf(db_dir)
        } catch (e) {
          //
        }
        throw err
      })
  })

  test('command success', (done) => {
    const db_dir = path.join(__dirname, 'temp.command_success')
    const db_path = path.join(db_dir, `db`)

    rimraf(db_dir)
    mkdir(db_dir)
    spawnGroonga(db_path)
      .then((svr) => {
        server = svr
        const client = new GroongaHttpClient(axios, svr.host)
        client.command('status', (err, data) => {
          expect(err).toBeUndefined()
          expect(typeof data).toBe('object')
          done()
        })
      })
      .catch((err) => {
        try {
          rimraf(db_dir)
        } catch (e) {
          //
        }
        throw err
      })
  })

  test('command failure', (done) => {
    const db_dir = path.join(__dirname, 'temp.command_fail')
    const db_path = path.join(db_dir, `db`)
    rimraf(db_dir)
    mkdir(db_dir)

    spawnGroonga(db_path)
      .then((svr) => {
        server = svr
        const client = new GroongaHttpClient(axios, svr.host)
        client.command('table_create', (err, data) => {
          expect(err).toBeInstanceOf(GroongaError)
          expect(data).toBeNull()
          done()
        })
      })
      .catch((err) => {
        try {
          rimraf(db_dir)
        } catch (e) {
          //
        }
        throw err
      })
  })

  test('message pack (unsupported)', (done) => {
    const db_dir = path.join(__dirname, 'temp.message_pack')
    const db_path = path.join(db_dir, `db`)
    rimraf(db_dir)
    mkdir(db_dir)

    spawnGroonga(db_path)
      .then((svr) => {
        server = svr
        const client = new GroongaHttpClient(axios, svr.host)
        client.command('status --output_type msgpack', (err, data) => {
          expect(err).toBeUndefined()
          expect(typeof data).not.toBe('string')
          expect(isArrayBuffer(data)).toBe(true)
          done()
        })
      })
      .catch((err) => {
        try {
          rimraf(db_dir)
        } catch (e) {
          //
        }
        throw err
      })
  })

  test('commandAsync', async () => {
    const db_dir = path.join(__dirname, 'temp.invalcommandAsyncd_command')
    const db_path = path.join(db_dir, `db`)
    rimraf(db_dir)
    mkdir(db_dir)

    server = await spawnGroonga(db_path).catch((err) => {
      try {
        rimraf(db_dir)
      } catch (e) {
        //
      }
      throw err
    })
    const client = createClient(axios, server.host)

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
  })
})
