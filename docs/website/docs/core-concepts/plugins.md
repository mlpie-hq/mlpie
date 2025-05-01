---
sidebar_position: 2
title: Plugin System
description: Understanding the core plugin architecture in MLPie
---

# Plugin System

Plugins are at the core of MLPie's architecture, providing a flexible and extensible framework for integrating with various tools, services, and infrastructure components in your ML workflow. The plugin system allows MLPie to support a wide range of technologies while maintaining a consistent interface.

## Plugin Architecture

MLPie's plugin system is designed to be:

- **Modular**: Each plugin serves a specific purpose and can be used independently
- **Extensible**: New plugin types can be added as MLPie evolves
- **Configurable**: Plugins can be configured to meet specific requirements
- **Discoverable**: Plugins are automatically discovered when installed

## Plugin Types

MLPie supports various types of plugins, each designed for specific functionality:

- **Secret Provider**: Manage secrets and credentials
- **Git Provider**: Integrate with Git repositories
- **Database Provider**: Connect to various database systems
- **Storage Provider**: Interact with object storage services
- **Model Registry**: Manage ML model artifacts
- **Workflow Engine**: Execute and monitor workflows
- **Notification**: Send notifications about job status
- **Authentication**: Handle user authentication
- **Metrics**: Collect and monitor metrics
- **Custom**: Implement specialized functionality

## Installing Plugins

MLPie plugins can be installed using pip:

```bash
pip install mlpie-plugin-name
```

Plugins can also be installed from source:

```bash
git clone https://github.com/author/mlpie-plugin-name.git
cd mlpie-plugin-name
pip install -e .
```

## Configuring Plugins

Plugins are configured through MLPie's configuration system. Each plugin has its own configuration section:

```yaml
plugins:
  secret_provider:
    type: env
    config:
      prefix: MLPIE_
  
  storage_provider:
    type: s3
    config:
      bucket: my-mlpie-bucket
      region: us-west-2
```

## Creating Plugins

MLPie's plugin system is designed to be easy to extend. By creating custom plugins, you can integrate MLPie with your specific tools and services.

See the following pages for detailed guides on creating specific types of plugins:

- [Creating Secret Provider Plugins](../plugins/secret-provider.md)
- [Creating Git Provider Plugins](../plugins/git-provider.md)
- [Creating Database Provider Plugins](../plugins/database-provider.md)
- [Creating Storage Provider Plugins](../plugins/storage-provider.md)
- [Creating Model Registry Plugins](../plugins/model-registry.md)
- [Creating Workflow Engine Plugins](../plugins/workflow-engine.md)
- [Creating Notification Plugins](../plugins/notification.md)
- [Creating Authentication Plugins](../plugins/authentication.md)
- [Creating Metrics Plugins](../plugins/metrics.md)
- [Creating Custom Plugins](../plugins/custom.md) 