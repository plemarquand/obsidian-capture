import { sendMessageWithResponse, limitTitleLength, parseMarkdown, addMetadata } from './utils'
import { loadConfig } from '../config'

async function parseTweetThread(threadContent: string) {
    const markdown = await parseMarkdown(threadContent)
    const config = await loadConfig()
    return addMetadata(config, markdown, document.URL, 'tweet_thread')
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
    const nitterHTML = await sendMessageWithResponse<string>({ parseTwitter: path })

    if (nitterHTML.toLowerCase().includes('tweet not found')) {
        alert('Unable to parse tweet thread.')
        return { markdown: null, title: null }
    }

    const iframe = buildIFrame(nitterHTML)
    const tweetElements = extractTweets(iframe)
    const articleContentPromises = tweetElements.map((v): string => {
        const img = v.querySelector('img')
        if (img) {
            // These images point to nitter endpoints but because we dropped this in
            // to an iframe on twitter.com the img src will be prefixed with twitter.
            // Swap it back to nitter so the images show up correctly.
            img.src = img.src.replace('https://twitter.com', 'https://nitter.it')
            return img.outerHTML
        }

        return (v as HTMLElement).innerText
    })

    const threadContent = (await Promise.all(articleContentPromises)).join("<br/><br/>")
    const markdown = await parseTweetThread(threadContent)

    document.body.removeChild(iframe)

    return {
        markdown,
        title: limitTitleLength(document.title.split(':')[0])
    }
}

export { isTwitterThread, parseTwitterThread }
