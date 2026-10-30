export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      return body.message
    }
  } catch {}
  return response.statusText || `Request failed with status ${response.status}`
}

export async function toHttpError(response: Response): Promise<HttpError> {
  return new HttpError(response.status, await readErrorMessage(response))
}
