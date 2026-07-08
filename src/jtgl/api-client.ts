import { SOURCE } from './constants.js';

type ApiResponse = {
  code?: number;
  msg?: string;
  message?: string;
  data?: unknown;
};

export class ApiClient {
  private sessionReady = false;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async listVehicles(): Promise<unknown> {
    const result = await this.callApi('pro/vehicleController/getUserIdInfo', {});
    return result.data;
  }

  async getUserInfo(): Promise<unknown> {
    const result = await this.callApi('pro/applyRecordController/getJsrxx', {});
    return result.data;
  }

  async getStateData(): Promise<unknown> {
    const result = await this.callApi('pro/applyRecordController/stateList', {});
    return result.data;
  }

  async submitApply(payload: Record<string, unknown>): Promise<unknown> {
    return this.callApi('pro/applyRecordController/insertApplyRecord', payload);
  }

  private async ensureSession(): Promise<void> {
    if (this.sessionReady) return;
    const url = `${this.baseUrl.replace(/\/+$/, '')}/auth/userController/loginUser?state=101000004071`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.token,
        'Content-Type': 'application/json',
        Source: SOURCE,
      },
      body: JSON.stringify({ token: this.token, state: '101000004071' }),
    });
    const result = (await response.json()) as ApiResponse;
    if (result.code !== 200) {
      throw new Error(
        `Session activation failed: code=${result.code}, msg=${
          result.msg || result.message || JSON.stringify(result)
        }`,
      );
    }
    this.sessionReady = true;
  }

  private async callApi(path: string, data: Record<string, unknown>): Promise<ApiResponse> {
    if (!path.includes('loginUser')) await this.ensureSession();
    const response = await fetch(`${this.baseUrl.replace(/\/+$/, '')}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: this.token,
        'Content-Type': 'application/json',
        Source: SOURCE,
      },
      body: JSON.stringify(data),
    });
    const result = (await response.json()) as ApiResponse;
    if (result.code !== 200) {
      throw new Error(
        `API error [${path}]: code=${result.code}, msg=${
          result.msg || result.message || JSON.stringify(result)
        }`,
      );
    }
    return result;
  }
}
