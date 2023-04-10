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

export interface WebArticle extends Content {
  type: ContentType.ARTICLE;
  xpath: string;
}

export interface Gitbook extends Content {
  type: ContentType.GITBOOK;
}

export interface Github extends Content {
  type: ContentType.GITHUB;
}
