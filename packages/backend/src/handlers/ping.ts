import { APIGatewayProxyHandler } from 'aws-lambda'

import { ApiGatewayResponse } from '../responses/apiGatewayResponse'

export const handler: APIGatewayProxyHandler = async () => {
  const res = new ApiGatewayResponse()
  return res.setStatus(200).setMessage('Hello').getResponse()
}
