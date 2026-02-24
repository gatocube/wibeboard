/**
 * ScriptNode (pixel) — thin wrapper: JobNode with subType='script'.
 * @deprecated Use JobNode directly with data.subType='script'
 */
import { JobNode } from './JobNode'

export function ScriptNode({ data }: { data: any }) {
    return <JobNode data={{ ...data, subType: 'script' }} />
}
