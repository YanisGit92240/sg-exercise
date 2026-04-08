import http from 'k6/http';
import { check, sleep } from 'k6';

// URL de ton app (à changer une fois déployé sur Azure)
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8000';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // montée à 10 users
    { duration: '1m',  target: 50 },  // montée à 50 users
    { duration: '30s', target: 100 }, // pic à 100 users
    { duration: '30s', target: 0 },   // descente
  ],
};

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, { 'status 200': (r) => r.status === 200 });

  const res2 = http.get(`${BASE_URL}/api/message`);
  check(res2, { 'message ok': (r) => r.status === 200 });

  sleep(1);
}