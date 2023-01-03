import { limitTitleLength, parseMarkdown, addMetadata } from './utils'

async function parseContent(articleContent: string) {
    const markdown = await parseMarkdown(articleContent)
    return addMetadata(markdown, document.URL, 'selection')
}

async function parseSelection(selection: string) {
    const markdown = await parseContent(selection)
    const title = limitTitleLength(document.title)
console.log("markdown", markdown)
    return { markdown, title }
}

export { parseSelection }