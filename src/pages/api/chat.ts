import { CallbackManager } from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models";
import { OpenAI } from "langchain/llms";
import { PromptTemplate } from "langchain/prompts";
import type { NextApiRequest, NextApiResponse } from "next";
import { summarizeLongDocument } from "./summarizer";
import {
  createPagesServerClient,
  SupabaseClient,
} from "@supabase/auth-helpers-nextjs";

import { ConversationLog } from "./conversationLog";
import { Metadata, getMatchesFromEmbeddings } from "./matches";
import { templates } from "./templates";

const llm = new OpenAI({});

const handleRequest = async ({
  prompt,
  userId,
  supabaseAuthedClient,
}: {
  prompt: string;
  userId: string;
  supabaseAuthedClient: SupabaseClient;
}) => {
  try {
    const channel = supabaseAuthedClient.channel(userId);
    const { data } = await supabaseAuthedClient
      .from("conversations")
      .insert({ speaker: "ai", user_id: userId })
      .select()
      .single()
      .throwOnError();
    const interactionId = data?.id;

    // Retrieve the conversation log and save the user's prompt
    const conversationLog = new ConversationLog(userId);
    const conversationHistory = await conversationLog.getConversation({
      limit: 10,
    });
    await conversationLog.addEntry({ entry: prompt, speaker: "user" });

    // Build an LLM chain that will improve the user prompt
    const inquiryChain = new LLMChain({
      llm,
      prompt: new PromptTemplate({
        template: templates.inquiryTemplate,
        inputVariables: ["userPrompt", "conversationHistory"],
      }),
    });
    const inquiryChainResult = await inquiryChain.call({
      userPrompt: prompt,
      conversationHistory,
    });
    const inquiry: string = inquiryChainResult.text;

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.send({
          type: "broadcast",
          event: "chat",
          payload: {
            event: "status",
            message: "Finding matches...",
          },
        });

        const matches = await getMatchesFromEmbeddings(
          inquiry,
          supabaseAuthedClient,
          2
        );

        const urls =
          matches &&
          Array.from(
            new Set(
              matches.map((match) => {
                const metadata = match.metadata as Metadata;
                const { url } = metadata;
                return url;
              })
            )
          );

        console.log(urls);

        const docs =
          matches &&
          Array.from(
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
          inputVariables: [
            "summaries",
            "question",
            "conversationHistory",
            "urls",
          ],
        });

        let i = 0;
        const chat = new ChatOpenAI({
          streaming: true,
          verbose: true,
          modelName: "gpt-3.5-turbo",
          callbackManager: CallbackManager.fromHandlers({
            async handleLLMNewToken(token) {
              await channel.send({
                type: "broadcast",
                event: "chat",
                payload: {
                  event: "response",
                  token,
                  interactionId,
                },
              });
            },
            async handleLLMEnd(result) {
              // Store answer in DB
              await supabaseAuthedClient
                .from("conversations")
                .update({ entry: result.generations[0][0].text })
                .eq("id", interactionId);
              await channel.send({
                type: "broadcast",
                event: "chat",
                payload: {
                  event: "responseEnd",
                  token: "END",
                  interactionId,
                },
              });
            },
          }),
        });

        const chain = new LLMChain({
          prompt: promptTemplate,
          llm: chat,
        });

        const allDocs = docs.join("\n");
        if (allDocs.length > 4000) {
          await channel.send({
            type: "broadcast",
            event: "chat",
            payload: {
              event: "status",
              message: `Just a second, forming final answer...`,
            },
          });
        }

        const summary =
          allDocs.length > 4000
            ? await summarizeLongDocument({ document: allDocs, inquiry })
            : allDocs;

        await chain.call({
          summaries: summary,
          question: prompt,
          conversationHistory,
          urls,
        });
      }
    });
  } catch (error) {
    //@ts-ignore
    console.error(error);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Create authenticated Supabase Client
  const supabase = createPagesServerClient(
    { req, res },
    {
      options: {
        realtime: {
          params: {
            eventsPerSecond: -1,
          },
        },
      },
    }
  );
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return res.status(401).json({
      error: "not_authenticated",
      description:
        "The user does not have an active session or is not authenticated",
    });

  // Run queries with RLS on the server
  const { body } = req;
  const { prompt } = body;
  await handleRequest({
    prompt,
    userId: session.user.id,
    supabaseAuthedClient: supabase,
  });
  res.status(200).json({ message: "started" });
}
