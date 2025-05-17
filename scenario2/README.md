# Scenario 2: Projects and Environments in Master Repository, Resources in Separate Repositories

## Repository Structure
In this scenario:
- Projects and environments are defined in the master repository
- Each environment specifies its own repository for resources (datasets and pipelines)

```
master-repo/
├── projects/              # Project definitions
│   ├── project1.yaml
│   └── project2.yaml
└── environments/          # Environment definitions
    ├── project1-dev.yaml  # Points to project1-dev-resources repo
    ├── project2-dev.yaml  # Points to project2-dev-resources repo
    └── project2-prod.yaml # Points to project2-prod-resources repo

project1-dev-resources-repo/
├── datasets/
│   └── customers.yaml
└── pipelines/
    └── etl.yaml

project2-dev-resources-repo/
├── datasets/
│   └── customers.yaml
└── pipelines/
    └── etl.yaml

project2-prod-resources-repo/
├── datasets/
│   └── customers.yaml
└── pipelines/
    └── etl.yaml
```

## Scanning Process
1. Master repository is scanned on a regular interval
2. Projects are discovered first
3. For each project, environments are discovered from the master repository
4. For each environment, check if a resources repository is specified:
   - If specified, schedule a separate job to scan that repository with context about which project and environment it's for
   - If not specified, look for resources in the master repository

## Scheduling Details
- One polling job for the master repository
- One polling job for each environment-specific resource repository
- Jobs maintain metadata about which project/environment they belong to

## Job Scheduling Chain
1. Master repository scan job runs and finds projects and environments
2. For each environment with a specified resources repository:
   - Creates a new job to scan that repository
   - Passes context: project name, environment name
3. Environment resource repository jobs run and find datasets and pipelines
   - Each resource is tagged with its project and environment

## Key Benefits
- Resource isolation: Each environment's resources can be managed separately
- Team autonomy: Resource teams can work independently of project/environment management
- Better scalability than single-repository approach

## Considerations
- More complex scheduling and coordination
- Resources must correctly reference their parent project and environment
- Need to ensure context is properly passed between scanning jobs

## When to Use
This pattern is well-suited for:
- Medium-sized teams with dedicated environment teams
- Organizations where resources change more frequently than project/environment definitions
- Projects that need to isolate resource definitions from core project/environment configuration 