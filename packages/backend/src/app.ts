import express from 'express'
import fileUpload from 'express-fileupload'
import { ping } from './controllers/sendPing'
import { registPdf } from './pdf-management/registPdf'
import dotenv from 'dotenv'
import { PORT } from './utils/constants'
import { deletePdf } from './pdf-management/deletePdf'

const app = express()
const port = PORT
dotenv.config()

app.use(fileUpload())

app.get('/api/ping', ping)

app.post('/api/pdf', registPdf)

app.delete('/api/pdf', deletePdf)

app.post('/api/query', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
