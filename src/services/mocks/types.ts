export type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

export type MockRequest = {
    method: Method
    url: string
    params: Record<string, any>
    body: any
}

export type MockResponse = {
    status: number
    data: any
}

export type MockHandler = {
    match: (method: Method, url: string, req: MockRequest) => boolean
    respond: (req: MockRequest) => MockResponse
}
