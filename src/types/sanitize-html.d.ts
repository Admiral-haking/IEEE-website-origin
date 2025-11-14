declare module 'sanitize-html' {
  export interface IOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedStyles?: Record<string, Record<string, (RegExp | string)[]>>;
    allowedSchemes?: string[];
    allowedSchemesByTag?: Record<string, string[]>;
    disallowedTagsMode?: 'discard' | 'recursiveEscape';
  }

  export interface Defaults {
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
  }

  interface SanitizeHtmlFn {
    (dirty: string, options?: IOptions): string;
    defaults: Defaults;
  }

  const sanitizeHtml: SanitizeHtmlFn;
  export default sanitizeHtml;
}

