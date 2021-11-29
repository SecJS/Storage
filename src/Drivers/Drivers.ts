/*
 * @secjs/storage
 *
 * (c) João Lenon <lenon@secjs.com.br>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { S3Driver } from './S3Driver'
import { LocalDriver } from './LocalDriver'

export const Drivers = {
  s3: S3Driver,
  local: LocalDriver,
}
