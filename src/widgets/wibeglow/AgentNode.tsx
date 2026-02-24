/**
 * AgentNode (wibeglow) — thin wrapper around JobNode with variant='agent'.
 * @deprecated Use JobNode directly with data.variant='agent'
 */
import { JobNode } from './JobNode'

export function AgentNode({ data }: { data: any }) {
    return <JobNode data={{ ...data, variant: 'agent' }} />
}
