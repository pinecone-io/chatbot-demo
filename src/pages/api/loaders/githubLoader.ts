import { Document as LGCDocument } from 'langchain/document';
import { GithubRepoLoader } from 'langchain/document_loaders';
import { GithubContent, PageMetadata } from 'pages/api/contents/projectsContents';
import { split } from 'pages/api/loaders/splitter';

export async function loadGithubData(content: GithubContent): Promise<LGCDocument<PageMetadata>[]> {
  const githubLoader = new GithubRepoLoader(content.url, { branch: content.branch, recursive: true, unknown: 'warn' });
  const docs: LGCDocument[] = await githubLoader.load();
  const updatedDocs = docs.map((doc): LGCDocument<Omit<PageMetadata, 'chunk'>> => {
    const metadata: Omit<PageMetadata, 'chunk'> = {
      url: doc.metadata.source,
      text: doc.pageContent,
      source: doc.metadata.source,
    };
    return { ...doc, metadata };
  });
  return split(updatedDocs);
}
