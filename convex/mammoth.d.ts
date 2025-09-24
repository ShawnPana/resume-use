declare module 'mammoth' {
  interface ConvertOptions {
    path?: string;
    buffer?: Buffer;
    arrayBuffer?: ArrayBuffer;
  }

  interface ConvertResult<T> {
    value: T;
    messages: any[];
  }

  export function extractRawText(options: ConvertOptions): Promise<ConvertResult<string>>;
  export function convertToHtml(options: ConvertOptions): Promise<ConvertResult<string>>;
  export function convertToMarkdown(options: ConvertOptions): Promise<ConvertResult<string>>;

  const mammoth: {
    extractRawText: (options: ConvertOptions) => Promise<ConvertResult<string>>;
    convertToHtml: (options: ConvertOptions) => Promise<ConvertResult<string>>;
    convertToMarkdown: (options: ConvertOptions) => Promise<ConvertResult<string>>;
  };

  export default mammoth;
}