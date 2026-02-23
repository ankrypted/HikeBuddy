export interface JwtPayload {
  sub:       string;
  username:  string;
  email:     string;
  avatarUrl: string | null;
  roles:     string[];
  iat:       number;
  exp:       number;
}

/**
 * Decodes the payload of a JWT without verifying the signature.
 * Signature verification happens on the server; this is purely for
 * reading claims on the client side after a trusted server redirect.
 */
export function decodeJwtPayload(token: string): JwtPayload {
  const base64 = token.split('.')[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
  return JSON.parse(json) as JwtPayload;
}
