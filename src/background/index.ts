import { fetchPageWithRetry } from './utils'
import { loadConfig } from '../config'
import { Config } from '../types'

const template = `---
captured_on: \$\{date\}
original_url: \$\{url\}
type: \$\{type\}
tags: clipping
---

\$\{content\}`

const initialConfig: Config = {
    path: '/',
    template: template
}

// Overlay the saved configuration on the default config
loadConfig()
    .then((config: Config) => {
        chrome.storage.sync.set({ config: { ...initialConfig, ...config } });
    })

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id ?? 0, { parsePage: true })
})

var enabledLookup: Record<number, boolean> = {}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!!request.parseTwitter) {
        fetchPageWithRetry(`https://nitter.it${request.parseTwitter}`)
            .then((result) => result.text())
            .then((text) => sendResponse(text))

        return true
    } else if (!!request.base64Image) {
        fetch(request.base64Image)
            .then(response => response.blob())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(blob)
            }))
            .then((response) => sendResponse(response))

        return true
    } else if (request.isProbablyReaderable !== undefined) {
        enabledLookup[sender.tab?.id ?? -1] = request.isProbablyReaderable
        setEnabled(sender.tab?.id ?? -1)
    } else if (request.setIcon !== undefined) {
        if (request.setIcon == null) {
            chrome.action.setIcon({ path: "img/logo-16.png" });
        } else {
            const data = (request.setIcon as ImageData)
            chrome.action.setIcon({ imageData: data })
        }
    }
})

function setEnabled(tab: number) {
    if (enabledLookup[tab]) {
        chrome.action.setIcon({ path: "img/logo-16.png" });
        chrome.action.enable(tab)
    } else {
        chrome.action.setIcon({ path: "img/logo-48-disabled.png" });
        chrome.action.disable(tab)
    }
}

chrome.tabs.onActivated.addListener(function (tab) {
    setEnabled(tab.tabId)
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!!tab) {
        if (info.menuItemId == "contextpage") {
            chrome.tabs.sendMessage(tab.id ?? -1, { parsePage: true })
        } else {
            chrome.tabs.sendMessage(tab.id ?? -1, { parseSelection: info.selectionText })
        }
    }
});

const contexts: chrome.contextMenus.ContextType[] = ["page", "selection", "editable", "image", "video"];
for (let i = 0; i < contexts.length; i++) {
    const context = contexts[i];
    const type = context == "selection" ? "selection" : "page"
    const title = `Send ${type} to Obsidian`;
    chrome.contextMenus.create({
        title: title,
        contexts: [context],
        id: "context" + context
    });
}
