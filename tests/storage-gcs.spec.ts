import { join } from 'path'
import { tmpdir } from 'os'
import { Config } from '@secjs/config'
import { Storage } from '../src/Storage'
import { promises, readdirSync } from 'fs'

describe('\n Storage GCS Class', () => {
  let storage: Storage = null
  // 1 MB of content
  const name = 'testing/testing.txt'
  const bigContent = Buffer.alloc(Math.max(0, 1024 * 1024 - 2), 'l')

  beforeEach(async () => {
    await new Config().load()

    storage = new Storage().changeDefaultDisk('gcs')
  })

  it('should store a brand new file', async () => {
    const path = await storage.putFile('unique-ids', bigContent, 'txt')

    const tmpPath = await promises.mkdtemp(join(tmpdir(), process.env.APP_NAME))

    expect(readdirSync(tmpPath).length).toBe(0)
    expect(await storage.exists(path)).toBe(true)
  })

  it('should get the file content in buffer', async () => {
    await storage.put(name, bigContent)

    const buffer = await storage.get(name)

    expect(buffer).toBeTruthy()
    expect(buffer.toString()).toBe(bigContent.toString())
  }, 10000)

  it('should generate an url and temporary url to access the file content', async () => {
    await storage.put(name, bigContent)

    const url = await storage.url(name)
    const tempUrl = await storage.temporaryUrl(name, 10000)

    expect(url).toBeTruthy()
    expect(tempUrl).toBeTruthy()
  }, 10000)

  it('should delete the file', async () => {
    await storage.put(name, bigContent)

    expect(await storage.exists(name)).toBe(true)

    await storage.delete(name)

    expect(await storage.exists(name)).toBe(false)
  }, 10000)

  it('should copy the file', async () => {
    await storage.put(name, bigContent)

    await storage.copy(name, 'testing/copy-of-testing.txt')

    expect(await storage.exists(name)).toBe(true)
    expect(await storage.exists('testing/copy-of-testing.txt')).toBe(true)
  }, 10000)

  afterEach(async () => {
    await storage.delete(name, true)
    await storage.delete('testing/move-of-testing.txt', true)
    await storage.delete('testing/copy-of-testing.txt', true)
  })
})
