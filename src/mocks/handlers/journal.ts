import { HttpResponse, http } from 'msw'
import type { JournalResponse } from '@/api/contracts/journal'
import { buildArtworkImage } from '../fixtures/artworks'
import { JOURNAL_FIXTURE } from '../fixtures/journal'
import { withNetwork } from '../network/simulate'

export const journalHandlers = [
  http.get(
    '/api/journal',
    withNetwork(() => {
      const body: JournalResponse = {
        title: JOURNAL_FIXTURE.title,
        subtitle: JOURNAL_FIXTURE.subtitle,
        items: JOURNAL_FIXTURE.posts.map(({ artwork, ...post }) => ({
          ...post,
          image: { ...buildArtworkImage(artwork, post.title), alt: '' },
        })),
      }
      return HttpResponse.json(body)
    }),
  ),
]
