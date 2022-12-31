import { limitTitleLength, parseMarkdown } from './utils'

async function parseContent(articleContent: string) {
    const markdown = await parseMarkdown(articleContent)
    return `[Original URL](${document.URL}) - ${markdown}`
}

async function parseSelection(selection: string) {
    const markdown = await parseContent(selection)
    const title = limitTitleLength(document.title)

    return { markdown, title }
}

export { parseSelection }