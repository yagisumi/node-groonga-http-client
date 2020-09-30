# @yagisumi/groonga-http-client

HTTP Client for Groonga with axios.

[![NPM version][npm-image]][npm-url] [![install size][packagephobia-image]][packagephobia-url] [![DefinitelyTyped][dts-image]][dts-url]  
[![Build Status][githubactions-image]][githubactions-url] [![Coverage percentage][coveralls-image]][coveralls-url]

## Installation

```sh
$ npm i @yagisumi/groonga-http-client
```

## Usage

- typescript

```ts
import { createGroongaClient } from '@yagisumi/groonga-http-client'
import axios from 'axios'

async function main() {
  const client = createGroongaClient(axios, 'http://localhost:10041')
  const r1 = await client.commandAsync('status').catch(() => undefined)

  client.command('table_list', (err, data) => {
    if (err) {
      console.error(err)
    } else {
      console.log(data)
    }
  })
}
main()
```

## API

### `createGroongaClient`
alias: `createClient`
```ts
function createGroongaClient(
  axios: AxiosInstance, 
  host: string // e.g. 'http://localhost:10041'
): GroongaHttpClient
```
Creats a client. Same as `new GroongaHttpClient(axios, host)`

### `class GroongaHttpClient`
#### `command`
```ts
command(
  command: string,
  options: object,
  callback: (err: Error, data: any) => void
): void
command(
  command: string,
  callback: (err: Error, data: any) => void
): void
```
Executes a command with a callback.

#### `commandAsync`
```ts
commandAsync(
  command: string,
  options: object
): Promise<any>
commandAsync(
  command: string
): Promise<any>
```
Executes a command and returns a promise.

## License

[MIT License](https://opensource.org/licenses/MIT)

[githubactions-image]: https://img.shields.io/github/workflow/status/yagisumi/node-groonga-http-client/build?logo=github&style=flat-square
[githubactions-url]: https://github.com/yagisumi/node-groonga-http-client/actions
[npm-image]: https://img.shields.io/npm/v/@yagisumi/groonga-http-client.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@yagisumi/groonga-http-client
[packagephobia-image]: https://flat.badgen.net/packagephobia/install/@yagisumi/groonga-http-client
[packagephobia-url]: https://packagephobia.now.sh/result?p=@yagisumi/groonga-http-client
[travis-image]: https://img.shields.io/travis/yagisumi/node-groonga-http-client.svg?style=flat-square
[travis-url]: https://travis-ci.org/yagisumi/node-groonga-http-client
[appveyor-image]: https://img.shields.io/appveyor/ci/yagisumi/node-groonga-http-client.svg?logo=appveyor&style=flat-square
[appveyor-url]: https://ci.appveyor.com/project/yagisumi/node-groonga-http-client
[coveralls-image]: https://img.shields.io/coveralls/yagisumi/node-groonga-http-client.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/yagisumi/node-groonga-http-client?branch=master
[dts-image]: https://img.shields.io/badge/DefinitelyTyped-.d.ts-blue.svg?style=flat-square
[dts-url]: http://definitelytyped.org
