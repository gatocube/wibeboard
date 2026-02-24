/**
 * ScriptNode (ghub) — thin wrapper around JobNode with variant='script', subtype='script'.
 * @deprecated Use JobNode directly with data.variant='script'
 */
import { JobNode } from './JobNode'

export function ScriptNode({ data }: { data: any }) {
    return <JobNode data={{ ...data, variant: 'script', subtype: 'script' }} />
}
