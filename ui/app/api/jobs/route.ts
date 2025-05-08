import { NextResponse } from "next/server";

// Mock data for jobs
const mockJobs = [
  {
    id: "1",
    name: "Profile Dataset: Customer Data",
    job_type: "profile_dataset",
    status: "completed",
    progress: 100,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    dataset_id: "dataset-1",
    environment_id: "env-1",
  },
  {
    id: "2",
    name: "Training Model: Customer Churn",
    job_type: "model_training",
    status: "running",
    progress: 75,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    dataset_id: "dataset-2",
    environment_id: "env-1",
  },
  {
    id: "3",
    name: "Data Sync: Product Database",
    job_type: "data_sync",
    status: "failed",
    progress: 50,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    dataset_id: "dataset-3",
    environment_id: "env-2",
  },
  {
    id: "4",
    name: "Model Evaluation: NLP Classifier",
    job_type: "model_evaluation",
    status: "pending",
    progress: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
    dataset_id: "dataset-4",
    environment_id: "env-2",
  },
  {
    id: "5",
    name: "Profile Dataset: Transaction Data",
    job_type: "profile_dataset",
    status: "failed",
    progress: 30,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    dataset_id: "dataset-5",
    environment_id: "env-1",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const jobType = searchParams.get("job_type");
  const limit = parseInt(searchParams.get("limit") || "100");
  const skip = parseInt(searchParams.get("skip") || "0");

  // Filter jobs based on query parameters
  let filteredJobs = [...mockJobs];

  if (status) {
    const statuses = status.split(",");
    filteredJobs = filteredJobs.filter((job) => statuses.includes(job.status));
  }

  if (jobType) {
    filteredJobs = filteredJobs.filter((job) => job.job_type === jobType);
  }

  // Apply pagination
  const paginatedJobs = filteredJobs.slice(skip, skip + limit);

  return NextResponse.json(paginatedJobs);
}
