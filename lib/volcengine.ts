import { Service } from '@volcengine/openapi';

export interface ResponseMetadata {
  RequestId: string;
  Action: string;
  Version: string;
  Service: string;
  Region: string;
  Error?: {
    Code: string;
    Message: string;
  };
}

export interface VolcResponse<T = any> {
  ResponseMetadata: ResponseMetadata;
  Result?: T; // For some SDK versions
  code?: number; // Business code (10000 is success)
  data?: T;      // Business data
  message?: string;
  status?: number;
}

export interface EntitySegmentResult {
  results?: Array<{
    image?: string;
    data?: string;
    [key: string]: any;
  }>;
  image_list?: string[];
  foreground_image?: string;
  image?: string;
  mask?: string;
  [key: string]: any;
}

export class VisualService extends Service {
  constructor(options?: any) {
    super({
      ...options,
      serviceName: 'cv',
      host: 'visual.volcengineapi.com',
      region: 'cn-beijing',
    });
    this.setAccessKeyId(options.accessKeyId);
    this.setSecretKey(options.secretKey)
  }

  /**
   * Generic CV Process method
   * @param action The OpenAPI Action name
   * @param body The request payload
   * @param version The API version (defaults to 2020-08-26)
   */
  async cvProcess<T = any>(
    action: string,
    body: Record<string, any>,
    version: string = '2020-08-26'
  ): Promise<VolcResponse<T>> {
    return this.fetchOpenAPI({
      Action: action,
      Version: version,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      timeout: 100000
    } as any) as Promise<VolcResponse<T>>;
  }
}

export const visualService = new VisualService({
  accessKeyId: process.env.VOLC_ACCESSKEY,
  secretKey: process.env.VOLC_SECRETKEY,
});
