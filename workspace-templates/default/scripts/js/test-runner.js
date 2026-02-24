/**
 * Test Runner — runs a set of assertions and reports results.
 *
 * Simulates a lightweight test suite with pass/fail reporting.
 */
export function activate(ctx) {
    console.log(`Running tests for: ${ctx.node.name}`);
    console.log('─'.repeat(40));

    const results = [];

    function assert(name, condition) {
        const status = condition ? '✅ PASS' : '❌ FAIL';
        results.push({ name, passed: condition });
        console.log(`  ${status}  ${name}`);
    }

    // Test cases
    assert('node has an id', !!ctx.node.id);
    assert('node has a name', !!ctx.node.name);
    assert('data is an object', typeof ctx.node.data === 'object');
    assert('status is defined', ctx.node.data?.status !== undefined);
    assert('1 + 1 = 2', 1 + 1 === 2);

    // Summary
    console.log('─'.repeat(40));
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    console.log(`Results: ${passed} passed, ${failed} failed, ${results.length} total`);

    if (failed > 0) {
        console.log('⚠️  Some tests failed!');
    } else {
        console.log('✅ All tests passed!');
    }
}
