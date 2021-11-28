import { existsSync, promises } from 'fs'
import { Config } from '@secjs/config'
import { Storage } from '../src/Storage'
import { Path } from '@secjs/utils'
import { LocalDriver } from '../src/Drivers/LocalDriver'

describe('\n Build Drive Storage Class', () => {
  let storage: Storage = null
  // 200 MB of content
  const bigContent = Buffer.alloc(Math.max(0, 1024 * 1024 * 200 - 2), 'l')

  beforeEach(async () => {
    await new Config().load()

    storage = new Storage()
  })

  it('should throw an exception when disk does not exist', async () => {
    try {
      await storage.disk('any').put('testing.txt', bigContent)
    } catch (error) {
      expect(error.name).toBe('NotImplementedException')
      expect(error.status).toBe(501)
      expect(error.isSecJsException).toBe(true)
      expect(error.content).toBe(
        'Disk any is not configured inside filesystem.disks object from config/filesystem file',
      )
    }
  })

  it('should throw an exception when trying to create a driver that already exists', async () => {
    try {
      Storage.build('local', LocalDriver)
    } catch (error) {
      expect(error.name).toBe('InternalServerException')
      expect(error.status).toBe(500)
      expect(error.isSecJsException).toBe(true)
      expect(error.content).toBe('Driver local already exists')
    }
  })

  it('should build a new type of driver to Storage and list all drivers', async () => {
    Storage.build('lib', LocalDriver)

    await storage.disk('lib').put('build.txt', bigContent)
    const filePath = Path.storage('app/lib/build.txt')

    const url = await storage.disk('lib').url('build.txt')

    expect(existsSync(filePath)).toBe(true)
    expect(url).toBe('https://cdn.secjs.io/storage/lib/build.txt')

    expect(Storage.drivers).toStrictEqual(['s3', 'local', 'lib'])
  })

  afterEach(async () => {
    await promises.rmdir(Path.storage('app/lib'), { recursive: true })
  })
})
