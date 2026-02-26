[x] isDone

when we write tests to check something like communication with LLM we should mark them as integration tests. For example:

'test-openai.integration.e2e.ts'

We should make sure we don't run them by default and in CI.

We should make sure we have a script in packages json to run them.
We should make sure there is possible to run them in CI with an manual action.
Our tests should not have hardcoded secrets, urls and ports.