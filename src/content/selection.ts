import { limitTitleLength, parseMarkdown, addMetadata } from './utils'
import { loadConfig } from '../config'

async function parseContent(articleContent: string) {
    const markdown = await parseMarkdown(articleContent)
    const config = await loadConfig()
    return addMetadata(config, markdown, document.URL, 'selection')
}

async function parseSelection(selection: string) {
    const markdown = await parseContent(selection)
    const title = limitTitleLength(document.title)
    return { markdown, title }
}

export { parseSelection }