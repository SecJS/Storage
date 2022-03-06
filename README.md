# Storage 🗃️

> Handle your application files in Node.js

[![GitHub followers](https://img.shields.io/github/followers/secjs.svg?style=social&label=Follow&maxAge=2592000)](https://github.com/secjs?tab=followers)
[![GitHub stars](https://img.shields.io/github/stars/secjs/storage.svg?style=social&label=Star&maxAge=2592000)](https://github.com/secjs/storage/stargazers/)

<p>
    <a href="https://www.buymeacoffee.com/secjs" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
</p>

<p>
  <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/secjs/storage?style=for-the-badge&logo=appveyor">

  <img alt="Repository size" src="https://img.shields.io/github/repo-size/secjs/storage?style=for-the-badge&logo=appveyor">

  <img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge&logo=appveyor">

  <img alt="Commitizen" src="https://img.shields.io/badge/commitizen-friendly-brightgreen?style=for-the-badge&logo=appveyor">
</p>

The intention behind this repository is to always maintain a `Storage` class to manipulate files using any driver.

<img src=".github/storage.png" width="200px" align="right" hspace="30px" vspace="100px">

## Installation

> To use the high potential from this package you need to install first this other packages from SecJS,
> it keeps as dev dependency because one day `@secjs/core` will install everything once.

```bash
npm install @secjs/env @secjs/utils @secjs/contracts @secjs/exceptions
```

> Then you can install the package using:

```bash
npm install @secjs/storage
```

## Usage

### Config filesystem template

> First you need to create the configuration file *filesystem* in the config folder on project root path. Is extremely important to use export default in these configurations.

```ts
import { Env } from '@secjs/env'
import { Path } from '@secjs/utils'

export default {
  /*
  |--------------------------------------------------------------------------
  | Default Filesystem Disk
  |--------------------------------------------------------------------------
  |
  | Here you may specify the default filesystem disk that should be used
  | by the framework. The "local" disk, as well as a variety of cloud
  | based disks are available to your application.
  |
  */

  default: Env('FILESYSTEM_DISK', 'local'),

  /*
  |--------------------------------------------------------------------------
  | Filesystem Disks
  |--------------------------------------------------------------------------
  |
  | Here you may configure as many filesystem "disks" as you wish, and you
  | may even configure multiple disks of the same driver. Defaults have
  | been setup for each driver as an example of the required options.
  |
  */

  disks: {
    local: {
      driver: 'local',
      root: Path.noBuild().storage('app'),
      url: `${Env('APP_URL', '')}/storage`,
    },
    public: {
      driver: 'local',
      root: Path.noBuild().storage('app/public'),
      url: `${Env('APP_URL', '')}/storage/public`,
    },
    s3: {
      driver: 's3',
      key: Env('AWS_KEY', ''),
      secret: Env('AWS_SECRET', ''),
      region: Env('AWS_REGION', ''),
      bucket: Env('AWS_BUCKET', ''),
      endpoint: Env('AWS_ENDPOINT', '')
    },
    gcs: {
      driver: 'gcs',
      project: Env('GCS_PROJECT', ''),
      secret: Env('GCS_SECRET', ''),
      bucket: Env('GCS_BUCKET', ''),
      endpoint: Env('GCS_ENDPOINT', ''),
    },
  },
}
```

### Storage

> With the config/filesystem file created you can use Storage class to start storing your files.

```ts
import { Storage } from '@secjs/storage'

const storage = new Storage()

// Storage class will always use the default value set in config/filesystem to store the files, in this case, local.
await storage.put('file.txt', Buffer.from('hello world!'))
// The file will be saved in the root storage/app/file.txt, according to config/filesystem.

// You can use putFile method to create a file "without name", an unique id will be generated for him.
const path = await storage.putFile('folder', 'txt', Buffer.from('hello world!')) // returns the path -> folder/DASdsakdjas912831jhdasnm.txt
// The file will be saved in the root storage/app/folder/DASdsakdjas912831jhdasnm.txt, according to config/filesystem.
```

```ts
// You can use exists and missing too
console.log(await storage.exists('folder/DASdsakdjas912831jhdasnm.txt')) // true
console.log(await storage.missing('folder/DASdsakdjas912831jhdasnm.txt')) // false

// You can get only the content of the file in Buffer using get
await storage.get('folder/DASdsakdjas912831jhdasnm.txt') // Buffer<6c 6c 6c 6c...>
```

```ts
// You can generate an url and a temporaryUrl to your file based on config/filesystem.
await storage.url('folder/DASdsakdjas912831jhdasnm.txt') // https://cdn.secjs.io/storage/folder/DASdsakdjas912831jhdasnm.txt
// 10 minutes = 600000ms
await storage.temporaryUrl('folder/DASdsakdjas912831jhdasnm.txt', 600000) // https://cdn.secjs.io/storage/folder/temp/30219310391sadlksa12039.txt
```

```ts
// You can delete the file using delete
const force = true
// You can use force to not throw exceptions if file does not exist
await storage.delete('folder/DASdsakdjas912831jhdasnm.txt', force)
```

```ts
// You can use copy and move
// In this case folder/DASdsakdjas912831jhdasnm.txt will still exists
await storage.copy('folder/DASdsakdjas912831jhdasnm.txt', 'folder/test/copy.txt')

// In this case folder/DASdsakdjas912831jhdasnm.txt will be removed
await storage.move('folder/DASdsakdjas912831jhdasnm.txt', 'folder/test/move.txt')
```

### Subscribing configs of disks in runtime

> You can subscribe the disks configs in runtime using in Storage constructor or disk method

```ts
// Using disk method approach
// File created on storage/newAppFolder/file.txt
storage
  .disk('local', { root: Path.noBuild().storage('newAppFolder') })
  .put('file.txt', Buffer.from('Hello World'))

// Using constructor method approach
const newStorage = new Storage({ root: Path.noBuild().storage('newAppFolder') })

// File created on storage/newAppFolder/file2.txt
newStorage.put('file2.txt', Buffer.from('Hello World'))

// You can reset configs using an empty object in the disk method
storage.disk('local', {}) // Clear the runtime configuration
```

### Using S3 or GCS disk

> You can use **s3** or **gcs** disk to make all this actions inside buckets

```ts
// Saves to S3
storage.disk('s3').put('folder/file.txt', Buffer.from('Hello world!'))
// Saves to GCS
storage.disk('gcs').put('folder/file.txt', Buffer.from('Hello world!'))
```

### Extending disks and drivers

> Nowadays, @secjs/storage has only LocalDriver, S3Driver and GCSDriver support, but you can extend the drivers for Storage class if you implement DriverContract interface

```ts
import { DriverContract } from '@secjs/storage'

class CustomDriver implements DriverContract {
  private readonly _url: string
  private readonly _root: string
  
  constructor(disk: string) {
    this._url = Config.get(`filesystem.disks.${disk}.url`)
    this._root = Config.get(`filesystem.disks.${disk}.root`)
  }
  
  // all the methods implemented from DriverContract...
}
```

> Constructor is extremely important in your CustomDriver class, it's the constructor that 
> will use the values from config/filesystem disks to manipulate your CustomDriver using 
> `disk` method from storage. So if you are building a CustomDriver, and you want to use it,
> you can create a new disk inside config/filesystem disks or change the driver from an existing disk.

```ts
// extending disks
// config/filesystem file

export default {
  // default etc...
  
  disks: {
    mydisk: {
      driver: 'custom',
      root: Path.storage('app/mydisk'),
      url: `${Env('APP_URL', '')}/storage/mydisk`,
    }
    // ... other disks
  }
}
```

> Build you new driver using build static method

```ts
const name = 'custom'
const driver = CustomDriver

Storage.build(name, driver)

console.log(Storage.drivers) // ['s3', 'local', 'public', 'custom']
```

> Now, if you have implemented your disk in config/filesystem, you can use him inside storage

```ts
// Will use CustomDriver to handle the file actions
storage.disk('mydisk').put('file.txt', Buffer.from('my custom driver'))
```

---

## License

Made with 🖤 by [jlenon7](https://github.com/jlenon7) :wave:
