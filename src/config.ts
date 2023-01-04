import { Config } from './types'

async function loadConfig(): Promise<Config> {
    return new Promise((resolve) => {
        chrome.storage.sync.get('config', (args) => { 
            resolve(args.config) 
        })
    })
}

export { loadConfig }