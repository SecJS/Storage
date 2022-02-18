import { Config } from '@secjs/config'
import { Storage } from '../src/Storage'
import { Folder, Path, sleep } from '@secjs/utils'
import { existsSync, promises, readdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('\n Storage Local Class', () => {
  let storage: Storage = null
  // 200 MB of content
  const bigContent = Buffer.alloc(Math.max(0, 1024 * 1024 * 200 - 2), 'l')

  beforeEach(async () => {
    await new Config().load()

    storage = new Storage()
  })

  it('should store a file in the local disk', async () => {
    await storage.put('local.txt', bigContent)
    const filePath = Path.storage('app/local/local.txt')

    expect(existsSync(filePath)).toBe(true)
  })

  it('should store a brand new file', async () => {
    await storage.putFile('unique-ids', bigContent, 'txt')

    const tmpPath = await promises.mkdtemp(join(tmpdir(), process.env.APP_NAME))
    const filePath = Path.storage('app/local/unique-ids')

    expect(readdirSync(tmpPath).length).toBe(0)
    expect(readdirSync(filePath).length).toBe(1)
  })

  it('should verify if file exists or is missing', async () => {
    await storage.put('local.txt', bigContent)
    const filePath = Path.storage('app/local/local.txt')

    expect(await storage.exists('local.txt')).toBe(true)
    expect(await storage.exists('no-exist.txt')).toBe(false)
    expect(await storage.missing('no-exist.txt')).toBe(true)

    try {
      // Absolute path
      await storage.exists(filePath)
    } catch (error) {
      expect(error.name).toBe('InternalServerException')
      expect(error.status).toBe(500)
      expect(error.isSecJsException).toBe(true)
      expect(error.content).toBe(
        `The path ${filePath} is an absolute path. Only file names and sub paths can be used within storage class`,
      )
    }
  })

  it('should get the file content in buffer', async () => {
    await storage.put('local.txt', bigContent)

    const buffer = await storage.get('local.txt')

    expect(buffer).toBeTruthy()
    expect(buffer.toString()).toBe(bigContent.toString())
  })

  it('should generate an url and temporary url to access the file content', async () => {
    await storage.put('local.txt', bigContent)

    const url = await storage.url('local.txt')
    const tempUrl = await storage.temporaryUrl('local.txt', 1000)

    expect(tempUrl).toBeTruthy()
    expect(url).toBe('https://cdn.secjs.io/storage/local/local.txt')

    expect(readdirSync(Path.storage('temp')).length).toBe(1)
    await sleep(1500)
    expect(existsSync(Path.storage('temp'))).toBe(true)
    expect(readdirSync(Path.storage('temp')).length).toBe(0)
  })

  it('should delete the file', async () => {
    await storage.put('local.txt', bigContent)
    const filePath = Path.storage('app/local/local.txt')

    expect(existsSync(filePath)).toBe(true)

    await storage.delete('local.txt')

    expect(existsSync(filePath)).toBe(false)
  })

  it('should copy the file', async () => {
    await storage.put('local.txt', bigContent)
    const filePath = Path.storage('app/local/local.txt')

    await storage.copy('local.txt', 'copy-of-local.txt')
    const copyPath = Path.storage('app/local/copy-of-local.txt')

    expect(existsSync(filePath)).toBe(true)
    expect(existsSync(copyPath)).toBe(true)
  })

  it('should move the file', async () => {
    await storage.put('local.txt', bigContent)
    const filePath = Path.storage('app/local/local.txt')

    await storage.move('local.txt', 'copy-of-local.txt')
    const copyPath = Path.storage('app/local/copy-of-local.txt')

    expect(existsSync(filePath)).toBe(false)
    expect(existsSync(copyPath)).toBe(true)
  })

  it('should be able to recreate driver instance with runtime configs', async () => {
    await storage.disk('local', { root: Path.storage('newApp/local') }).put('local.txt', bigContent)

    expect(existsSync(Path.storage('newApp/local/local.txt'))).toBe(true)

    await storage.disk('local', {}).put('local.txt', bigContent)

    expect(existsSync(Path.storage('app/local/local.txt'))).toBe(true)

    await Folder.safeRemove(Path.storage('newApp'))
  })

  afterEach(async () => {
    await Folder.safeRemove(Path.storage('app/local'))
  })
})
