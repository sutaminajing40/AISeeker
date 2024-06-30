import { APIGatewayProxyHandler } from 'aws-lambda'

import { PdfService } from '../../services/PdfService'

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const pdfService = new PdfService()
    pdfService.deletePdf()
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'PDFの削除が完了しました。' }),
    }
  } catch (err) {
    console.error('Delete Error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'PDFの削除に失敗しました。' }),
    }
  }
}
