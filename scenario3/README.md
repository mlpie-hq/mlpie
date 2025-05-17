# Scenario 3: Full Hierarchical Repository Delegation

## Repository Structure
In this scenario:
- Only project definitions are stored in the master repository
- Each project specifies its own repository for environments
- Each environment specifies its own repository for resources

```
master-repo/
└── projects/
    ├── project1.yaml  # Points to project1-environments repo
    └── project2.yaml  # Points to project2-environments repo

project1-environments-repo/
└── environments/
    └── dev.yaml  # Points to project1-dev-resources repo

project2-environments-repo/
└── environments/
    ├── dev.yaml   # Points to project2-dev-resources repo
    └── prod.yaml  # Points to project2-prod-resources repo

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
2. Projects are discovered from the master repository
3. For each project, check if an environments repository is specified:
   - Schedule a separate job to scan that repository with context about which project it's for
4. For each environment discovered in project-specific repositories:
   - Check if a resources repository is specified
   - Schedule a separate job to scan that repository with context about which project and environment it's for

## Scheduling Details
- One polling job for the master repository
- One polling job for each project's environment repository
- One polling job for each environment's resource repository
- Each job carries context about its place in the hierarchy

## Job Scheduling Chain
1. Master repository scan job runs and finds projects
2. For each project with specified environments repository:
   - Creates a new job to scan that repository
   - Passes context: project name
3. Project environments repository jobs run and find environments
   - Each environment knows which project it belongs to
   - For each environment with a specified resources repository:
     - Creates a new job to scan that repository
     - Passes context: project name, environment name
4. Environment resource repository jobs run and find datasets and pipelines
   - Each resource is tagged with its project and environment

## Key Benefits
- Maximum isolation: Each level of the hierarchy can be managed separately
- Full team autonomy: Project teams, environment teams, and resource teams can work independently
- Clear separation of concerns
- Highly scalable approach for large organizations

## Considerations
- Most complex scheduling and coordination
- Requires robust context passing between jobs
- Resources must correctly reference their parent project and environment
- More repositories to maintain and keep synchronized

## Implementation Requirements
1. Repository job scheduler must support hierarchical job creation
2. Each scanning job must:
   - Maintain context about where it fits in the hierarchy
   - Pass this context to child jobs it creates
   - Tag discovered entities with their hierarchical context
3. Reconciliation process must respect the hierarchical relationships

## When to Use
This pattern is well-suited for:
- Large organizations with multiple teams
- Projects with complex environment structures
- Situations requiring strict separation between teams
- Organizations with dedicated teams for different parts of the ML pipeline 