import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
  }
}

// Implementing security headers and Content Security Policy (CSP) helps mitigate common web security vulnerabilities 
// such as XSS and clickjacking attacks. NestJS allows you to configure security headers and CSP using middleware and global filters.