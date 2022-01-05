/*
 * @secjs/storage
 *
 * (c) lenon@secjs.com.br <João Lenon>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {
  InternalServerException,
  NotImplementedException,
} from '@secjs/exceptions'

import { tmpdir } from 'os'
import { promises } from 'fs'
import { File } from '@secjs/utils'
import { Config } from '@secjs/config'
import { isAbsolute, join } from 'path'
import { Drivers } from './Drivers/Drivers'
import { DriverContract } from './Contracts/DriverContract'

export class Storage {
  private configs: any = {}
  private _tempDriver: DriverContract | null = null
  private _defaultDriver: DriverContract | null = null

  static build(
    name: string,
    driver: new (disk: string, configs?: any) => DriverContract,
  ) {
    if (Drivers[name])
      throw new InternalServerException(`Driver ${name} already exists`)

    Drivers[name] = driver
  }

  static get drivers(): string[] {
    return Object.keys(Drivers)
  }

  constructor() {
    const defaultDisk = Config.get('filesystem.default')
    const diskConfig = Config.get(`filesystem.disks.${defaultDisk}`)

    this._defaultDriver = new Drivers[diskConfig.driver](defaultDisk)
  }

  resetConfigs(): Storage {
    this.configs = {}

    const defaultDisk = Config.get('filesystem.default')
    const diskConfig = Config.get(`filesystem.disks.${defaultDisk}`)

    this._defaultDriver = new Drivers[diskConfig.driver](
      defaultDisk,
      this.configs,
    )

    return this
  }

  removeConfig(key: string): Storage {
    delete this.configs[key]

    const defaultDisk = Config.get('filesystem.default')
    const diskConfig = Config.get(`filesystem.disks.${defaultDisk}`)

    this._defaultDriver = new Drivers[diskConfig.driver](
      defaultDisk,
      this.configs,
    )

    return this
  }

  addConfig(key: string, value: any): Storage {
    this.configs[key] = value

    const defaultDisk = Config.get('filesystem.default')
    const diskConfig = Config.get(`filesystem.disks.${defaultDisk}`)

    this._defaultDriver = new Drivers[diskConfig.driver](
      defaultDisk,
      this.configs,
    )

    return this
  }

  changeDefaultDisk(disk: string): Storage {
    const diskConfig = Config.get(`filesystem.disks.${disk}`)

    if (!diskConfig)
      throw new NotImplementedException(
        `Disk ${disk} is not configured inside filesystem.disks object from config/filesystem file`,
      )

    if (!Drivers[diskConfig.driver])
      throw new NotImplementedException(
        `Driver ${diskConfig.driver} does not exist, use Storage.build method to create a new driver`,
      )

    this._defaultDriver = new Drivers[diskConfig.driver](disk, this.configs)

    return this
  }

  disk(disk: string): Storage {
    const diskConfig = Config.get(`filesystem.disks.${disk}`)

    if (!diskConfig)
      throw new NotImplementedException(
        `Disk ${disk} is not configured inside filesystem.disks object from config/filesystem file`,
      )

    if (!Drivers[diskConfig.driver])
      throw new NotImplementedException(
        `Driver ${diskConfig.driver} does not exist, use Storage.build method to create a new driver`,
      )

    this._tempDriver = new Drivers[diskConfig.driver](disk, this.configs)

    return this
  }

  async put(name: string, content: any): Promise<void> {
    Storage.verifyAbsolute(name)

    await this._driver.put(name, content)

    this._tempDriver = null
  }

  async putFile(
    folder: string,
    content: any,
    extension: string,
  ): Promise<string> {
    Storage.verifyAbsolute(folder)

    const tmpDir = await promises.mkdtemp(join(tmpdir(), process.env.APP_NAME))

    const file = await new File(
      `${tmpDir}/mock.${extension}`,
      content,
      true,
    ).create()

    const path = await this._driver.putFile(folder, file)
    await file.remove()

    this._tempDriver = null

    return path
  }

  async exists(name: string): Promise<boolean> {
    Storage.verifyAbsolute(name)
    const exists = await this._driver.exists(name)

    this._tempDriver = null

    return exists
  }

  async missing(name: string): Promise<boolean> {
    Storage.verifyAbsolute(name)
    const missing = await this._driver.missing(name)

    this._tempDriver = null

    return missing
  }

  async get(name: string): Promise<Buffer> {
    Storage.verifyAbsolute(name)
    const buffer = await this._driver.get(name)

    this._tempDriver = null

    return buffer
  }

  async url(name: string): Promise<string> {
    Storage.verifyAbsolute(name)
    const url = await this._driver.url(name)

    this._tempDriver = null

    return url
  }

  async temporaryUrl(name: string, time = 90000): Promise<string> {
    Storage.verifyAbsolute(name)
    const tempUrl = await this._driver.temporaryUrl(name, time)

    this._tempDriver = null

    return tempUrl
  }

  async delete(name: string, force?: boolean): Promise<void> {
    Storage.verifyAbsolute(name)
    await this._driver.delete(name, force)

    this._tempDriver = null
  }

  async copy(oldFileName: string, newFileName: string) {
    Storage.verifyAbsolute(oldFileName)
    Storage.verifyAbsolute(newFileName)
    await this._driver.copy(oldFileName, newFileName)

    this._tempDriver = null
  }

  async move(oldFileName: string, newFileName: string) {
    Storage.verifyAbsolute(oldFileName)
    Storage.verifyAbsolute(newFileName)
    await this._driver.move(oldFileName, newFileName)

    this._tempDriver = null
  }

  private get _driver(): DriverContract {
    if (this._tempDriver) return this._tempDriver

    return this._defaultDriver
  }

  private static verifyAbsolute(name: string) {
    if (isAbsolute(name))
      throw new InternalServerException(
        `The path ${name} is an absolute path. Only file names and sub paths can be used within storage class`,
      )
  }
}
