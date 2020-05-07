import axios from 'axios'
import { GroongaHttpClient } from '@/groonga-http-client'
import { spawnGroonga, shutdownGroonga, mkdir, rimraf } from './test_utils'
import path from 'path'

describe('GroongaHttpClient', () => {
  const db_dir = path.join(__dirname, 'db_load')

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

  test('load/command_version/3/default', async () => {
    const db_path = path.join(db_dir, `load.db`)
    const server = await spawnGroonga(db_path).catch((err) => {
      throw err
    })
    const client = new GroongaHttpClient(axios, server.host)

    const r1 = await client.commandAsync('table_create Memos TABLE_NO_KEY')
    expect(r1).toBe(true)

    const r2 = await client.commandAsync('column_create Memos value COLUMN_SCALAR Int8')
    expect(r2).toBe(true)

    const r3 = await client.commandAsync('load --table Memos --command_version 3', {
      values: JSON.stringify([{ value: 1 }, { value: 2 }]),
    })
    expect(r3).toEqual({
      n_loaded_records: 2,
    })

    await shutdownGroonga(server)
  })
})
