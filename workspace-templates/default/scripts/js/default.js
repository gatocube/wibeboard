/**
 * @file default.js
 * @description Hello World — minimal starter script that logs the node name and ID.
 *   Use this as a starting point for new script nodes.
 *
 * @param {Object} ctx - Execution context
 * @param {Object} ctx.node - The current node (id, name, data)
 */
export function activate(ctx) {
    console.log('Hello from', ctx.node.name);
    console.log('Node ID:', ctx.node.id);
    console.log('Ready to go!');
}
