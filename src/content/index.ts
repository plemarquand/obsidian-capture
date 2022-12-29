import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'

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

function buildIFrame(contents: string) {
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe)
    iframe.contentWindow.document.body.innerHTML = contents
    return iframe
}

function extractTweets(iframe: HTMLIFrameElement) {
    const mainThread = iframe.contentWindow?.document.querySelector('.main-thread')
    return Array.from(mainThread?.querySelectorAll('.timeline-item .tweet-content, .attachment.image') ?? [])
}

function parseTwitterThread(): Promise<{ markdown: string, title: string}> {
    const path = new URL(document.URL).pathname

    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ parseTwitter: path },
            async function(response: string) {
                const iframe = buildIFrame(response)
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

                resolve({
                    markdown,
                    title: document.title.split(':')[0]
                })
            }
        )
    })
}

async function parsePage() {
    const url = new URL(document.URL)
    if (url.hostname == "twitter.com" && url.pathname.match(/^\/[A-Za-z0-9\-_]+\/status\/[0-9]+$/) != null) {
        return await parseTwitterThread()
    }

    const bodyClone = document.body.cloneNode(true)
    const article = new Readability(document, { keepClasses: true }).parse();

    var markdown = null
    var title = null
    if (article?.content) {
        markdown = parseContent(article.content)
    }

    if (article?.title) {
        title = article?.title
    }

    document.body = bodyClone as HTMLElement

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

export {}
