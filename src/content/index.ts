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
        setLoading(true)
        const { markdown, title } = await parsePage();

        if (!!markdown && !!title) {
            const config = await loadConfig()

            const content = encodeURIComponent(markdown)
            const formattedTitle = encodeURIComponent(title.replace(/[:\\/]/g, ''))
            const path = pathJoin([config.path, formattedTitle])
            const url = `obsidian://new?name=${path}&content=${content}`

            window.open(url, '_self')
        }
        setLoading(false)

    } else if (message.parseSelection && message.parseSelection.length > 0) {
        const selection = window.getSelection()
        if (selection === null) {
            return
        }

        const { markdown, title } = await parseSelection(getSelectionHtml());
        const config = await loadConfig()

        const content = encodeURIComponent(markdown)
        const formattedTitle = encodeURIComponent(title.replace(/[:\\/]/g, ''))
        const path = pathJoin([config.path, formattedTitle])
        const url = `obsidian://new?name=${path}&content=${content}`

        window.open(url, '_self')
    }
});

var timer: ReturnType<typeof setInterval> | undefined
function setLoading(isLoading: boolean) {
    if (isLoading) {
        let context = document.createElement('canvas').getContext('2d');

        var start = Date.now()
        var lines = 16,
        cW = 40,
        cH = 40;

        timer = setInterval(function() {
            var rotation = (((Date.now() - start) / 1000) * lines) / lines;
            if (context == null) {
                return
            }
            context.save();
            context.clearRect(0, 0, cW, cH);
            context.translate(cW / 2, cH / 2);
            context.rotate(Math.PI * 2 * rotation);
            for (var i = 0; i < lines; i++) {
                context.beginPath();
                context.rotate(Math.PI * 2 / lines);
                context.moveTo(cW / 6, 0);
                context.lineTo(cW / 2, 0);
                context.lineWidth = cW / 6;
                context.strokeStyle = 'rgba(122, 122, 122,' + i / lines + ')';
                context.stroke();
            }

            var imageData = context.getImageData(0, 0, cW, cH);
            chrome.runtime.sendMessage({
                setIcon: {
                    width: imageData.width,
                    height: imageData.height,
                    data: Array.from(imageData.data),
                    colorSpace: imageData.colorSpace
                }
            });

            context.restore();
        }, 1000 / 30);
    } else {
        clearInterval(timer)
        chrome.runtime.sendMessage({
            setIcon: null
        })
    }
}

function getSelectionHtml() {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel !== null && sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    }
    return html;
}

if (document.readyState === "complete") {
    chrome.runtime.sendMessage({
        setIcon: null
    })

    sendIsReadable()
} else {
    window.addEventListener("load", () => sendIsReadable());
}


export { }
