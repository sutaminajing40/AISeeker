import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
} from 'aws-lambda'
import multipart from 'aws-lambda-multipart-parser'
import { UploadedFile } from 'express-fileupload'

import { ApiGatewayResponse } from '../../responses/apiGatewayResponse'
import { PdfService } from '../../services/pdfService'
import { RequestWithFiles } from '../../utils/types'

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // イベントのボディをデコード
  const decodedEvent = {
    ...event,
    body: event.body
      ? Buffer.from(event.body, 'base64').toString('binary')
      : null,
  }

  // multipart/form-dataをパース
  const parsedFiles = multipart.parse(decodedEvent, true)

  // Express.jsのリクエストオブジェクトと同様の構造を持つオブジェクトを作成
  const req = { files: parsedFiles } as RequestWithFiles

  const res = new ApiGatewayResponse()

  return registPdf(req, res)
}

export async function registPdf(
  req: RequestWithFiles,
  res: ApiGatewayResponse,
): Promise<APIGatewayProxyResult> {
  const pdfService = new PdfService()

  try {
    if (!req.files || !('pdf' in req.files)) {
      return res
        .setStatus(400)
        .setMessage('登録するPDFファイルがありません。')
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

    const pdfSavePath = pdfService.savePdf(pdfFile.name, pdfFile.data)
    await pdfService.processPdf(pdfSavePath)

    return res
      .setStatus(200)
      .setMessage('PDFの登録が完了しました')
      .getResponse()
  } catch (error: any) {
    if (error.message === 'PDF already exists') {
      return res
        .setStatus(409)
        .setMessage('このPDFはすでに登録されています。')
        .getResponse()
    }

    console.error('PDF登録エラー:', error)
    return res
      .setStatus(500)
      .setMessage('PDFの処理に失敗しました。')
      .getResponse()
  }
}
