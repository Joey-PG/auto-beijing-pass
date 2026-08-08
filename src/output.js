import { writeAppLog } from './lib/audit-logger.js';

export function output(data) {
  if (data.success === false) {
    writeAppLog('error', data.message);
    console.error(`错误: ${data.message}`);
  } else {
    writeAppLog('info', data.message || '');
    console.log(data.message || '');
  }
}

export function success(data, message) {
  return { success: true, data, message };
}

export function error(message, data = null) {
  return { success: false, data, message };
}
