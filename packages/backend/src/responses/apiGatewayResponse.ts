import { APIGatewayProxyResult } from 'aws-lambda'

export class ApiGatewayResponse {
  private statusCode: number = 200
  private message: string = ''

  setStatus(code: number): this {
    this.statusCode = code
    return this
  }

  setMessage(message: string): this {
    this.message = message
    return this
  }

  getResponse(): APIGatewayProxyResult {
    return {
      statusCode: this.statusCode,
      body: JSON.stringify({ message: this.message }),
    }
  }
}
