/**
 * Default "Hello" script — minimal starter template.
 *
 * ctx.node  — the current node (id, name, data)
 * ctx.log   — append a log line
 * ctx.done  — signal completion
 */
export function activate(ctx) {
    console.log('Hello from', ctx.node.name);
    console.log('Node ID:', ctx.node.id);
    console.log('Ready to go!');
}
