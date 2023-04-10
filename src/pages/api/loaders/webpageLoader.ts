// https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/pinecone

import * as dotenv from 'dotenv';
import { Document as LGCDocument } from 'langchain/document';
import { GitbookLoader, GithubRepoLoader, PuppeteerWebBaseLoader } from 'langchain/document_loaders';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { WebArticle } from 'pages/api/contents/projectsContents';
import { Browser, Page } from 'puppeteer';

dotenv.config();

async function split(docs: LGCDocument[]) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const output = await splitter.splitDocuments(docs);
  return output;
}

async function loadDocuments(webPages: WebArticle[]): Promise<LGCDocument[]> {
  let allDocs: LGCDocument[] = [];
  for (const url of webPages) {
    let docs: LGCDocument[];
    if (url.type == 'article') {
      const loader = new PuppeteerWebBaseLoader(url.url, {
        launchOptions: {
          headless: true,
        },
        gotoOptions: {
          waitUntil: 'networkidle2',
        },
        async evaluate(page: Page, browser: Browser): Promise<string> {
          const [element] = await page.$x(url.xpath);
          await page.waitForXPath(url.xpath);
          const contents: string = await page.evaluate((el) => el.textContent as string, element);
          console.log('contents : ', contents);
          return contents;
        },
      });
      docs = await loader.load();
    } else if (url.type == 'github') {
      const githubLoader = new GithubRepoLoader(url.url, { branch: 'main', recursive: false, unknown: 'warn' });
      docs = await githubLoader.load();
    } else {
      const gitbookLoader = new GitbookLoader(url.url, {
        shouldLoadAllPaths: true,
      });

      docs = await gitbookLoader.load();
    }
    console.log('downloaded document : ', url);

    const output = await split(docs);

    allDocs = allDocs.concat(output);
  }
  return allDocs;
}
