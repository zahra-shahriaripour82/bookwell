import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { VALID_ID } from '../utils/helper.js';

export function genReqId(req: IncomingMessage, res: ServerResponse) {
  const incoming = req.headers['x-request-id'];
  const id =
    typeof incoming === 'string' && VALID_ID.test(incoming)
      ? incoming
      : randomUUID(); // keep a valid incoming id, otherwise make a new UUID
  res.setHeader('x-request-id', id);
  return id;
}
