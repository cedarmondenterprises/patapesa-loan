import { NextFunction, Request, Response } from 'express';

const durationBuckets = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];
type Labels = { method: string; route: string; status: string };
type RequestMetric = {
  labels: Labels;
  count: number;
  sum: number;
  buckets: number[];
};

const requests = new Map<string, RequestMetric>();
let activeRequests = 0;

const escapeLabel = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');

export function normalizeMetricsPath(path: string): string {
  const clean = path.split('?')[0] || '/';
  return clean
    .split('/')
    .map((part) => {
      if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(part)) return ':id';
      if (/^\d{6,}$/.test(part)) return ':number';
      if (part.length > 64) return ':value';
      return part;
    })
    .join('/');
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();
  activeRequests += 1;
  res.once('finish', () => {
    activeRequests = Math.max(0, activeRequests - 1);
    const seconds = Number(process.hrtime.bigint() - started) / 1_000_000_000;
    const labels: Labels = {
      method: (req.method || 'UNKNOWN').slice(0, 12),
      route: normalizeMetricsPath(req.path || '/'),
      status: String(res.statusCode),
    };
    const key = JSON.stringify(labels);
    const metric =
      requests.get(key) ||
      ({ labels, count: 0, sum: 0, buckets: durationBuckets.map(() => 0) } as RequestMetric);
    metric.count += 1;
    metric.sum += seconds;
    durationBuckets.forEach((bucket, index) => {
      if (seconds <= bucket) metric.buckets[index] += 1;
    });
    requests.set(key, metric);
  });
  next();
}

export function renderMetrics(): string {
  const memory = process.memoryUsage();
  const lines = [
    '# HELP patapesa_process_uptime_seconds Process uptime in seconds.',
    '# TYPE patapesa_process_uptime_seconds gauge',
    `patapesa_process_uptime_seconds ${process.uptime()}`,
    '# HELP patapesa_process_resident_memory_bytes Resident memory used by the backend process.',
    '# TYPE patapesa_process_resident_memory_bytes gauge',
    `patapesa_process_resident_memory_bytes ${memory.rss}`,
    '# HELP patapesa_process_heap_used_bytes JavaScript heap memory currently used.',
    '# TYPE patapesa_process_heap_used_bytes gauge',
    `patapesa_process_heap_used_bytes ${memory.heapUsed}`,
    '# HELP patapesa_http_active_requests Requests currently being processed.',
    '# TYPE patapesa_http_active_requests gauge',
    `patapesa_http_active_requests ${activeRequests}`,
    '# HELP patapesa_http_requests_total Completed HTTP requests.',
    '# TYPE patapesa_http_requests_total counter',
  ];

  const ordered = [...requests.values()].sort((a, b) =>
    JSON.stringify(a.labels).localeCompare(JSON.stringify(b.labels)),
  );
  for (const metric of ordered) {
    const labels = `method="${escapeLabel(metric.labels.method)}",route="${escapeLabel(
      metric.labels.route,
    )}",status="${escapeLabel(metric.labels.status)}"`;
    lines.push(`patapesa_http_requests_total{${labels}} ${metric.count}`);
  }

  lines.push(
    '# HELP patapesa_http_request_duration_seconds HTTP request duration in seconds.',
    '# TYPE patapesa_http_request_duration_seconds histogram',
  );
  for (const metric of ordered) {
    const labels = `method="${escapeLabel(metric.labels.method)}",route="${escapeLabel(
      metric.labels.route,
    )}",status="${escapeLabel(metric.labels.status)}"`;
    durationBuckets.forEach((bucket, index) => {
      lines.push(
        `patapesa_http_request_duration_seconds_bucket{${labels},le="${bucket}"} ${metric.buckets[index]}`,
      );
    });
    lines.push(
      `patapesa_http_request_duration_seconds_bucket{${labels},le="+Inf"} ${metric.count}`,
      `patapesa_http_request_duration_seconds_sum{${labels}} ${metric.sum}`,
      `patapesa_http_request_duration_seconds_count{${labels}} ${metric.count}`,
    );
  }
  return `${lines.join('\n')}\n`;
}
