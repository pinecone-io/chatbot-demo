import { LLMChain, PromptTemplate } from "langchain";
import { OpenAI } from "langchain/llms";
import { templates } from './templates';

const llm = new OpenAI({ concurrency: 10, temperature: 0, modelName: "gpt-3.5-turbo" });
const template = templates.summarizerTemplate;

const promptTemplate = new PromptTemplate({
  template,
  inputVariables: ["document", "inquiry"],
});

const chunkSubstr = (str: string, size: number) => {
  const numChunks = Math.ceil(str.length / size);
  return Array.from({ length: numChunks }, (_, i) => str.substring(i * size, (i + 1) * size));
}

const summarize = async (document: string, inquiry: string, onSummaryDone: Function) => {
  const chain = new LLMChain({
    prompt: promptTemplate,
    llm
  })

  try {
    const result = await chain.call({
      prompt: promptTemplate,
      document,
      inquiry
    })

    onSummaryDone(result.text)
    return result.text
  } catch (e) {
    console.log(e)
  }
}

const summarizeLongDocument = async (document: string, inquiry: string, onSummaryDone: Function): Promise<string> => {
  // Chunk document into 4000 character chunks
  try {
    if (document.length > 3000) {
      const chunks = chunkSubstr(document, 4000)
      let summarizedChunks: string[] = []
      for (const chunk of chunks) {
        const result = await summarize(chunk, inquiry, onSummaryDone)
        summarizedChunks.push(result)
      }

      const result = summarizedChunks.join("\n");

      if (result.length > 4000) {
        return await summarizeLongDocument(result, inquiry, onSummaryDone)
      } else
        return result
    } else {
      return document
    }
  } catch (e) {
    throw new Error(e as string)
  }
}

export { summarizeLongDocument };
