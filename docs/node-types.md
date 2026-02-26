

```json
{
    // fields for all nodes
    "id": "node-1",
    "type": "job",
    "subType": "script",
    "preset": "js",
    "label": "Run Tests",

    // state of that can be changed during execution
    "state": {
        "status": "running",
        "currentTask": "Running tests",
        "thought": "Assert no errors when project starts",
        "progress": 55,
        "execTime": "1.3s",
        "callsCount": 3,
    },

    // fields that can be changed during workflow editing
    // widget preset defines default values for config fields if not specified here
    "config": {
        
        "ui": {
            theme // defines theme like github dark, if not set global theme is used
            transform // could be empty, defines position and size in grid units
            icons: {
                default: "scan",
                working: "scan-line"
            }
        }
        
    }
}
```

Defining preset in widget manifest example:
```json
{
    "presets": {
        "js": {
            "id": "js",
            "label": "JavaScript",
            "icon": "js",
            "config": {
                "script": "console.log('Hello World');",
                "sandbox": false,
                "timeout": 5000,
                "retries": 0,
                "ui": {
                    "icons": {
                        "default": "js",
                    }
                }
            }
        }
    }
}
```