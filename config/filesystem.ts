import { Env } from '@secjs/env'
import { Path } from '@secjs/utils'

export default {
  /*
  |--------------------------------------------------------------------------
  | Default Filesystem Disk
  |--------------------------------------------------------------------------
  |
  | Here you may specify the default filesystem disk that should be used
  | by the framework. The "local" disk, as well as a variety of cloud
  | based disks are available to your application.
  |
  */

  default: Env('FILESYSTEM_DISK', 'local'),

  /*
  |--------------------------------------------------------------------------
  | Filesystem Disks
  |--------------------------------------------------------------------------
  |
  | Here you may configure as many filesystem "disks" as you wish, and you
  | may even configure multiple disks of the same driver. Defaults have
  | been setup for each driver as an example of the required options.
  |
  */

  disks: {
    lib: {
      driver: 'lib',
      root: Path.storage('app/lib'),
      url: `${Env('APP_URL', '')}/storage/lib`,
    },
    local: {
      driver: 'local',
      root: Path.storage('app/local'),
      url: `${Env('APP_URL', '')}/storage/local`,
    },
    public: {
      driver: 'local',
      root: Path.storage('app/public'),
      url: `${Env('APP_URL', '')}/storage/public`,
    },
    s3: {
      driver: 's3',
      key: Env('AWS_KEY', ''),
      secret: Env('AWS_SECRET', ''),
      region: Env('AWS_REGION', ''),
      bucket: Env('AWS_BUCKET', ''),
      endpoint: Env('AWS_ENDPOINT', '')
    }
  },
}
