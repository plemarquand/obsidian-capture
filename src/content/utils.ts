import { HTMLarkdown, Rule } from 'htmlarkdown'
import { Config } from '../types'

function sendMessageWithResponse<T>(message: any): Promise<T> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, function (response: T) {
            resolve(response)
        })
    })
}

function limitTitleLength(title: string) {
    return title.length > 200 ? `${title.substring(0, 200 - 3)}...` : title
}

function replaceMarkers(obj: { [key: string]: any }, str: string): string {
    const markerRegex = /\${([^{}]*)}/g;

    return str.replace(markerRegex, (match: string, key: string) => {
        return obj.hasOwnProperty(key) ? obj[key] : match
    });
  }

function addMetadata(config: Config, content: string, url: string, type: 'selection' | 'page' | 'tweet_thread') {
    const date = `${new Date().toLocaleDateString()} - ${new Date().toISOString().substring(11, 19)}`
    const data = {
        date,
        url,
        type,
        content
    }

    return replaceMarkers(data, config.template)
}

function findClosingParen(text: string, openPos: number): number {
    let closePos = openPos
    let counter = 1

    while (counter > 0) {
        let c = text[++closePos]

        if (c == '[') { counter++ }
        else if (c == ']') { counter-- }
    }

    return closePos;
}

async function parseMarkdown(content: string) {

    // HTMLarkdown doesn't like the <article> tag that comes out of readability.
    content = content.replace('<article>', '').replace('</article>', '')

    const htmlarkdown = new HTMLarkdown()
    let markdown = htmlarkdown.convert(content, true).replace(/&nbsp;/g, ' ')
    const bracketRegex = /\[/mg

    // Turndown has a quirk where if a link wraps an image they nest properly but with
    // newlines between the link's square brackets. This causes Obsidian to render the enclosing link
    // improperly. Make sure there exists no newlines between opening and closing square brackets.
    let match: RegExpMatchArray | null
    while ((match = bracketRegex.exec(markdown)) !== null) {
        if (match.index !== undefined) {
            const closeIndex = findClosingParen(markdown, match.index ?? -1)
            const toReplace = markdown.substring(match.index, closeIndex + 1)
            markdown = markdown.replace(toReplace, toReplace.replace(/(?:\r\n|\r|\n)/gm, ''))
        }
    }

    return combineCodeBlocks(markdown)
}

function combineCodeBlocks(markdown: string) {
    const lines = markdown.split('\n');
    let output = ''
    let blockBuffer: string[] = []

    for (const line of lines) {
        // Check if this line is the start of a code block
        const trimmedLine = line.trim()
        const match = line.match(/^([\W]*)\`(.*)\`$/m)
        if (match !== null) {
            const whitespace = match[1]
            const code = match[2]
            blockBuffer.push(`${whitespace}${code}`)
        } else if (trimmedLine.trim().length == 0 && blockBuffer.length > 0) {
            continue
        } else {
            if (blockBuffer.length > 0) {
                output += `\`\`\`\n${blockBuffer.join('\n')}\n\`\`\`\n`
                blockBuffer = []
            }
            output += line + '\n'
        }
    }

    if (blockBuffer.length > 0) {
        output += `\`\`\`\n${blockBuffer.join('\n')}\n\`\`\`\n`
    }

    return output
}

function pathJoin(parts: string[], sep: string = '/') {
    const separator = sep || '/';
    const regexSep = separator === '\\' ? `${separator}${separator}` : separator
    const replace = new RegExp(regexSep+'+', 'g');
    return parts.join(separator).replace(replace, separator);
}

export {
    combineCodeBlocks,
    limitTitleLength,
    addMetadata,
    sendMessageWithResponse,
    parseMarkdown,
    pathJoin
}