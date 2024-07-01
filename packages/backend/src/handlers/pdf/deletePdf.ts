import { APIGatewayProxyHandler } from 'aws-lambda'

import { ApiGatewayResponse } from '../../responses/apiGatewayResponse'
import { PdfService } from '../../services/pdfService'

export const handler: APIGatewayProxyHandler = async () => {
  const res = new ApiGatewayResponse()
  try {
    const pdfService = new PdfService()
    pdfService.deletePdf()
    return res
      .setStatus(200)
      .setMessage('PDFの削除が完了しました。')
      .getResponse()
  } catch (err) {
    console.error('Delete Error:', err)
    return res
      .setStatus(500)
      .setMessage('PDFの削除に失敗しました。')
      .getResponse()
  }
}
