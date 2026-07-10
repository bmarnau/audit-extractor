/**
 * Jobs API Client
 * 
 * Frontend HTTP client für Job API Kommunikation
 * 
 * @version 0.21.0
 * @phase 21
 */

import axios, { AxiosError } from 'axios';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_TIMEOUT = 30000;

// Types
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Job {
  id: string;
  status: JobStatus;
  jobType?: string;
  requestedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  duration: number;
  userId?: string;
  documentId?: string;
  description?: string;
  retryCount: number;
  errorMessage?: string | null;
}

export interface JobCreateRequest {
  documentContent: string;
  ruleSet?: any;
  extractionConfig?: any;
  jobType?: string;
  description?: string;
}

export interface JobResult {
  status: JobStatus;
  result?: any;
  error?: string;
  details?: any;
  message?: string;
  duration?: number;
  completedAt?: string;
}

export interface QueryJobsOptions {
  status?: JobStatus;
  jobType?: string;
  limit?: number;
  offset?: number;
}

export interface JobsListResponse {
  jobs: Array<{
    id: string;
    status: JobStatus;
    jobType?: string;
    requestedAt: string;
    duration: number;
  }>;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface DeadLetterJob {
  id: string;
  status: JobStatus;
  jobType?: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  failedAt?: string;
}

export interface DeadLetterQueueResponse {
  deadLetterJobs: DeadLetterJob[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Create axios instance
const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.data?.error) {
      return Promise.reject(error.response.data.error as ApiError);
    }
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: error.message || 'Network request failed',
    } as ApiError);
  }
);

// Job API Client
export const jobsApi = {
  /**
   * Create a new job
   */
  async createJob(request: JobCreateRequest): Promise<{ id: string; status: JobStatus }> {
    const response = await client.post('/jobs', request);
    return response.data.data;
  },

  /**
   * Get job details
   */
  async getJob(jobId: string): Promise<Job> {
    const response = await client.get(`/jobs/${jobId}`);
    return response.data.data;
  },

  /**
   * Get job result
   */
  async getJobResult(jobId: string): Promise<JobResult> {
    const response = await client.get(`/jobs/${jobId}/result`);
    return response.data.data;
  },

  /**
   * List jobs with filters
   */
  async listJobs(options?: QueryJobsOptions): Promise<JobsListResponse> {
    const params = {
      status: options?.status,
      jobType: options?.jobType,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    };

    // Remove undefined params
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params];
      }
    });

    const response = await client.get('/jobs', { params });
    return response.data.data;
  },

  /**
   * Cancel/delete a job
   */
  async cancelJob(jobId: string): Promise<{ id: string; status: JobStatus }> {
    const response = await client.delete(`/jobs/${jobId}`);
    return response.data.data;
  },

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string, immediate: boolean = true): Promise<Job> {
    const response = await client.post(`/jobs/${jobId}/retry`, { immediate });
    return response.data.data;
  },

  /**
   * Get dead-letter queue
   */
  async getDeadLetterQueue(limit: number = 50, offset: number = 0): Promise<DeadLetterQueueResponse> {
    const response = await client.get('/jobs/dead-letter/queue', {
      params: { limit, offset },
    });
    return response.data.data;
  },

  /**
   * Analyze dead-letter job
   */
  async analyzeDeadLetterJob(jobId: string): Promise<any> {
    const response = await client.get(`/jobs/dead-letter/analyze/${jobId}`);
    return response.data.data;
  },

  /**
   * Get job statistics
   */
  async getStatistics(): Promise<any> {
    const response = await client.get('/jobs/stats/summary');
    return response.data.data;
  },

  /**
   * Poll job status with automatic retries
   */
  async pollJobStatus(
    jobId: string,
    options: {
      maxAttempts?: number;
      delayMs?: number;
      timeout?: number;
    } = {}
  ): Promise<{ job: Job; result: JobResult }> {
    const maxAttempts = options.maxAttempts || 60; // 5 minutes with 5s interval
    const delayMs = options.delayMs || 5000;
    const timeout = options.timeout || 300000; // 5 minutes default

    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (Date.now() - startTime > timeout) {
        throw {
          code: 'POLL_TIMEOUT',
          message: `Job polling timed out after ${timeout}ms`,
        } as ApiError;
      }

      try {
        const job = await this.getJob(jobId);
        const result = await this.getJobResult(jobId);

        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          return { job, result };
        }

        // Not done yet, wait and retry
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempts++;
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
        throw error;
      }
    }

    throw {
      code: 'POLL_MAX_ATTEMPTS',
      message: `Job polling exceeded max attempts (${maxAttempts})`,
    } as ApiError;
  },
};

export default jobsApi;
