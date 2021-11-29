/*
 * @secjs/storage
 *
 * (c) João Lenon <lenon@secjs.com.br>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { File } from '@secjs/utils'

export interface DriverContract {
  /**
   * Put method
   *
   * @param filePath Path of file where the content will be put
   * @param content Content to put in file
   */
  put(filePath: string, content: any): Promise<void>

  /**
   * Put File method
   *
   * @param folderPath Path of folder where file will be created
   * @param file An file instance to create the hash from it
   */
  putFile(folderPath: string, file: File): Promise<string>

  /**
   * Exists method
   *
   * @param filePath Path of file to verify if exists
   */
  exists(filePath: string): Promise<boolean>

  /**
   * Missing method
   *
   * @param filePath Path of file to verify if is missing
   */
  missing(filePath: string): Promise<boolean>

  /**
   * Get method
   *
   * @param filePath Path of file to get the content
   */
  get(filePath: string): Promise<Buffer>

  /**
   * Url method
   *
   * @param filePath Path of file to get the url
   */
  url(filePath: string): Promise<string>

  /**
   * Url method
   *
   * @param filePath Path of file to get the temporary url
   * @param time The time in ms that the url will be available. Default is 900000 (15 minutes)
   */
  temporaryUrl(filePath: string, time?: number): Promise<string>

  /**
   * Delete method
   *
   * @param filePath Path of file to delete
   * @param force Force the delete of the file, even if it does not exists, will not throw errors
   */
  delete(filePath: string, force?: boolean): Promise<void>

  /**
   * Copy method
   *
   * @param oldFilePath Path of file to copy
   * @param newFilePath Path where the file will be sent
   */
  copy(oldFilePath: string, newFilePath: string): Promise<void>

  /**
   * Move method
   *
   * @param oldFilePath Path of file to move
   * @param newFilePath Path where the file will be sent
   */
  move(oldFilePath: string, newFilePath: string): Promise<void>
}

interface DriverConstructor {
  new (disk: string, ...args): DriverContract
}

declare let DriverContract: DriverConstructor
