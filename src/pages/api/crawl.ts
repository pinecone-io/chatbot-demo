import { PineconeClient, Vector } from '@pinecone-database/pinecone';
import Bottleneck from 'bottleneck';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { NextApiRequest, NextApiResponse } from 'next';
import { uniswapV3ProjectContents } from 'pages/api/contents/projects';
import { ContentType, GitbookContent, GithubContent, PageMetadata, WebArticleContent } from 'pages/api/contents/projectsContents';
import { loadGitbookData } from 'pages/api/loaders/gitbookLoader';
import { loadGithubData } from 'pages/api/loaders/githubLoader';
import { loadWebPage } from 'pages/api/loaders/webpageLoader';
import { uuid } from 'uuidv4';

const limiter = new Bottleneck({
  minTime: 2000,
});

let pinecone: PineconeClient | null = null;

const initPineconeClient = async () => {
  pinecone = new PineconeClient();
  console.log('init pinecone');
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

type Response = {
  message: string;
};

const sliceIntoChunks = (arr: Vector[], chunkSize: number) => {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) => arr.slice(i * chunkSize, (i + 1) * chunkSize));
};
async function getVectors(documents: Document<PageMetadata>[]): Promise<Vector[]> {
  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-ada-002',
  });

  //Embed the documents
  const vectors: Vector[] = await Promise.all(
    documents.flat().map(async (doc) => {
      const embedding = await embedder.embedQuery(doc.pageContent);
      console.log('done embedding', doc.metadata.url);
      return {
        id: uuid(),
        values: embedding,
        metadata: {
          chunk: doc.pageContent,
          text: doc.metadata.text as string,
          url: doc.metadata.url as string,
        },
      } as Vector;
    })
  );

  return vectors;
}

export async function indexAllData() {
  try {
    if (!pinecone) {
      await initPineconeClient();
    }

    const index = pinecone && pinecone.Index(uniswapV3ProjectContents.indexName);

    console.log('start indexing');
    await index?.delete1({ deleteAll: true });

    console.log('done deleting documents in index');

    let allDocs: Document<PageMetadata>[] = [];
    for (const content of uniswapV3ProjectContents.contents) {
      let docs: Document<PageMetadata>[] = [];
      try {
        if (content.type === ContentType.ARTICLE) {
          docs = await loadWebPage(content as WebArticleContent);
        } else if (content.type == ContentType.GITHUB) {
          docs = await loadGithubData(content as GithubContent);
        } else {
          docs = await loadGitbookData(content as GitbookContent);
        }
        allDocs = allDocs.concat(docs);
      } catch (e) {
        console.error(e);
      }
    }

    let vectors: Vector[] = [];

    try {
      vectors = (await limiter.schedule(() => getVectors(allDocs))) as unknown as Vector[];
    } catch (e) {
      console.error(e);
    }

    const chunks = sliceIntoChunks(vectors, 10);

    await Promise.all(
      chunks.map(async (chunk) => {
        index &&
          (await index.upsert({
            upsertRequest: {
              namespace: uniswapV3ProjectContents.namespace,
              vectors: chunk as Vector[],
            },
          }));
      })
    );

    console.log('done indexing');
  } catch (e) {
    console.error(e);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (!process.env.PINECONE_INDEX_NAME) {
    res.status(500).json({ message: 'PINECONE_INDEX_NAME not set' });
    return;
  }

  const { query } = req;

  const { urls: urlString, limit } = query;
  await indexAllData();

  res.status(200).json({ message: 'Done' });
}
