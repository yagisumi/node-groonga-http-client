import fs from 'fs'
import path from 'path'
import child_process from 'child_process'
import axios from 'axios'
import getPort from 'get-port'

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
    let groonga = 'groonga'
    if (process.platform === 'win32') {
      const env_path = process.env.GROONGA_PATH
      if (env_path == null) {
        reject(new Error("missing environment variable 'GROONGA_PATH'"))
        return
      }

      groonga = path.join(env_path, 'bin/groonga.exe')
      if (!fs.existsSync(groonga)) {
        reject(new Error(`missing groonga.exe: ${groonga}`))
        return
      }
    }

    getPort()
      .then((port) => {
        const groonga_server = child_process.spawn(
          groonga,
          ['--protocol', 'http', '--port', `${port}`, '-s', '-n', db_path],
          {
            stdio: 'pipe',
          }
        )

        let error: Error | undefined = undefined
        groonga_server.on('error', (err) => {
          error = err
        })
        groonga_server.on('exit', (code) => {
          if (typeof code === 'number' && code !== 0) {
            error = new Error(`exit code: ${code}`)
          }
        })

        setTimeout(() => {
          if (error) {
            reject(error)
          } else if (typeof (groonga_server as any).exitCode === 'number') {
            reject(new Error(`exit code: ${(groonga_server as any).exitCode}`))
          } else {
            resolve({
              process: groonga_server,
              host: `http://localhost:${port}/`,
            })
          }
        }, 500)
      })
      .catch((err) => {
        reject(err)
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

export function shutdownGroonga(server: Server, done?: () => any) {
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
