// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { PineconeClient } from "@pinecone-database/pinecone";
import * as Ably from 'ably';
import { CallbackManager } from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from "langchain/llms";
import { PromptTemplate } from "langchain/prompts";
import type { NextApiRequest, NextApiResponse } from 'next';
import { uuid } from 'uuidv4';
import { summarizeLongDocument } from './summarizer';

import { ConversationLog } from './conversationLog';
import { Metadata, getMatchesFromEmbeddings } from './matches';
import { templates } from './templates';


const llm = new OpenAI({});
let pinecone: PineconeClient | null = null

const initPineconeClient = async () => {
  pinecone = new PineconeClient();
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
}

const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY });

const handleRequest = async ({ prompt, userId }: { prompt: string, userId: string }) => {
  if (!pinecone) {
    await initPineconeClient();
  }

  let summarizedCount = 0;

  try {
    const channel = ably.channels.get(userId);
    const interactionId = uuid()

    // Retrieve the conversation log and save the user's prompt
    const conversationLog = new ConversationLog(userId)
    const conversationHistory = await conversationLog.getConversation({ limit: 10 })
    await conversationLog.addEntry({ entry: prompt, speaker: "user" })

    // Build an LLM chain that will improve the user prompt
    const inquiryChain = new LLMChain({
      llm, prompt: new PromptTemplate({
        template: templates.inquiryTemplate,
        inputVariables: ["userPrompt", "conversationHistory"],
      })
    });
    const inquiryChainResult = await inquiryChain.call({ userPrompt: prompt, conversationHistory })
    const inquiry = inquiryChainResult.text

    console.log(inquiry)


    console.log(inquiry)


    // Embed the user's intent and query the Pinecone index
    const embedder = new OpenAIEmbeddings({
      modelName: "text-embedding-ada-002"
    });


    const embeddings = await embedder.embedQuery(inquiry);
    channel.publish({
      data: {
        event: "status",
        message: "Finding matches...",
      }
    })

    const matches = await getMatchesFromEmbeddings(embeddings, pinecone!, 2);



    const urls = matches && Array.from(new Set(matches.map(match => {
      const metadata = match.metadata as Metadata
      const { url } = metadata
      return url
    })))

    console.log(urls)


    const docs = matches && Array.from(
      matches.reduce((map, match) => {
        const metadata = match.metadata as Metadata;
        const { text, url } = metadata;
        if (!map.has(url)) {
          map.set(url, text);
        }
        return map;
      }, new Map())
    ).map(([_, text]) => text);


    const promptTemplate = new PromptTemplate({
      template: templates.qaTemplate,
      inputVariables: ["summaries", "question", "conversationHistory", "urls"],
    });


    const chat = new ChatOpenAI({
      streaming: true,
      verbose: true,
      modelName: "gpt-3.5-turbo",
      callbackManager: CallbackManager.fromHandlers({
        async handleLLMNewToken(token) {
          channel.publish({
            data: {
              event: "response",
              token: token,
              interactionId
            }
          })
        },
        async handleLLMEnd(result) {
          channel.publish({
            data: {
              event: "responseEnd",
              token: "END",
              interactionId
            }
          })
        }
      }),
    });

    const chain = new LLMChain({
      prompt: promptTemplate,
      llm: chat,
    });

    const allDocs = docs.join("\n")
    if (allDocs.length > 4000) {
      channel.publish({
        data: {
          event: "status",
          message: `Just a second, forming final answer...`,
        }
      })
    }

    const summary = allDocs.length > 4000 ? await summarizeLongDocument({ document: allDocs, inquiry }) : allDocs

    await chain.call({
      summaries: summary,
      question: prompt,
      conversationHistory,
      urls
    });



  } catch (error) {
    //@ts-ignore
    console.error(error)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body } = req;
  const { prompt, userId } = body;
  await handleRequest({ prompt, userId })
  res.status(200).json({ "message": "started" })
}
