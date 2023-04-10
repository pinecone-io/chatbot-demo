// https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/pinecone

import * as dotenv from 'dotenv';
import { Document as LGCDocument } from 'langchain/document';
import { PuppeteerWebBaseLoader } from 'langchain/document_loaders';
import { PageMetadata, WebArticleContent } from 'pages/api/contents/projectsContents';
import { split } from 'pages/api/loaders/splitter';
import { Browser, Page } from 'puppeteer';

dotenv.config();

export async function loadWebPage(url: WebArticleContent): Promise<LGCDocument<PageMetadata>[]> {
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
  const docs: LGCDocument<Omit<PageMetadata, 'chunk'>>[] = (await loader.load()).map((doc): LGCDocument<Omit<PageMetadata, 'chunk'>> => {
    const metadata: Omit<PageMetadata, 'chunk'> = {
      url: url.url,
      text: doc.pageContent,
      source: url.url,
    };
    return { ...doc, metadata };
  });

  return await split(docs);
}

export async function loadWebPages(webPages: WebArticleContent[]): Promise<LGCDocument[]> {
  let allDocs: LGCDocument[] = [];
  for (const url of webPages) {
    const output = await loadWebPage(url);

    allDocs = allDocs.concat(output);
  }
  return allDocs;
}
