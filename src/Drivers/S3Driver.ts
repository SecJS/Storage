/*
 * @secjs/storage
 *
 * (c) João Lenon <lenon@secjs.com.br>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { S3 } from 'aws-sdk'
import { File } from '@secjs/utils'
import { Config } from '@secjs/config'
import { InternalServerException } from '@secjs/exceptions'
import { DriverContract } from '../Contracts/DriverContract'

export class S3Driver implements DriverContract {
  private s3Client: S3

  private readonly _url: string
  private readonly _key: string
  private readonly _region: string
  private readonly _secret: string
  private readonly _bucket: string
  private readonly _endpoint: string

  constructor(disk: string, configs: any = {}) {
    const s3Config = Config.get(`filesystem.disks.${disk}`)

    this._key = configs.key || s3Config.key
    this._region = configs.region || s3Config.region
    this._secret = configs.secret || s3Config.secret
    this._bucket = configs.bucket || s3Config.bucket
    this._endpoint = configs.endpoint || s3Config.endpoint

    this.s3Client = new S3({
      region: this._region,
      accessKeyId: this._key,
      secretAccessKey: this._secret,
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

    const params = {
      Bucket: this._bucket,
      Key: filePath,
      Body: content,
    }

    if (await this.exists(filePath))
      throw new InternalServerException(`File ${filePath} already exists`)

    await this.s3Client.upload(params).promise()
  }

  /**
   * Put File method
   *
   * @param folderPath Path of folder where file will be created
   * @param file An file instance to create the hash from it
   */
  async putFile(folderPath: string, file: File): Promise<string> {
    const params = {
      Bucket: this._bucket,
      Key: `${folderPath}/${file.base}`,
      Body: await file.getContent(),
    }

    await this.s3Client.upload(params).promise()

    return `${folderPath}/${file.base}`
  }

  /**
   * Exists method
   *
   * @param filePath Path of file to verify if exists
   */
  async exists(filePath: string): Promise<boolean> {
    const params = {
      Bucket: this._bucket,
      Key: filePath,
    }

    try {
      await this.s3Client.headObject(params).promise()

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Missing method
   *
   * @param filePath Path of file to verify if is missing
   */
  async missing(filePath: string): Promise<boolean> {
    const params = {
      Bucket: this._bucket,
      Key: filePath,
    }

    try {
      await this.s3Client.headObject(params).promise()

      return false
    } catch (error) {
      return true
    }
  }

  /**
   * Get method
   *
   * @param filePath Path of file to get the content
   */
  async get(filePath: string): Promise<Buffer> {
    const params = {
      Bucket: this._bucket,
      Key: filePath,
    }

    try {
      const object: any = await this.s3Client.getObject(params).promise()

      return object.Body
    } catch (error) {
      throw new InternalServerException(`File ${filePath} does not exist`)
    }
  }

  /**
   * Url method
   *
   * @param filePath Path of file to get the url
   */
  async url(filePath: string): Promise<string> {
    const params = {
      Bucket: this._bucket,
      Key: filePath,
      // 2 weeks
      Expires: 121e6,
    }

    if (await this.missing(filePath))
      throw new InternalServerException(`File ${filePath} does not exist`)

    return this.s3Client.getSignedUrlPromise('getObject', params)
  }

  /**
   * Url method
   *
   * @param filePath Path of file to get the temporary url
   * @param time The time in ms that the url will be available. Default is 900000 (15 minutes)
   */
  async temporaryUrl(filePath: string, time = 900000): Promise<string> {
    const params = {
      Bucket: this._bucket,
      Key: filePath,
      // Converts ms to second
      Expires: time / 1000,
    }

    if (await this.missing(filePath))
      throw new InternalServerException(`File ${filePath} does not exist`)

    return this.s3Client.getSignedUrlPromise('getObject', params)
  }

  /**
   * Delete method
   *
   * @param filePath Path of file to delete
   * @param force Force the delete of the file, even if it does not exists, will not throw errors
   */
  async delete(filePath: string, force = false): Promise<void> {
    const params = {
      Bucket: this._bucket,
      Key: filePath,
    }

    if (!force) {
      if (await this.missing(filePath))
        throw new InternalServerException(`File ${filePath} does not exist`)
    }

    await this.s3Client.deleteObject(params).promise()
  }

  /**
   * Copy method
   *
   * @param oldFilePath Path of file to copy
   * @param newFilePath Path where the file will be sent
   */
  async copy(oldFilePath: string, newFilePath: string): Promise<void> {
    const params = {
      Bucket: this._bucket,
      CopySource: `/${this._bucket}/${oldFilePath}`,
      Key: newFilePath,
    }

    if (await this.missing(oldFilePath))
      throw new InternalServerException(`File ${oldFilePath} does not exist`)

    await this.s3Client.copyObject(params).promise()
  }

  /**
   * Move method
   *
   * @param oldFilePath Path of file to move
   * @param newFilePath Path where the file will be sent
   */
  async move(oldFilePath: string, newFilePath: string): Promise<void> {
    const params = {
      Bucket: this._bucket,
      CopySource: `/${this._bucket}/${oldFilePath}`,
      Key: newFilePath,
    }

    if (await this.missing(oldFilePath))
      throw new InternalServerException(`File ${oldFilePath} does not exist`)

    await this.s3Client.copyObject(params).promise()
    await this.s3Client
      .deleteObject({ Bucket: params.Bucket, Key: oldFilePath })
      .promise()
  }
}
