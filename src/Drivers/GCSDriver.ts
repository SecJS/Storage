/**
 * @secjs/storage
 *
 * (c) João Lenon <lenon@secjs.com.br>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Config } from '@secjs/config'
import { File } from '@secjs/utils'
import { Storage } from '@google-cloud/storage'
import { InternalServerException } from '@secjs/exceptions'
import { DriverContract } from '../Contracts/DriverContract'
import { promises } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export class GCSDriver implements DriverContract {
  private gcsClient: Storage

  private readonly _url: string
  private readonly _bucket: string
  private readonly _project: string
  private readonly _secret: string

  constructor(disk: string, configs: any = {}) {
    const gcsConfig = Config.get(`filesystem.disks.${disk}`)

    this._url = configs.url || gcsConfig.url
    this._bucket = configs.bucket || gcsConfig.bucket
    this._project = configs.project || gcsConfig.project
    this._secret = configs.secret || gcsConfig.secret

    this.gcsClient = new Storage({
      projectId: this._project,
      keyFilename: this._secret,
    })
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

    const tmpDir = await promises.mkdtemp(join(tmpdir(), process.env.APP_NAME))

    const file = await new File(
      `${tmpDir}/${filePath}`,
      content,
      false,
    ).create()

    await this.gcsClient
      .bucket(this._bucket)
      .upload(file.path, {
        destination: filePath,
      })
      .then(() => file.remove())
  }

  /**
   * Put File method
   *
   * @param folderPath Path of folder where file will be created
   * @param file An file instance to create the hash from it
   */
  async putFile(folderPath: string, file: File): Promise<string> {
    const bucket = this.gcsClient.bucket(this._bucket)

    const fileName = `${folderPath}/${file.base}`

    await bucket.upload(file.path, { destination: fileName })

    return fileName
  }

  /**
   * Exists method
   *
   * @param filePath Path of file to verify if exists
   */
  async exists(filePath: string): Promise<boolean> {
    const [exists] = await this.gcsClient
      .bucket(this._bucket)
      .file(filePath)
      .exists()

    return exists
  }

  /**
   * Missing method
   *
   * @param filePath Path of file to verify if is missing
   */
  async missing(filePath: string): Promise<boolean> {
    const [exists] = await this.gcsClient
      .bucket(this._bucket)
      .file(filePath)
      .exists()

    return !exists
  }

  /**
   * Get method
   *
   * @param filePath Path of file to get the content
   */
  async get(filePath: string): Promise<Buffer> {
    if (await this.missing(filePath)) {
      throw new InternalServerException(`File ${filePath} does not exist`)
    }

    return new Promise((resolve, reject) => {
      const file = this.gcsClient
        .bucket(this._bucket)
        .file(filePath)
        .createReadStream()

      const chunks = []

      file.on('data', chunk => chunks.push(chunk))
      file.on('end', () => resolve(Buffer.concat(chunks)))
      file.on('error', err => reject(err))
    })
  }

  /**
   * Url method
   *
   * @param filePath Path of file to get the url
   */
  async url(filePath: string): Promise<string> {
    if (await this.missing(filePath)) {
      throw new InternalServerException(`File ${filePath} does not exist`)
    }

    const options = {
      version: 'v2',
      action: 'read',
      // Two weeks
      expires: Date.now() + 121e6 * 60 * 60,
    }

    const [url] = await this.gcsClient
      .bucket(this._bucket)
      .file(filePath)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .getSignedUrl(options)

    return url
  }

  /**
   * Url method
   *
   * @param filePath Path of file to get the temporary url
   * @param time The time in ms that the url will be available. Default is 900000 (15 minutes)
   */
  async temporaryUrl(filePath: string, time = 900000): Promise<string> {
    if (await this.missing(filePath)) {
      throw new InternalServerException(`File ${filePath} does not exist`)
    }

    const options = {
      version: 'v2',
      action: 'read',
      expires: Date.now() + time * 60 * 60,
    }

    const [url] = await this.gcsClient
      .bucket(this._bucket)
      .file(filePath)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .getSignedUrl(options)

    return url
  }

  /**
   * Delete method
   *
   * @param filePath Path of file to delete
   * @param force Force the delete of the file, even if it does not exists, will not throw errors
   */
  async delete(filePath: string, force = false): Promise<void> {
    if (!force) {
      if (await this.missing(filePath)) {
        throw new InternalServerException(`File ${filePath} does not exist`)
      }
    }

    await this.gcsClient.bucket(this._bucket).file(filePath).delete({
      ignoreNotFound: force,
    })
  }

  /**
   * Copy method
   *
   * @param oldFilePath Path of file to copy
   * @param newFilePath Path where the file will be sent
   */
  async copy(oldFilePath: string, newFilePath: string): Promise<void> {
    if (await this.missing(oldFilePath)) {
      throw new InternalServerException(`File ${oldFilePath} does not exist`)
    }

    await this.gcsClient
      .bucket(this._bucket)
      .file(oldFilePath)
      .copy(this.gcsClient.bucket(this._bucket).file(newFilePath))
  }

  /**
   * Move method
   *
   * @param oldFilePath Path of file to move
   * @param newFilePath Path where the file will be sent
   */
  async move(oldFilePath: string, newFilePath: string): Promise<void> {
    if (await this.missing(oldFilePath)) {
      throw new InternalServerException(`File ${oldFilePath} does not exist`)
    }

    await this.gcsClient
      .bucket(this._bucket)
      .file(oldFilePath)
      .move(newFilePath)
  }
}
