import { jsonOk } from '@/lib/http'
import { trackServer } from '@/shared/lib/analytics'
import { withValidation } from '@/interfaces/http/middleware/withValidation'
import { z } from 'zod'

const TrackSchema = z.object({
    name: z.string(),
    props: z.record(z.any()).optional(),
})

export const runtime = 'nodejs'
export const POST = withValidation(
    TrackSchema,
    async (req, body: { name: string; props?: any }) => {
        trackServer(req as any, body.name as any, body.props || {})
        return jsonOk({ success: true })
    },
)
