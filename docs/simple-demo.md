The goal for uilder Demo Simple is to allow tests to build a basic flow from scratch.
Tests should include steps:

Let have a test for Builder Demo Simple
- ensure we start with only one starting node
- ensure starting node have no "Before" button
- click After -> Job // create a default job node (js script)
- on new node click After -> Job -> User // creates a user node
- on user node click Before -> Recent -> Job // creates a 2 way connected node
- on just created node click -> config -> delete // checks node is deleted, but before and after nodes are connected
- click undo // check node is restored (use automerge state for redo/undo)
- add a new js node after user node and click config // make sure the Config Component for node is visible
