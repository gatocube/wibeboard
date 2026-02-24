/**
 * AgentNode (pixel) — thin wrapper: JobNode with subType='ai'.
 * @deprecated Use JobNode directly with data.subType='ai'
 */
import { JobNode } from './JobNode'

export function AgentNode({ data }: { data: any }) {
    return <JobNode data={{ ...data, subType: 'ai' }} />
}
