import axios from 'axios'
import { GroongaHttpClient } from '@/groonga-http-client'
import { spawnGroonga, shutdownGroonga, mkdir, rimraf } from './test_utils'
import path from 'path'

describe('GroongaHttpClient', () => {
  const db_dir = path.join(__dirname, 'db_select')

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

  test('select/drilldowns/table/slice', async () => {
    const db_path = path.join(db_dir, `select.db`)
    const server = await spawnGroonga(db_path).catch((err) => {
      throw err
    })
    const client = new GroongaHttpClient(axios, server.host)

    const r1 = await client.commandAsync('table_create Tags TABLE_PAT_KEY ShortText')
    expect(r1).toBe(true)

    const r2 = await client.commandAsync('table_create Memos TABLE_HASH_KEY ShortText')
    expect(r2).toBe(true)

    const r3 = await client.commandAsync('column_create Memos date COLUMN_SCALAR Time')
    expect(r3).toBe(true)

    const r4 = await client.commandAsync('column_create Memos tag COLUMN_SCALAR Tags')
    expect(r4).toBe(true)

    const r5 = await client.commandAsync('column_create Tags memos_tag COLUMN_INDEX Memos tag')
    expect(r5).toBe(true)

    const r6 = await client.commandAsync('load --table Memos', {
      values: JSON.stringify([
        { _key: 'Groonga is fast!', date: '2016-05-19 12:00:00', tag: 'Groonga' },
        { _key: 'Mroonga is fast!', date: '2016-05-19 12:00:01', tag: 'Mroonga' },
        { _key: 'Groonga sticker!', date: '2016-05-19 12:00:02', tag: 'Groonga' },
        { _key: 'Groonga site!', date: '2016-05-19 12:00:02', tag: 'Groonga' },
        { _key: 'Rroonga is fast!', date: '2016-05-19 12:00:03', tag: 'Rroonga' },
      ]),
    })
    expect(r6).toBe(5)

    const r7 = await client.commandAsync(`select Memos \\
      --filter 'date < "2016-05-19 13:00:02"' \\
      --slices[groonga].filter 'tag @ "Groonga"' \\
      --slices[groonga].sort_keys '_id' \\
      --slices[groonga].output_columns '_key, date, tag' \\
      --drilldowns[tags].table groonga \\
      --drilldowns[tags].keys date`)

    expect(r7).toEqual([
      [
        [5],
        [
          ['_id', 'UInt32'],
          ['_key', 'ShortText'],
          ['date', 'Time'],
          ['tag', 'Tags'],
        ],
        [1, 'Groonga is fast!', 1463626800.0, 'Groonga'],
        [2, 'Mroonga is fast!', 1463626801.0, 'Mroonga'],
        [3, 'Groonga sticker!', 1463626802.0, 'Groonga'],
        [4, 'Groonga site!', 1463626802.0, 'Groonga'],
        [5, 'Rroonga is fast!', 1463626803.0, 'Rroonga'],
      ],
      {
        groonga: [
          [3],
          [
            ['_key', 'ShortText'],
            ['date', 'Time'],
            ['tag', 'Tags'],
          ],
          ['Groonga is fast!', 1463626800.0, 'Groonga'],
          ['Groonga sticker!', 1463626802.0, 'Groonga'],
          ['Groonga site!', 1463626802.0, 'Groonga'],
        ],
      },
      {
        tags: [
          [2],
          [
            ['_key', 'Time'],
            ['_nsubrecs', 'Int32'],
          ],
          [1463626800.0, 1],
          [1463626802.0, 2],
        ],
      },
    ])

    await shutdownGroonga(server)
  })
})
