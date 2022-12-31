import { isProbablyReaderable } from '@mozilla/readability'
import { isTwitterThread, parseTwitterThread } from './twitter'
import { parseWebpage } from './page'
import { parseSelection } from './selection'

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

// register listener to receive messages
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.parsePage) {
        const { markdown, title } = await parsePage();

        if (!!markdown && !!title) {
            const content = encodeURIComponent(markdown)
            const rawTitle = `ObsidIt - ${title}`
            const formattedTitle = encodeURIComponent(rawTitle.replace(/[:\\/]/g, ''))
            const url = `obsidian://new?name=${formattedTitle}&content=${content}`
            window.open(url, '_self')
        }

    } else if (message.parseSelection && message.parseSelection.length > 0) {
        const { markdown, title } = await parseSelection(message.parseSelection);

        const content = markdown
        const rawTitle = `ObsidIt - ${title}`
        const formattedTitle = encodeURIComponent(rawTitle.replace(/[:\\/]/g, ''))
        const url = `obsidian://new?name=${formattedTitle}&content=${content}`
        window.open(url, '_self')
    }
});

if (document.readyState === "complete") {
    sendIsReadable()
} else {
    window.addEventListener("load", () => sendIsReadable());
}

export { }
