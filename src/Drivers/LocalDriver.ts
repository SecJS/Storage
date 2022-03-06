/**
 * @secjs/storage
 *
 * (c) João Lenon <lenon@secjs.com.br>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { promises } from 'fs'
import { File, Config } from '@secjs/utils'
import { InternalServerException } from '@secjs/exceptions'
import { DriverContract } from '../Contracts/DriverContract'

export class LocalDriver implements DriverContract {
  private readonly _url: string
  private readonly _root: string

  constructor(disk: string, configs: any = {}) {
    this._url = configs.url || Config.get(`filesystem.disks.${disk}.url`)
    this._root = configs.root || Config.get(`filesystem.disks.${disk}.root`)
  }

  private concat(filePath: string) {
    return `${this._root}/${filePath}`
  }

  /**
   * Put method
   *
   * @param filePath Path of file where the content will be put
   * @param content Content to put in file
   */
  async put(filePath: string, content: string | Buffer): Promise<void> {
    content =
      typeof content === 'string' ? Buffer.from(content, 'utf-8') : content

    const file = new File(this.concat(filePath), content)

    if (file.originalFileExists)
      throw new InternalServerException(`File ${filePath} already exists`)

    await file.create()
  }

  /**
   * Put File method
   *
   * @param folderPath Path of folder where file will be created
   * @param file An file instance to create the hash from it
   */
  async putFile(folderPath: string, file: File): Promise<string> {
    const copy = await file.copy(this.concat(`${folderPath}/${file.base}`), {
      mockedValues: true,
    })

    return `${folderPath}/${copy.base}`
  }

  /**
   * Exists method
   *
   * @param filePath Path of file to verify if exists
   */
  async exists(filePath: string): Promise<boolean> {
    const file = new File(this.concat(filePath), Buffer.from(''))

    return file.originalFileExists
  }

  /**
   * Missing method
   *
   * @param filePath Path of file to verify if is missing
   */
  async missing(filePath: string): Promise<boolean> {
    const file = new File(this.concat(filePath), Buffer.from(''))

    return !file.originalFileExists
  }

  /**
   * Get method
   *
   * @param filePath Path of file to get the content
   */
  async get(filePath: string): Promise<Buffer> {
    const file = new File(this.concat(filePath))

    if (!file.originalFileExists)
      throw new InternalServerException(`File ${filePath} does not exist`)

    return file.getContent()
  }

  /**
   * Url method
   *
   * @param filePath Path of file to get the url
   */
  async url(filePath: string): Promise<string> {
    const file = new File(this.concat(filePath))

    if (!file.originalFileExists)
      throw new InternalServerException(`File ${filePath} does not exist`)

    return `${this._url}/${file.base}`
  }

  /**
   * Url method
   *
   * @param filePath Path of file to get the temporary url
   * @param time The time in ms that the url will be available. Default is 900000 (15 minutes)
   */
  async temporaryUrl(filePath: string, time = 900000): Promise<string> {
    const file = await new File(this.concat(filePath))

    if (!file.originalFileExists)
      throw new InternalServerException(`File ${filePath} does not exist`)

    const copy = await file.copy(`storage/temp/${filePath}`, {
      mockedValues: true,
    })

    setTimeout(() => copy.remove(), time)

    return `${this._url}/temp/${copy.base}`
  }

  /**
   * Delete method
   *
   * @param filePath Path of file to delete
   * @param force Force the delete of the file, even if it does not exists, will not throw errors
   */
  async delete(filePath: string, force = false): Promise<void> {
    const file = new File(this.concat(filePath))

    if (!file.originalFileExists && !force)
      throw new InternalServerException(`File ${filePath} does not exist`)

    await promises.rm(this.concat(filePath), { force })
  }

  /**
   * Copy method
   *
   * @param oldFilePath Path of file to copy
   * @param newFilePath Path where the file will be sent
   */
  async copy(oldFilePath: string, newFilePath: string): Promise<void> {
    const file = new File(this.concat(oldFilePath))

    if (!file.originalFileExists)
      throw new InternalServerException(`File ${oldFilePath} does not exist`)

    await file.copy(this.concat(newFilePath))
  }

  /**
   * Move method
   *
   * @param oldFilePath Path of file to move
   * @param newFilePath Path where the file will be sent
   */
  async move(oldFilePath: string, newFilePath: string): Promise<void> {
    const file = new File(this.concat(oldFilePath))

    if (!file.originalFileExists)
      throw new InternalServerException(`File ${oldFilePath} does not exist`)

    await file.move(this.concat(newFilePath))
  }
}
