import { HttpResponse, delay } from 'msw'
import { apiErrorFromStatus } from './responses'
import { mockRuntime } from './runtime'

type ResolverInfo = { request: Request }

type MockResponse = ReturnType<typeof HttpResponse.json>

export function withNetwork<TInfo extends ResolverInfo>(
  resolver: (info: TInfo) => MockResponse | Promise<MockResponse>,
): (info: TInfo) => Promise<MockResponse> {
  return async (info) => {
    const url = new URL(info.request.url)
    await delay(mockRuntime.latencyFor(url))
    const failure = mockRuntime.takeFailure(info.request.method, url.pathname)
    if (failure) {
      if (failure.mode === 'network-error') return HttpResponse.error()
      if (failure.mode === 'timeout') {
        await delay('infinite')
        return HttpResponse.error()
      }
      return apiErrorFromStatus(failure.mode)
    }
    return resolver(info)
  }
}
