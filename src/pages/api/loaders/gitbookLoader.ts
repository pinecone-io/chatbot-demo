import { Document as LGCDocument } from 'langchain/document';
import { GitbookLoader } from 'langchain/document_loaders';
import { GitbookContent, PageMetadata } from 'pages/api/contents/projectsContents';
import { split } from 'pages/api/loaders/splitter';

export async function loadGitbookData(content: GitbookContent): Promise<LGCDocument<PageMetadata>[]> {
  const gitbookLoader = new GitbookLoader(content.url, {
    shouldLoadAllPaths: true,
  });

  const docs: LGCDocument[] = await gitbookLoader.load();
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
