import fs from 'fs'
import path from 'path'
import net from 'net'
import child_process from 'child_process'
import axios from 'axios'

export function mkdir(path: string) {
  fs.mkdirSync(path)
}

export function rimraf(dir_path: string) {
  if (fs.existsSync(dir_path)) {
    fs.readdirSync(dir_path).forEach(function (entry) {
      const entry_path = path.join(dir_path, entry)
      if (fs.lstatSync(entry_path).isDirectory()) {
        rimraf(entry_path)
      } else {
        fs.unlinkSync(entry_path)
      }
    })
    fs.rmdirSync(dir_path)
  }
}

type Server = {
  process: child_process.ChildProcessWithoutNullStreams
  host: string
}

export function spawnGroonga(db_path: string): Promise<Server> {
  return new Promise((resolve, reject) => {
    let port = 0
    const s = net.createServer()
    const iid_s = setTimeout(() => {
      if (s.listening) {
        s.close()
      }
      reject(new Error('unexpected error'))
    }, 3000)

    let groonga = 'groonga'
    if (process.platform === 'win32') {
      const env_path = process.env.GROONGA_PATH
      if (env_path == null) {
        clearTimeout(iid_s)
        reject(new Error("missing environment variable 'GROONGA_PATH'"))
        return
      }

      groonga = path.join(env_path, 'bin/groonga.exe')
      if (!fs.existsSync(groonga)) {
        clearTimeout(iid_s)
        reject(new Error(`missing groonga.exe: ${groonga}`))
        return
      }
    }

    s.listen({ host: 'localhost', port: 0 }, () => {
      const address = s.address()
      if (address != null && typeof address !== 'string') {
        port = address.port
      }

      s.close(() => {
        clearTimeout(iid_s)
        if (port === 0) {
          reject(new Error('faild to get port number'))
          return
        }

        const groonga_server = child_process.spawn(
          groonga,
          ['--protocol', 'http', '--port', `${port}`, '-s', '-n', db_path],
          {
            stdio: 'pipe',
          }
        )

        setTimeout(() => {
          if (typeof (groonga_server as any).exitCode === 'number') {
            reject(new Error(`groonga error: ${(groonga_server as any).exitCode}`))
          } else {
            resolve({
              process: groonga_server,
              host: `http://localhost:${port}/`,
            })
          }
        }, 500)
      })
    })
  })
}

function postprocess(server: Server, done: () => void) {
  return function () {
    server.process.kill()
    if (done) {
      done()
    }
  }
}

export function shutdownGroonga(server: Server, done?: jest.DoneCallback) {
  if (done) {
    const pp = postprocess(server, done)
    axios.get(`${server.host}/d/shutdown`).then(pp).catch(pp)
  } else {
    return new Promise((resolve) => {
      const pp = postprocess(server, resolve)
      axios.get(`${server.host}/d/shutdown`).then(pp).catch(pp)
    })
  }
}
