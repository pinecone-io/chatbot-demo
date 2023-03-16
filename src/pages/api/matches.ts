import { PineconeClient, ScoredVector } from "@pinecone-database/pinecone";

export type Metadata = {
  url: string,
  text: string,
  chunk: string,
}

const getMatchesFromEmbeddings = async (embeddings: number[], pinecone: PineconeClient, topK: number): Promise<ScoredVector[]> => {
  if (!process.env.PINECONE_INDEX_NAME) {
    throw (new Error("PINECONE_INDEX_NAME is not set"))
  }

  const index = pinecone!.Index(process.env.PINECONE_INDEX_NAME);
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

export { getMatchesFromEmbeddings }