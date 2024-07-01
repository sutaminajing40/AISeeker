import { APIGatewayProxyHandler } from 'aws-lambda'

import { ApiGatewayResponse } from '../../responses/apiGatewayResponse'
import { QueryService } from '../../services/QueryService'

export const handler: APIGatewayProxyHandler = async (event) => {
  const res = new ApiGatewayResponse()
  const query = JSON.parse(event.body || '{}').query
  if (!query) {
    return res.setStatus(400).setMessage('クエリがありません。').getResponse()
  }

  const queryService = new QueryService()
  try {
    const result = await queryService.sendQuery(query)
    return res.setStatus(200).setMessage(JSON.stringify(result)).getResponse()
  } catch (err) {
    console.error('Query Error:', err)
    return res
      .setStatus(500)
      .setMessage('クエリの処理に失敗しました。')
      .getResponse()
  }
}
