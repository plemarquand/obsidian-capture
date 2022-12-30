import { Readability, isProbablyReaderable } from '@mozilla/readability'
import TurndownService from 'turndown'

function sendIsReadable() {
    let readable = isProbablyReaderable(document) || isTwitterThread()
    chrome.runtime.sendMessage({ isProbablyReaderable: readable })
}

function addCapturedOn(articleContent: string) {
    const date = `${new Date().toLocaleDateString()} - ${new Date().toISOString().substring(11, 19)}`
    return `Captured on ${date}<br/><br/>${articleContent}`
}

function parseContent(articleContent: string) {
    const turndownService = new TurndownService()
    const content = addCapturedOn(articleContent)
    return `[Original URL](${document.URL}) - ${turndownService.turndown(content)}`
}

function parseTweetThread(threadContent: string) {
    const turndownService = new TurndownService()
    const contents = addCapturedOn(threadContent)
    return `[Original Tweet](${document.URL}) - ${turndownService.turndown(contents)}`
}

function isTwitterThread() {
    const url = new URL(document.URL)
    return (url.hostname == "twitter.com" && url.pathname.match(/^\/[A-Za-z0-9\-_]+\/status\/[0-9]+$/) != null)
}

function buildIFrame(contents: string) {
    let iframe = document.createElement('iframe');
    document.body.appendChild(iframe)
    if (!!iframe.contentWindow) {
        iframe.contentWindow.document.body.innerHTML = contents
    }
    return iframe
}

function extractTweets(iframe: HTMLIFrameElement) {
    const mainThread = iframe.contentWindow?.document.querySelector('.main-thread')
    return Array.from(mainThread?.querySelectorAll('.timeline-item .tweet-content, .attachment.image') ?? [])
}

async function parseTwitterThread() {
    const path = new URL(document.URL).pathname

    const nitterHTML: string = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ parseTwitter: path }, function(response: string) {
            resolve(response)
        })
    })

    if (nitterHTML.toLowerCase().includes('tweet not found')) {
        alert('Unable to parse tweet thread.')
        return { markdown: null, title: null }
    }

    const iframe = buildIFrame(nitterHTML)
    const tweetElements = extractTweets(iframe)
    const articleContentPromises = tweetElements.map((v): Promise<string> => {
        const img = v.querySelector('img')
        if (!!img) {
            return new Promise((resolve) => {
                // These images point to nitter endpoints but because we dropped this in
                // to an iframe on twitter.com the img src will be prefixed with twitter.
                // Swap it back to nitter so the images show up correctly.
                const imgSrc = img.src.replace('https://twitter.com', 'https://nitter.it')
                chrome.runtime.sendMessage({ base64Image: imgSrc }, function(response: string) {
                    resolve(`<img src="${response}" />`)
                })
            })
        }

        return Promise.resolve((v as HTMLElement).innerText)
    })

    const threadContent = (await Promise.all(articleContentPromises)).join("<br/><br/>")
    const markdown = parseTweetThread(threadContent)

    document.body.removeChild(iframe)

    return {
        markdown,
        title: document.title.split(':')[0]
    }
}

async function parsePage() {
    if (isTwitterThread()) {
        return await parseTwitterThread()
    }

    // The spec says that the ownerDocument of the document is null,
    // but cloneNode relies on looking stuff up on the ownerDocument
    // of the cloned node, so we hack in a value to satisfy clone node
    // and then clean up after to go back to what we had.
    Object.defineProperty(document, 'ownerDocument',{
        writable: false,
        configurable: true,
        value: document
    });

    const documentClone = document.cloneNode(true)
    const article = new Readability(documentClone as Document).parse();

    Object.defineProperty(document, 'ownerDocument',{
        writable: false,
        configurable: true,
        value: null
    });

    let markdown = null
    let title = null

    if (article?.content) {
        markdown = parseContent(article.content)
    }

    if (article?.title) {
        title = article?.title
    }

    return Promise.resolve({ markdown, title })
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
        const selection = message.parseSelection
        const content = parseContent(selection)
        const title = document.title
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

export {}
