import { FileArray } from 'express-fileupload'

export type RequestWithFiles = Request & {
  files?: FileArray
}
