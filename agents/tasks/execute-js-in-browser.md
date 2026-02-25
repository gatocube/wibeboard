[] isDone

We should have an assertion that checks that we can execute js in browser
Each js node can have a "sandbox" option. Right now we should support only "In browser (no sandbox)". 

We should have a tests that create 2 same js nodes in new workflow.
Both of this workflows have a default js script that passes an message "Hello from $nodeName" to the output using the AgentMessenger

Our FlowStudio should have an events component that shows all events including AgentMessenger events.