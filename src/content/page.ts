import { Readability } from '@mozilla/readability'
import { limitTitleLength, parseMarkdown, addMetadata } from './utils'
import { loadConfig } from '../config'

async function parseContent(articleContent: string) {
    const markdown = await parseMarkdown(articleContent)
    const config = await loadConfig()
    return addMetadata(config, markdown, document.URL, 'page')
}

async function parseWebpage() {
    // The spec says that the ownerDocument of the document is null,
    // but cloneNode relies on looking stuff up on the ownerDocument
    // of the cloned node, so we hack in a value to satisfy clone node
    // and then clean up after to go back to what we had.
    Object.defineProperty(document, 'ownerDocument', {
        writable: false,
        configurable: true,
        value: document
    });

    const documentClone = document.cloneNode(true)
    const article = new Readability(documentClone as Document).parse();

    Object.defineProperty(document, 'ownerDocument', {
        writable: false,
        configurable: true,
        value: null
    });

    let markdown = null
    let title = null

    if (article?.content) {
        markdown = await parseContent(article.content)
    }

    if (article?.title) {
        title = limitTitleLength(article.title)
    }

    return Promise.resolve({ markdown, title })
}

export { parseWebpage }