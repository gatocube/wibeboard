# Grid sizing guidelines

We should always be sure that our app is comfortable to use on tablet devices such as iPad. 

We use grid units for positioning and sizing nodes. 

Minimal node size is 3x3 grid units.

3x3 grid units = 64x64 px. That consider to be a comfortable size to tap on with a finger.
When we start new workflow we display an start node exactly in this size.

When we create a new node we automatically keep distance in 5 grid units from previous node.
The minimal distance between nodes is 1 grid unit.

When we create new node and there are not enough space around than we move other nodes.
We use this algorithm https://reactflow.dev/examples/layout/node-collisions

The starting node center is always at (0, 0).