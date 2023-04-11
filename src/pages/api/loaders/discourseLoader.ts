import { Document as LGCDocument } from 'langchain/document';
import { PageMetadata } from 'pages/api/contents/projectsContents';
import { split } from 'pages/api/loaders/splitter';
import puppeteer, { Browser, Page } from 'puppeteer';

// https://stackoverflow.com/a/53527984/440432
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function getPageDetails(browser: Browser, url: string) {
  const page = await browser.newPage();
  await page.goto(url);
  await page.setViewport({
    width: 1200,
    height: 800,
  });

  await autoScroll(page);

  const content = await page.$eval('div.container.posts', (e) => e.textContent);

  await page.close();

  return content;
}

// https://stackoverflow.com/a/55388485/440432
async function getHrefs(page: Page, selector: string): Promise<string[]> {
  return (await page.$$eval(selector, (anchors) => [].map.call(anchors, (a: HTMLAnchorElement) => a.href))) as string[];
}

export interface DiscourseThread {
  url: string;
  contents: string;
}
async function getAllThreads(discourseUrl: string): Promise<DiscourseThread[]> {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto(discourseUrl);
  await page.setViewport({
    width: 1200,
    height: 800,
  });

  await autoScroll(page);

  const hrefs: string[] = await getHrefs(page, 'tr.topic-list-item > td.main-link > span > a');

  const allPageContents: DiscourseThread[] = [];
  for (const url of hrefs) {
    const content = await getPageDetails(browser, url);
    console.log('content : ', content);
    allPageContents.push({ url, contents: content || '' });
  }

  await browser.close();

  return allPageContents;
}

async function getAllDiscourseDocs(discourseUrl: string): Promise<LGCDocument<PageMetadata>[]> {
  const allPageContents = await getAllThreads(discourseUrl);

  const docs: LGCDocument<Omit<PageMetadata, 'chunk'>>[] = allPageContents.map(
    (pageContent) =>
      new LGCDocument({
        pageContent: pageContent.contents,
        metadata: { source: pageContent.url, url: pageContent.url, text: pageContent.contents },
      })
  );
  return split(docs);
}
