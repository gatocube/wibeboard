export function isHumanMode() {
    return process.env.TEST_RUNNER_HUMAN === "1";
}

export async function breath(ms = 1000) {
    if (!isHumanMode()) return;
    await new Promise((resolve) => setTimeout(resolve, ms));
}
