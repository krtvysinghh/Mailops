interface RecallRequest {
  emailId: string;
  token: string;
  status: 'pending' | 'success' | 'failed';
}
const recallRequests: Map<string, RecallRequest> = new Map();

export function requestRecall(emailId: string): string {
  const token = Math.random().toString(36).substr(2, 9);
  recallRequests.set(emailId, { emailId, token, status: 'pending' });
  return token;
}

export function processRecall(emailId: string, token: string): boolean {
  const request = recallRequests.get(emailId);
  if (request && request.token === token && request.status === 'pending') {
    request.status = 'success';
    return true;
  }
  if (request) {
    request.status = 'failed';
  }
  return false;
}

export function getRecallStatus(emailId: string): string {
  const request = recallRequests.get(emailId);
  return request ? request.status : 'not_found';
}