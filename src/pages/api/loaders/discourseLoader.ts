import puppeteer, { Browser, Page } from 'puppeteer';

const discourseUrl = 'https://gov.uniswap.org/latest';

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

async function discourse() {
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

  // console.log(hrefs);

  const firstTen = hrefs.slice(0, 10);

  console.log('firstTen : ', firstTen);

  for (const url of firstTen) {
    const content = await getPageDetails(browser, url);
    console.log('content : ', content);
  }

  await page.screenshot({
    path: 'yoursite.png',
    fullPage: true,
  });

  await browser.close();
}

discourse();
