import { createHmac } from 'node:crypto';

type NotifyHandler = (path: string, title: string, body: string) => Promise<void>;

function parseNotifyUrl(url: string): { scheme: string; path: string } | null {
  const match = url.match(/^(\w+):\/\/(.+)$/);
  if (!match) return null;
  return { scheme: match[1], path: match[2] };
}

async function sendBark(path: string, title: string, body: string): Promise<void> {
  const parts = path.split('/');
  const server = parts.length === 1 ? 'api.day.app' : parts[0];
  const key = parts.length === 1 ? parts[0] : parts.slice(1).join('/');
  const url = `https://${server}/${key}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Bark HTTP ${response.status}`);
}

async function sendTelegram(path: string, title: string, body: string): Promise<void> {
  const index = path.lastIndexOf('/');
  if (index === -1) throw new Error('Invalid Telegram URL: missing chat_id');
  const token = path.slice(0, index);
  const chatId = path.slice(index + 1);
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `*${title}*\n${body}`,
      parse_mode: 'Markdown',
    }),
  });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
}

async function sendDingTalk(path: string, title: string, body: string): Promise<void> {
  const [token, secret] = path.split('/');
  let url = `https://oapi.dingtalk.com/robot/send?access_token=${token}`;
  if (secret) {
    const timestamp = Date.now();
    const sign = encodeURIComponent(
      createHmac('sha256', secret).update(`${timestamp}\n${secret}`).digest('base64'),
    );
    url += `&timestamp=${timestamp}&sign=${sign}`;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msgtype: 'text', text: { content: `${title}\n${body}` } }),
  });
  if (!response.ok) throw new Error(`DingTalk HTTP ${response.status}`);
}

async function sendWeCom(path: string, title: string, body: string): Promise<void> {
  const response = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msgtype: 'text', text: { content: `${title}\n${body}` } }),
  });
  if (!response.ok) throw new Error(`WeCom HTTP ${response.status}`);
}

async function sendFeishu(path: string, title: string, body: string): Promise<void> {
  const [hookId, secret] = path.split('/');
  const payload: Record<string, unknown> = {
    msg_type: 'text',
    content: { text: `${title}\n${body}` },
  };
  if (secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sign = createHmac('sha256', `${timestamp}\n${secret}`)
      .update(Buffer.alloc(0))
      .digest('base64');
    payload.timestamp = timestamp;
    payload.sign = sign;
  }
  const response = await fetch(`https://open.feishu.cn/open-apis/bot/v2/hook/${hookId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Feishu HTTP ${response.status}`);
}

async function sendSlack(path: string, title: string, body: string): Promise<void> {
  const response = await fetch(`https://hooks.slack.com/services/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `*${title}*\n${body}` }),
  });
  if (!response.ok) throw new Error(`Slack HTTP ${response.status}`);
}

async function sendJson(path: string, title: string, body: string): Promise<void> {
  const index = path.indexOf('/');
  const host = index === -1 ? path : path.slice(0, index);
  const urlPath = index === -1 ? '' : path.slice(index);
  const response = await fetch(`https://${host}${urlPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
  if (!response.ok) throw new Error(`Webhook HTTP ${response.status}`);
}

const handlers: Record<string, NotifyHandler> = {
  bark: sendBark,
  barks: sendBark,
  tgram: sendTelegram,
  dingtalk: sendDingTalk,
  wecom: sendWeCom,
  feishu: sendFeishu,
  slack: sendSlack,
  json: sendJson,
};

export async function notify(
  urls: string[],
  title: string,
  body: string,
): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(
    urls.map(async (url) => {
      const parsed = parseNotifyUrl(url);
      if (!parsed) throw new Error('Invalid notify URL');
      const handler = handlers[parsed.scheme];
      if (!handler) throw new Error(`Unsupported notify scheme: ${parsed.scheme}`);
      await handler(parsed.path, title, body);
    }),
  );
}

export async function testNotify(urls: string[]): Promise<PromiseSettledResult<void>[]> {
  return notify(urls, '测试通知 / Test Notification', '如果你看到这条消息，说明通知配置正确。');
}
