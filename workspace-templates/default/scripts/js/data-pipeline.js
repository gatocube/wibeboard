/**
 * Data Pipeline — validates, transforms, and outputs structured data.
 *
 * Simulates a 3-stage ETL pipeline with progress logging.
 */
export function activate(ctx) {
    console.log('Pipeline started:', ctx.node.name);

    // Stage 1: Validate
    console.log('Stage 1: validating input schema...');
    const input = ctx.node.data?.input || { records: 42 };
    if (!input.records) throw new Error('No records in input');
    console.log(`  ✓ ${input.records} records validated`);

    // Stage 2: Transform
    console.log('Stage 2: transforming data...');
    const transformed = Array.from({ length: input.records }, (_, i) => ({
        id: i + 1,
        value: Math.random().toFixed(4),
        ts: Date.now(),
    }));
    console.log(`  ✓ ${transformed.length} records transformed`);

    // Stage 3: Output
    console.log('Stage 3: writing output...');
    console.log(`  ✓ wrote ${transformed.length} records`);

    console.log('Pipeline complete!');
}
