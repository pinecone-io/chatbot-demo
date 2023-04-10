import { Content, ContentType, GitbookContent, GithubContent, WebArticleContent } from 'pages/api/contents/projectsContents';

const uniswapArticles: WebArticleContent[] = [
  {
    id: 'uniswap-impermanent-loss-whiteboardcrypto',
    url: 'https://whiteboardcrypto.com/impermanent-loss-calculator',
    xpath: '/html/body/div[1]/div/div[1]/div[2]/div[2]/section/div[1]',
    type: ContentType.ARTICLE,
  },
  {
    id: 'uniswap-impermanent-loss-chainbulletin',
    url: 'https://chainbulletin.com/impermanent-loss-explained-with-examples-math',
    xpath: '/html/body/div[1]/div/div/div[2]',
    type: ContentType.ARTICLE,
  },
  // other
  {
    id: 'uniswap-impermanent-loss-blockworks',
    url: 'https://blockworks.co/news/the-investors-guide-to-navigating-impermanent-loss',
    xpath: '/html/body/div[1]/div/main/section[1]/div[1]/article/div[3]',
    type: ContentType.ARTICLE,
  },
  {
    id: 'uniswap-impermanent-loss-ledger',
    url: 'https://www.ledger.com/academy/glossary/impermanent-loss',
    xpath: '/html/body/main/div/div',
    type: ContentType.ARTICLE,
  },
  {
    id: 'uniswap-impermanent-loss-coinmonks-medium',
    url: 'https://medium.com/coinmonks/understanding-impermanent-loss-9ac6795e5baa',
    xpath: '/html/body/div[1]/div/div[3]/div[2]/div/main/div/div[3]/div/div/article/div/div[2]/section/div/div[2]',
    type: ContentType.ARTICLE,
  },
];
const uniswapGitbooks: GitbookContent[] = [
  {
    id: 'uniswap-v3-gitbook',
    type: ContentType.GITBOOK,
    url: 'https://docs.uniswap.org/',
  },
];
const uniswapGithub: GithubContent[] = [
  {
    id: 'uniswap-v3-github',
    type: ContentType.GITHUB,
    url: 'https://github.com/Uniswap/v3-core',
    branch: 'main',
  },
];

export const uniswapV3Contents: Content[] = [...uniswapArticles, ...uniswapGitbooks, ...uniswapGithub];
