import { PineconeClient, ScoredVector } from "@pinecone-database/pinecone";
import { Document } from "langchain/document";



const getEmbeddings = async (query: string): Promise<number[]> => {
  const response = await fetch(
    process.env.HUGGING_FACE_ENDPOINT!,
    {
      headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_ENDPOINT_API_TOKEN}`, "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({
        inputs: query
      }),
    }
  );
  const result = await response.json();
  const { embeddings } = result
  return embeddings as number[];
}

const getDocsFromEmbeddings = async (embeddings: number[], pinecone: PineconeClient): Promise<Document[] | null> => {
  const index = pinecone!.Index("crawl2");
  const queryRequest = {
    vector: embeddings,
    topK: 3,
    includeMetadata: true
  }
  try {
    const queryResult = await index.query({
      queryRequest
    })

    return queryResult.matches ? queryResult.matches.map((match: ScoredVector) => {
      return new Document({
        // @ts-ignore
        pageContent: match.metadata?.text,
        metadata: {
          ...match.metadata,
          score: match.score,
        },
      })
    }) : null
  } catch (e) {
    console.log("Error querying embeddings: ", e)
    throw (new Error(`Error querying embeddings: ${e}`,))
  }
}


export type Metadata = {
  url: string,
  text: string,
  chunk: string,
}

const getMatchesFromEmbeddings = async (embeddings: number[], pinecone: PineconeClient, topK: number): Promise<ScoredVector[]> => {
  const index = pinecone!.Index("crawl2");
  const queryRequest = {
    vector: embeddings,
    topK,
    includeMetadata: true
  }
  try {
    const queryResult = await index.query({
      queryRequest
    })
    return queryResult.matches?.map(match => ({
      ...match,
      metadata: match.metadata as Metadata
    })) || []
  } catch (e) {
    console.log("Error querying embeddings: ", e)
    throw (new Error(`Error querying embeddings: ${e}`,))
  }
}

export { getEmbeddings, getDocsFromEmbeddings, getMatchesFromEmbeddings }