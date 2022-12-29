chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id ?? 0, { parsePage: true })
})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (!!request.parseTwitter) {
        // Nitter nicely unrolls threads for us, use its HTML as the basis for our parsing
        fetch(`https://nitter.it${request.parseTwitter}`)
            .then((result) => result.text())
            .then((text) => sendResponse(text))
        
        return true
    } else if (!!request.base64Image) {
        console.log('fetching', request.base64Image)

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
    }
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!!tab) {
        if (info.menuItemId == "contextpage") {
            chrome.tabs.sendMessage(tab.id ?? 0, { parsePage: true })
        } else {
            chrome.tabs.sendMessage(tab.id ?? 0, { parseSelection: info.selectionText })
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
