# Scenario 1: All Resources in Master Repository

## Repository Structure
In this scenario, all entities (projects, environments, datasets, pipelines) are stored in the master repository:

```
master-repo/
├── projects/              # Project definitions
│   ├── project1.yaml
│   └── project2.yaml
├── environments/          # Environment definitions
│   ├── project1-dev.yaml
│   ├── project2-dev.yaml
│   └── project2-prod.yaml
├── datasets/              # Dataset definitions
│   ├── project1-dev-customers.yaml
│   ├── project2-dev-customers.yaml
│   └── project2-prod-customers.yaml
└── pipelines/             # Pipeline definitions
    ├── project1-dev-etl.yaml
    ├── project2-dev-etl.yaml
    └── project2-prod-etl.yaml
```

## Scanning Process
1. Master repository is scanned on a regular interval
2. Projects are discovered first
3. For each project, environments are discovered from the master repository
4. For each environment, resources (datasets and pipelines) are discovered from the master repository

## Scheduling Details
- One polling job for the master repository
- No additional jobs are scheduled since all entities are in the master repository

## Key Benefits
- Simplicity: All definitions are in one place
- Centralized management: Changes to any entity can be tracked in a single repository
- No coordination needed between multiple repositories

## Considerations
- Limited isolation: All teams must share the same repository
- May become unwieldy as the number of projects, environments, and resources grows
- Potential for merge conflicts if multiple teams are modifying different parts simultaneously

## When to Use
This pattern is well-suited for:
- Small teams or organizations
- Early-stage projects with limited complexity
- Scenarios where centralized oversight is required 