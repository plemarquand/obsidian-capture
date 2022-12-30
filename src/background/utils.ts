
async function fetchPageWithRetry(url: string): Promise<Response> {
    let response: Response
    let retries = 0

    // The function will retry up to 10 times if the status of the response is 404
    while (retries < 10) {
        try {
            response = await fetch(url)
            if (response.status !== 404) {
                return response
            }
            console.log(`nitter 404, retry ${retries}`)
        } catch (error) {
            // If there was an error other than a 404 status, throw the error
            throw error
        }
        retries++
    }

    throw Error("404")
}

export { fetchPageWithRetry }