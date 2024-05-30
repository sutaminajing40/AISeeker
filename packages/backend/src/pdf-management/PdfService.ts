import fs from 'fs'

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { FaissStore } from '@langchain/community/vectorstores/faiss'
import { OpenAIEmbeddings } from '@langchain/openai'
import { Document } from '@langchain/core/documents'

import { PDF_SAVE_DIR, FAISS_INDEX_DIR } from '../utils/constants'

export class PdfService {
  private pdfSaveDir = PDF_SAVE_DIR
  private faissIndexDir = FAISS_INDEX_DIR

  constructor() {
    if (!fs.existsSync(this.pdfSaveDir)) {
      fs.mkdirSync(this.pdfSaveDir, { recursive: true })
    }
    if (!fs.existsSync(this.faissIndexDir)) {
      fs.mkdirSync(this.faissIndexDir, { recursive: true })
    }
  }

  public deletePdf(): void {
    fs.rmSync(this.pdfSaveDir, { recursive: true })
    fs.rmSync(this.faissIndexDir, { recursive: true })
  }

  public savePdf(fileName: string, pdfFileData: Buffer): string {
    const pdfSavePath = `${this.pdfSaveDir}/${fileName}`
    if (fs.readdirSync(this.pdfSaveDir).includes(fileName)) {
      throw new Error()
    }
    fs.writeFileSync(pdfSavePath, pdfFileData)
    return pdfSavePath
  }

  public async processPdf(pdfSavePath: string): Promise<void> {
    const loader = new PDFLoader(pdfSavePath)
    const docs = await loader.load()
    const faissIndexPath = `${this.faissIndexDir}/faiss.index`
    let vectorStore: FaissStore

    if (fs.existsSync(faissIndexPath)) {
      vectorStore = await FaissStore.load(
        this.faissIndexDir,
        new OpenAIEmbeddings(),
      )
    } else {
      vectorStore = await FaissStore.fromDocuments(
        [new Document({ pageContent: '0', metadata: {} })],
        new OpenAIEmbeddings(),
      )
    }
    await vectorStore.addDocuments(docs, { ids: [pdfSavePath] })
    await vectorStore.save(this.faissIndexDir)
  }
}
