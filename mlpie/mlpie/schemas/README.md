# MLPie Schemas

This package contains Pydantic schema models for validating entity YAML files in MLPie.

## Overview

The schema models provide:

1. Strong validation of YAML files with detailed error messages
2. Type checking and conversion
3. Clean separation of validation logic from database models
4. Consistent validation across the application

## Usage

### Validating YAML Files

```python
from mlpie.schemas.yaml_utils import parse_entity_from_yaml

# Parse and validate a YAML file
entity, errors = parse_entity_from_yaml("path/to/file.yaml")

if errors:
    # Handle validation errors
    for error in errors:
        print(f"Error: {error['message']}")
else:
    # Use the validated entity
    print(f"Valid {entity.kind} found: {entity.metadata.get('name')}")
    
    # Convert to database model fields
    db_dict = entity.to_db_dict()
    # Use db_dict with your SQLAlchemy model
    db_entity = YourModelClass(**db_dict)
```

### Creating New Entities

```python
from mlpie.schemas.base import EntityKind
from mlpie.schemas.yaml_utils import create_entity_from_dict, entity_to_yaml

# Create data dictionary
data = {
    "metadata": {
        "name": "my-project",
        "description": "My awesome project"
    },
    "spec": {
        "status": "active",
        "owner": "user@example.com"
    }
}

# Create and validate entity
entity, errors = create_entity_from_dict(EntityKind.PROJECT, data)

if not errors:
    # Convert to YAML
    yaml_str = entity_to_yaml(entity)
    
    # Save to file
    with open("my-project.yaml", "w") as f:
        f.write(yaml_str)
```

## Schema Structure

Each entity type has its own schema:

- `ProjectSpec`: Validates Project entities
- `EnvironmentSpec`: Validates Environment entities
- `DatasetSpec`: Validates Dataset entities
- `PipelineSpec`: Validates Pipeline entities

All schemas inherit from `EntityBase` which provides common validation for kind and apiVersion fields.

## YAML Format

All entity YAML files follow a Kubernetes-like format:

```yaml
apiVersion: mlpie/v1
kind: Dataset
metadata:
  name: "example-dataset"
  description: "Example dataset"
  labels:
    - "demo"
    - "example"
spec:
  format: "csv"
  environment: "development"
  # Other entity-specific fields
```

## Extending

To add a new entity type:

1. Create a new schema file (e.g., `myentity.py`)
2. Define a class that inherits from `EntityBase`
3. Set `EXPECTED_KIND` to your entity type
4. Add validation methods and a `to_db_dict()` method
5. Add your entity type to `ENTITY_TYPE_MAPPING` in `yaml_utils.py`

## Testing

Run the schema tests with:

```bash
pytest tests/schemas/
``` 