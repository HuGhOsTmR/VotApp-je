declare module 'qrcode' {
  interface QRCode {
    toDataURL(input: string, options?: any): Promise<string>;
  }

  const qrcode: {
    toDataURL(input: string, options?: any): Promise<string>;
  };

  export = qrcode;
}

declare module 'otplib' {
  export const authenticator: {
    generateSecret(): string;
    keyuri(user: string, service: string, secret: string): string;
    verify(options: { token: string; secret: string }): boolean;
  };
}
