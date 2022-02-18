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
  private runtimeConfig: any
  private diskName: string
  private driver: DriverContract

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

  private createDriverInstance(diskName?: string) {
    diskName = diskName || Config.get('filesystem.default')

    const diskConfig = Config.get(`filesystem.disks.${diskName}`)

    if (!diskConfig) {
      throw new NotImplementedException(
        `Disk ${diskName} is not configured inside filesystem.disks object from config/filesystem file`,
      )
    }

    if (!Drivers[diskConfig.driver]) {
      throw new NotImplementedException(
        `Driver ${diskConfig.driver} does not exist, use Storage.build method to create a new driver`,
      )
    }

    this.diskName = diskName

    return new Drivers[diskConfig.driver](diskName, this.runtimeConfig)
  }

  constructor(runtimeConfig: any = {}) {
    this.runtimeConfig = runtimeConfig
    this.driver = this.createDriverInstance()
  }

  disk(disk: string, runtimeConfig?: any): Storage {
    if (runtimeConfig) this.runtimeConfig = runtimeConfig

    this.driver = this.createDriverInstance(disk)

    return this
  }

  async put(name: string, content: any): Promise<void> {
    Storage.verifyAbsolute(name)

    await this.driver.put(name, content)
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

    const path = await this.driver.putFile(folder, file)
    await file.remove()

    return path
  }

  async exists(name: string): Promise<boolean> {
    Storage.verifyAbsolute(name)

    return this.driver.exists(name)
  }

  async missing(name: string): Promise<boolean> {
    Storage.verifyAbsolute(name)

    return this.driver.missing(name)
  }

  async get(name: string): Promise<Buffer> {
    Storage.verifyAbsolute(name)

    return this.driver.get(name)
  }

  async url(name: string): Promise<string> {
    Storage.verifyAbsolute(name)

    return this.driver.url(name)
  }

  async temporaryUrl(name: string, time = 90000): Promise<string> {
    Storage.verifyAbsolute(name)

    return this.driver.temporaryUrl(name, time)
  }

  async delete(name: string, force?: boolean): Promise<void> {
    Storage.verifyAbsolute(name)

    await this.driver.delete(name, force)
  }

  async copy(oldFileName: string, newFileName: string) {
    Storage.verifyAbsolute(oldFileName)
    Storage.verifyAbsolute(newFileName)

    await this.driver.copy(oldFileName, newFileName)
  }

  async move(oldFileName: string, newFileName: string) {
    Storage.verifyAbsolute(oldFileName)
    Storage.verifyAbsolute(newFileName)

    await this.driver.move(oldFileName, newFileName)
  }

  private static verifyAbsolute(name: string) {
    if (isAbsolute(name))
      throw new InternalServerException(
        `The path ${name} is an absolute path. Only file names and sub paths can be used within storage class`,
      )
  }
}
