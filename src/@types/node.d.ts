/**
 * Stub type declarations for Node.js
 */

declare global {
  interface Buffer extends Uint8Array {
    toString(encoding?: string): string;
    toJSON(): { type: 'Buffer'; data: number[] };
  }

  interface BufferConstructor {
    from(data: string | Uint8Array | ArrayBuffer | number[], encoding?: string): Buffer;
    alloc(size: number, fill?: number | string | Buffer): Buffer;
    allocUnsafe(size: number): Buffer;
    concat(list: Uint8Array[], totalLength?: number): Buffer;
    isBuffer(obj: any): obj is Buffer;
    byteLength(string: string, encoding?: string): number;
  }

  var Buffer: BufferConstructor;

  namespace NodeJS {
    type Timer = ReturnType<typeof setInterval>;
    type Timeout = ReturnType<typeof setTimeout>;
  }
}

export {};
