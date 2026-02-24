/**
 * HTTP Fetch — simulates fetching data from an API endpoint.
 *
 * Demonstrates async operations, error handling, and response parsing.
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
