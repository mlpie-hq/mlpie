---
sidebar_position: 1
title: Plugin Development
description: Learn how to develop plugins for MLPie
---

# Plugin Development

MLPie's plugin system allows developers to extend its functionality in a modular way. This section provides guides for developing different types of plugins for MLPie.

## Overview

All MLPie plugins follow a common structure and inherit from the base `Plugin` class. Each plugin must:

1. Provide metadata via the `PluginMetadata` class
2. Implement required methods such as `initialize`, `validate_config`, and `shutdown`
3. Use the `@register_plugin` decorator to register with MLPie

## Plugin Development Workflow

The general workflow for developing a plugin is:

1. Create a new Python package
2. Define your plugin class extending from both `Plugin` and the appropriate interface
3. Implement the required methods
4. Add plugin discovery through entry points in your `setup.py`
5. Test and publish your plugin

## Registering Your Plugin

MLPie discovers plugins using Python's entry points mechanism. This requires adding the following to your package's `setup.py`:

```python
setup(
    # ... other setup parameters
    entry_points={
        "mlpie.plugins": [
            "your_plugin_name = your_package.module:YourPluginClass",
        ],
    },
)
```

## Plugin Interfaces

Each plugin type has its own interface that your plugin must implement. These interfaces define the specific methods required for that plugin type.

## Further Reading

Choose a specific plugin type from the sidebar to learn more about developing that type of plugin. 