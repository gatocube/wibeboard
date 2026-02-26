[x] isDone
We have registries in our app to keep track installed things

For example we have IconsRegistry for our icons. Our plugins can register new icons in this registry, the only rule for icons - that plugin should provide a fallback icon from built-in icon set in case if plugin is disabled.

In our icon selector we have a special indicator for icons installed from plugins. 

