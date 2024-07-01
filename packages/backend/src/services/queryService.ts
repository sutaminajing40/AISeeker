import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { pull } from 'langchain/hub'

import { PdfService } from '../services/PdfService'
import { llm } from '../utils/models'

export class QueryService {
  public async sendQuery(query: string) {
    // ベクトルデータベースの読み込み
    const pdfService = new PdfService()
    const vectorStore = await pdfService.getVectorStore()

    // クエリを投げる
    const vectorStoreRetriever = vectorStore.asRetriever()
    const prompt = await pull<ChatPromptTemplate>('rlm/rag-prompt')

    const ragChain = await createStuffDocumentsChain({
      llm,
      prompt,
      outputParser: new StringOutputParser(),
    })

    const retrievedDocs = await vectorStoreRetriever.getRelevantDocuments(query)

    const result = await ragChain.invoke({
      question: query,
      context: retrievedDocs,
    })

    return result
  }
}
