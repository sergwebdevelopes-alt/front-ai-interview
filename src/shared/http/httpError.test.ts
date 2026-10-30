import { describe, expect, it } from 'vitest'
import { HttpError, RequestTimeoutError, toHttpError } from './httpError.ts'

describe('RequestTimeoutError', () => {
  it('describes the timeout in seconds', () => {
    const error = new RequestTimeoutError(5000)
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('RequestTimeoutError')
    expect(error.timeoutMs).toBe(5000)
    expect(error.message).toBe('Request timed out after 5 s')
  })
})

describe('toHttpError', () => {
  it('uses the message from a JSON body', async () => {
    const response = new Response(JSON.stringify({ message: "Product with id '999' not found" }), {
      status: 404,
      statusText: 'Not Found',
    })

    const error = await toHttpError(response)

    expect(error).toBeInstanceOf(HttpError)
    expect(error.name).toBe('HttpError')
    expect(error.status).toBe(404)
    expect(error.message).toBe("Product with id '999' not found")
  })

  it('falls back to the status text for a non-JSON body', async () => {
    const response = new Response('<html>oops</html>', { status: 503, statusText: 'Service Unavailable' })
    expect((await toHttpError(response)).message).toBe('Service Unavailable')
  })

  it('falls back to the status text when the JSON has no message', async () => {
    const response = new Response(JSON.stringify({ error: 'x' }), { status: 500, statusText: 'Server Error' })
    expect((await toHttpError(response)).message).toBe('Server Error')
  })

  it('describes the status when there is no status text either', async () => {
    const response = new Response('', { status: 500, statusText: '' })
    expect((await toHttpError(response)).message).toBe('Request failed with status 500')
  })
})
