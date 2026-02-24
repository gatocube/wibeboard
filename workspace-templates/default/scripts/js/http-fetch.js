/**
 * @file http-fetch.js
 * @description Simulated HTTP fetch — demonstrates async API calls with
 *   request/response logging and error handling.
 *
 * @param {Object} ctx - Execution context
 * @param {Object} ctx.node - The current node (id, name, data)
 * @param {string} [ctx.node.data.url] - API endpoint URL (default: example.com)
 */
export async function activate(ctx) {
    const url = ctx.node.data?.url || 'https://api.example.com/data';
    console.log(`Fetching: ${url}`);

    try {
        // Simulated fetch (replace with real fetch in production)
        console.log('  → sending GET request...');
        const response = {
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: { items: [{ id: 1, name: 'alpha' }, { id: 2, name: 'beta' }] },
        };

        console.log(`  ← ${response.status} OK`);
        console.log(`  Content-Type: ${response.headers['content-type']}`);
        console.log(`  Items received: ${response.body.items.length}`);

        response.body.items.forEach(item => {
            console.log(`    • ${item.id}: ${item.name}`);
        });

        console.log('Fetch complete!');
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}
