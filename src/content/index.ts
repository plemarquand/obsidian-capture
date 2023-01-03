import { isProbablyReaderable } from '@mozilla/readability'
import { isTwitterThread, parseTwitterThread } from './twitter'
import { parseWebpage } from './page'
import { parseSelection } from './selection'
import { pathJoin } from './utils'
import { Config } from '../types'

function sendIsReadable() {
    let readable = isProbablyReaderable(document) || isTwitterThread()
    chrome.runtime.sendMessage({ isProbablyReaderable: readable })
}

async function parsePage() {
    if (isTwitterThread()) {
        return parseTwitterThread()
    } else {
        return parseWebpage()
    }
}

async function loadConfig(): Promise<Config> {
    return new Promise((resolve) => {
        chrome.storage.sync.get('config', (args) => { resolve(args.config) })
    })
}

// register listener to receive messages
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.parsePage) {
        const { markdown, title } = await parsePage();

        if (!!markdown && !!title) {
            const config = await loadConfig()

            const content = encodeURIComponent(markdown)
            const formattedTitle = encodeURIComponent(title.replace(/[:\\/]/g, ''))
            const path = pathJoin([config.path, formattedTitle])
            const url = `obsidian://new?name=${path}${formattedTitle}&content=${content}`

            window.open(url, '_self')
        }

    } else if (message.parseSelection && message.parseSelection.length > 0) {
        const { markdown, title } = await parseSelection(message.parseSelection);
        const config = await loadConfig()

        const content = encodeURIComponent(markdown)
        const formattedTitle = encodeURIComponent(title.replace(/[:\\/]/g, ''))
        const path = pathJoin([config.path, formattedTitle])
        const url = `obsidian://new?name=${path}${formattedTitle}&content=${content}`

        window.open(url, '_self')
    }
});

if (document.readyState === "complete") {
    sendIsReadable()
} else {
    window.addEventListener("load", () => sendIsReadable());
}

export { }
