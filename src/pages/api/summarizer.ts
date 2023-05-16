import { OpenAI } from "langchain/llms";
import { templates } from './templates'
import { LLMChain, PromptTemplate } from "langchain";
import Bottleneck from "bottleneck";
import { StructuredOutputParser } from "langchain/output_parsers";

const llm = new OpenAI({ concurrency: 10, temperature: 0, modelName: "gpt-3.5-turbo" });

const { summarizerTemplate, summarizerDocumentTemplate } = templates;

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  answer: "answer to the user's question",
  source: "source used to answer the user's question, should be a website.",
});

const formatInstructions = parser.getFormatInstructions();


const limiter = new Bottleneck({
  minTime: 5050
});

console.log(summarizerDocumentTemplate.length)
const chunkSubstr = (str: string, size: number) => {
  const numChunks = Math.ceil(str.length / size)
  const chunks = new Array(numChunks)

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size)
  }

  return chunks
}

const summarize = async ({ document, inquiry, onSummaryDone }: { document: string, inquiry?: string, onSummaryDone?: Function }) => {
  console.log("summarizing ", document.length)
  const promptTemplate = new PromptTemplate({
    template: inquiry ? summarizerTemplate : summarizerDocumentTemplate,
    inputVariables: inquiry ? ["document", "inquiry"] : ["document"],
  });
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

    console.log(result)

    onSummaryDone && onSummaryDone(result.text)
    return result.text
  } catch (e) {
    console.log(e)
  }
}

const rateLimitedSummarize = limiter.wrap(summarize)

const summarizeLongDocument = async ({ document, inquiry, onSummaryDone }: { document: string, inquiry?: string, onSummaryDone?: Function }): Promise<string> => {
  // Chunk document into 4000 character chunks
  const templateLength = inquiry ? summarizerTemplate.length : summarizerDocumentTemplate.length
  try {
    if ((document.length + templateLength) > 4000) {
      console.log("document is long and has to be shortened", document.length)
      const chunks = chunkSubstr(document, 4000 - templateLength - 1)
      let summarizedChunks: string[] = []
      summarizedChunks = await Promise.all(
        chunks.map(async (chunk) => {
          let result
          if (inquiry) {
            result = await rateLimitedSummarize({ document: chunk, inquiry, onSummaryDone })
          } else {
            result = await rateLimitedSummarize({ document: chunk, onSummaryDone })
          }
          return result
        })
      )

      const result = summarizedChunks.join("\n");
      console.log(result.length)

      if ((result.length + templateLength) > 4000) {
        console.log("document is STILL long and has to be shortened further")
        return await summarizeLongDocument({ document: result, inquiry, onSummaryDone })
      } else {
        console.log("done")
        return result
      }

    } else {
      return document
    }
  } catch (e) {
    throw new Error(e as string)
  }
}

export { summarizeLongDocument }