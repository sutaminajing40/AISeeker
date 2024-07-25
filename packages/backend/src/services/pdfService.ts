import fs from 'fs'
import path from 'path'

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { FaissStore } from '@langchain/community/vectorstores/faiss'
import { Document } from '@langchain/core/documents'

import { FAISS_INDEX_DIR, PDF_SAVE_DIR, TMP_DIR } from '../utils/constants'
import { embeddings } from '../utils/models'

import { S3Service } from './s3Service'

export class PdfService {
  private readonly INDEX_FILE_NAME = 'faiss.index'
  private pdfSaveDir = PDF_SAVE_DIR
  private faissIndexDir = FAISS_INDEX_DIR
  private s3Service: S3Service

  constructor() {
    this.s3Service = new S3Service()
  }

  public async getVectorStore(): Promise<FaissStore> {
    const indexPath = path.join(TMP_DIR, this.INDEX_FILE_NAME)

    try {
      await this.downloadAndSaveIndex(indexPath)
      const vectorStore = await this.loadVectorStore(indexPath)
      return vectorStore
    } catch (error) {
      throw new Error('ベクトルデータベースの取得に失敗しました。')
    } finally {
      await this.cleanupTempFile(indexPath)
    }
  }

  private async downloadAndSaveIndex(indexPath: string): Promise<void> {
    const indexData = await this.s3Service.getFromS3(
      `${this.faissIndexDir}/${this.INDEX_FILE_NAME}`,
    )
    fs.mkdirSync(TMP_DIR, { recursive: true })
    fs.writeFileSync(indexPath, indexData)
  }

  private async loadVectorStore(indexPath: string): Promise<FaissStore> {
    return await FaissStore.load(indexPath, embeddings)
  }

  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.warn('一時ファイルの削除に失敗しました:', error)
    }
  }

  public async deletePdf(): Promise<void> {
    await this.s3Service.deleteFromS3()
  }

  public async savePdf(fileName: string, pdfFileData: Buffer): Promise<string> {
    return await this.s3Service.uploadToS3(fileName, pdfFileData)
  }

  public async processPdf(fileName: string): Promise<void> {
    const pdfBuffer = await this.s3Service.getFromS3(fileName)
    const loader = new PDFLoader(pdfBuffer.toString())
    const docs = await loader.load()

    let vectorStore: FaissStore

    try {
      vectorStore = await FaissStore.load(this.faissIndexDir, embeddings)
    } catch (error) {
      vectorStore = await FaissStore.fromDocuments(
        [new Document({ pageContent: '0', metadata: {} })],
        embeddings,
      )
    }

    await vectorStore.addDocuments(docs)
    await vectorStore.save(this.faissIndexDir)
  }
}
