import fs from 'fs'

import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
} from 'aws-lambda'
import multipart from 'aws-lambda-multipart-parser'
import { UploadedFile } from 'express-fileupload'

import { ApiGatewayResponse } from '../../responses/apiGatewayResponse'
import { PdfService } from '../../services/PdfService'
import { RequestWithFiles } from '../../utils/types'

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
) => {
  // イベントのボディをデコード
  const decodedEvent = {
    ...event,
    body: event.body
      ? Buffer.from(event.body, 'base64').toString('binary')
      : null,
  }

  // multipart/form-dataをパース
  const parsedFiles = multipart.parse(decodedEvent, true)

  // これにより、Express.jsのリクエストオブジェクトと同様の構造を持つオブジェクトを作成
  const req = { files: parsedFiles } as RequestWithFiles

  const res = new ApiGatewayResponse()

  return registPdf(req, res)
}

export async function registPdf(
  req: RequestWithFiles,
  res: ApiGatewayResponse,
): Promise<APIGatewayProxyResult> {
  if (!req.files || !('pdf' in req.files)) {
    return res
      .setStatus(400)
      .setMessage('PDFファイルがありません。')
      .getResponse()
  }

  const pdfFile = req.files.pdf as UploadedFile
  if (Array.isArray(pdfFile) || pdfFile.mimetype !== 'application/pdf') {
    return res
      .setStatus(400)
      .setMessage(
        '不正なコンテンツタイプです。application/pdfである必要があります。',
      )
      .getResponse()
  }

  const fileName = pdfFile.name
  const pdfFileData = pdfFile.data
  const pdfService = new PdfService()

  try {
    const pdfSavePath = pdfService.savePdf(fileName, pdfFileData)
    try {
      await pdfService.processPdf(pdfSavePath)
      return res
        .setStatus(200)
        .setMessage('PDFの登録が完了しました')
        .getResponse()
    } catch (processErr: any) {
      // 処理中にエラーが発生した場合、保存したPDFファイルを削除する
      fs.unlinkSync(pdfSavePath)
      return res
        .setStatus(500)
        .setMessage('PDFの処理に失敗しました。')
        .getResponse()
    }
  } catch (saveErr: any) {
    return res
      .setStatus(409)
      .setMessage('このPDFはすでに登録されています。')
      .getResponse()
  }
}
