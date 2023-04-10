export enum ContentType {
  IMAGE = 'image',
  PDF_DOCUMENT = 'pdf_document',
  ARTICLE = 'article',
  DISCOURSE = 'discourse',
  GITBOOK = 'gitbook',
  GITHUB = 'github',
}

export interface Content {
  id: string;
  type: ContentType;
  url: string;
}

export interface WebArticleContent extends Content {
  type: ContentType.ARTICLE;
  xpath: string;
}

export interface GitbookContent extends Content {
  type: ContentType.GITBOOK;
}

export interface GithubContent extends Content {
  type: ContentType.GITHUB;
  branch: string;
}

export interface PageMetadata {
  chunk: string;
  text: string;
  url: string;
  source: string;
}
