import { isProbablyReaderable } from '@mozilla/readability'
import { isTwitterThread, parseTwitterThread } from './twitter'
import { parseWebpage } from './page'
import { parseSelection } from './selection'
import { pathJoin } from './utils'
import { loadConfig } from '../config'

function sendIsReadable() {
    chrome.runtime.sendMessage({
        isProbablyReaderable: isProbablyReaderable(document) || isTwitterThread()
    })
}

async function parsePage() {
    return isTwitterThread() ? parseTwitterThread() : parseWebpage()
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
            const url = `obsidian://new?name=${path}&content=${content}`

            window.open(url, '_self')
        }

    } else if (message.parseSelection && message.parseSelection.length > 0) {
        const { markdown, title } = await parseSelection(message.parseSelection);
        const config = await loadConfig()

        const content = encodeURIComponent(markdown)
        const formattedTitle = encodeURIComponent(title.replace(/[:\\/]/g, ''))
        const path = pathJoin([config.path, formattedTitle])
        const url = `obsidian://new?name=${path}&content=${content}`

        window.open(url, '_self')
    }
});

if (document.readyState === "complete") {
    sendIsReadable()
} else {
    window.addEventListener("load", () => sendIsReadable());
}

export { }
