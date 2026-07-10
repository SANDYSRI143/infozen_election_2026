# VOTING — Security Implementation Guide

## Overview
VOTING implements multiple layers of security to ensure integrity of the election process:
1. **Database Level**: Row Level Security (RLS)
2. **API Level**: Rate limiting, input validation, authentication  
3. **Application Level**: Session management, CSRF protection
4. **Infrastructure Level**: HTTPS, security headers, DDoS protection

## Authentication & Authorization

### Student Authentication Flow

```
Student Credentials → Backend Validation → OTP Generation
        ↓
    OTP Sent → Student Verifies OTP → CAPTCHA Check
        ↓
  Session Created (JWT) → Vote Page → Submit Vote
        ↓
    Vote Validated → Stored Immutably → Session Destroyed
```

**Validation Steps:**
1. Register number format (alphanumeric)
2. DOB matches database
3. Mobile number matches database
4. Student hasn't already voted
5. Election is active
6. OTP is valid (not expired)
7. CAPTCHA is valid
8. Vote has all 6 positions
9. Candidates are active and correct position
10. Unique constraint on (student_id, position)

### Admin Authentication
- Email/password via Supabase Auth
- JWT token created
- Session stored in httpOnly cookie
- Role validation on each request

### Session Security
```javascript
// JWT Token Details
{
  student_id: UUID,
  register_number: string,
  exp: Unix timestamp (30 min future),
  iat: Unix timestamp (now),
  alg: "HS256"
}

// Cookie Settings
{
  httpOnly: true,        // XSS protection
  secure: true,          // HTTPS only
  sameSite: "lax",       // CSRF protection
  maxAge: 1800 seconds,  // 30 minutes
  path: "/"
}
```

## Input Validation

### Student Data
```typescript
// Register Number
- Length: 1-20 chars
- Format: Alphanumeric only
- Unique: DB constraint

// DOB
- Format: YYYY-MM-DD
- Cannot be future date
- Matched against database

// Mobile Number
- Length: 10-15 digits
- Format: Digits only
- Unique: DB constraint

// OTP
- Length: Exactly 6 digits
- Expiry: 5 minutes
- Unique per mobile+request
```

### Candidate Data
```typescript
// Candidate Name
- Length: 1-100 chars
- Required

// Position
- Enum: One of 6 positions
- Required

// Department
- Length: 1-100 chars
- Required

// Bio/Vision/Achievements/Quote
- Optional
- Max lengths enforced
- HTML sanitized on display
```

### Vote Data
```typescript
{
  votes: [
    {
      position: enum (required),
      candidate_id: UUID (required, valid)
    },
    ... 6 total, all unique positions
  ]
}
```

## Rate Limiting

### Per-IP Limits
| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/send-otp | 5 | 5 min |
| POST /api/auth/login | 15 | 10 min |
| POST /api/vote/submit | 1 | 1 hour |
| Admin endpoints | 10 | 5 min |

### Implementation
- Sliding window algorithm
- In-memory store (can be Redis for distributed)
- Transparent to users (returns 429 if exceeded)
- Logged in audit trail

## SQL Injection Prevention

### Techniques
1. **Parameterized Queries**: All database queries use parameters
   ```typescript
   // ✅ Safe
   await supabase.from("students")
       .select("*")
       .eq("register_number", userInput);
   
   // ❌ Never do this
   await supabase.rpc(`SELECT * FROM students WHERE register_number = '${userInput}'`);
   ```

2. **ORM Usage**: Supabase client handles escaping
3. **Input Validation**: Zod schemas validate before query
4. **Type Safety**: TypeScript prevents unexpected types

### RLS Policies
```sql
-- Service role only (our API uses this)
CREATE POLICY "Service role full access to votes"
  ON votes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public read candidates
CREATE POLICY "Anyone can read active candidates"
  ON candidates FOR SELECT
  USING (status = 'active');
```

## Cross-Site Scripting (XSS) Prevention

### Techniques
1. **React Auto-Escaping**: JSX escapes by default
2. **Content Security Policy**:
   ```
   default-src 'self'
   script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/
   style-src 'self' 'unsafe-inline'
   img-src 'self' data: https:
   ```

3. **No Inline Scripts**: All scripts in separate files
4. **Sanitization**: User input sanitized before display
5. **httpOnly Cookies**: Session tokens not accessible to JavaScript

## Cross-Site Request Forgery (CSRF) Protection

### Techniques
1. **SameSite Cookies**: `sameSite: "lax"` on all cookies
2. **No Simple Requests**: All vote submissions are POST/PUT
3. **Custom Headers**: API validates Content-Type
4. **Middleware Protection**: Validates session before mutation

```typescript
// Middleware checks
- Token present
- Token valid
- Token not expired
- IP matches (optional)
- User-Agent matches (optional)
```

## Cryptography

### Password Hashing
- Supabase Auth handles password hashing
- Uses bcrypt with appropriate rounds
- Never store plaintext passwords

### JWT Signing
- Algorithm: HS256 (HMAC SHA-256)
- Secret: Environment variable (40+ char)
- Expiry: 30 minutes

### OTP Generation
```typescript
// Secure random 6-digit code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

## Vote Integrity

### Immutability
```sql
-- No update/delete on votes except service role
CREATE POLICY "Service role full access to votes" ...

-- Unique constraint
ALTER TABLE votes
ADD CONSTRAINT unique_student_position
UNIQUE(student_id, position);
```

### Audit Trail
```typescript
{
  id: UUID,
  action: "VOTE_SUBMITTED",
  performed_by: student_id,
  details: { position, timestamp },
  timestamp: NOW(),
  ip_address: "IP"
}
```

### Data Validation
1. Student exists and not voted
2. Election is active
3. All 6 positions present
4. Candidates exist and are active
5. Position matches candidate
6. No duplicate positions

## Screen Protection

### Browser Security (Voting Page)
```javascript
// Blocks these actions:
- PrintScreen
- Ctrl+P (Print)
- Ctrl+S (Save)
- Ctrl+Shift+S (Snipping)
- F12 (DevTools)
- Ctrl+Shift+I (DevTools)
- Right-click context menu
- Text selection
- Keyboard shortcuts
```

### Limitations
- No solution is 100% foolproof on web
- Screenshot tools can circumvent
- Admin area less restricted (admin responsibility)
- Provides deterrent for casual attempts

## Audit Logging

### Logged Actions
| Action | Data | Timestamp |
|--------|------|-----------|
| Student Login | register_number, IP | ✓ |
| OTP Sent | mobile_number, IP | ✓ |
| Vote Submitted | student_id, vote_count, IP | ✓ |
| Admin Login | email, role, IP | ✓ |
| Admin Action | action type, details, IP | ✓ |

### Retention
- Minimum 1 year
- Longer for regulatory compliance
- Secure backup
- Tamper-protected

## Protection Against Common Attacks

### Brute Force (Credentials)
- Rate limit: 15 logins per 10 minutes
- Account lockout possible
- IP-based blocking possible
- Audit logging of failed attempts

### Brute Force (OTP)
- Rate limit: 5 OTP requests per 5 minutes
- OTP: 6-digit code (1 million combinations)
- Expiry: 5 minutes
- One attempt after verification fails

### Duplicate Voting
- Database unique constraint: (student_id, position)
- Session validation: student not voted
- Rate limiting: 1 vote per hour
- Audit trail

### Replay Attacks
- Session tokens have expiry (30 min)
- Once used, OTP is marked verified
- JWT signature prevents tampering
- IP validation (optional, configured)

### Man-in-the-Middle
- HTTPS enforced
- HSTS header set
- Certificate pinning (optional)
- Secure cookie transmission

### DDoS Protection
- Rate limiting
- Infrastructure level (CDN)
- Database connection limits
- API timeouts

## Security Configuration

### Environment Variables
```
# Never commit to git
# Never log these values
# Rotate regularly

JWT_SECRET=<40+ char random string>
NEXT_PUBLIC_SUPABASE_URL=<supabase url>
SUPABASE_SERVICE_ROLE_KEY=<secret key>
RECAPTCHA_SECRET_KEY=<secret key>
SMTP_APP_PASSWORD=<app password>
```

### Database Security
```sql
-- Enable public schema to admins only
REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_settings ENABLE ROW LEVEL SECURITY;

-- Service role for APIs
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
```

## Testing Security

### Manual Testing
- [ ] Try SQL injection in inputs
- [ ] Try XSS in text fields
- [ ] Try voting twice (different browser)
- [ ] Try OTP brute force
- [ ] Try expired OTP
- [ ] Try manipulating JWT
- [ ] Try CSRF with forged requests
- [ ] Check security headers
- [ ] Verify HTTPS enforcement

### Automated Testing
```bash
# Security scanning
npm audit                 # Dependency vulnerabilities
snyk test                # Deep security scan
lighthouse              # Performance & security

# Load testing
npm run test:load       # Simulate 400+ users
```

### Penetration Testing
- Recommended before production
- Professional security audit
- Bug bounty program consideration

## Incident Response

### If Data Breach Occurs
1. **Isolate**: Take election offline if needed
2. **Investigate**: Check audit logs and database
3. **Notify**: Contact admins immediately
4. **Patch**: Fix vulnerability
5. **Restore**: From backup if needed
6. **Review**: Post-incident analysis

### If Vote Manipulation Detected
1. **Verify**: Check audit trail
2. **Quantify**: Determine scope
3. **Isolate**: Individual votes or election-wide
4. **Notify**: Election administration
5. **Correct**: Invalidate manipulated votes if traceable
6. **Review**: Prevent recurrence

## Compliance

### Data Protection
- GDPR: Student data handling
- FERPA: Student record privacy
- Local regulations: Check jurisdiction

### Audit Requirements
- Regular security audits
- Penetration testing
- Code reviews
- Dependency scanning

## Security Contacts

**In Case of Security Issue:**
- Do NOT post publicly
- Email: security@college.edu
- Provide: Details, reproduction steps, Impact
- Timeline: Response within 24 hours

---

**Last Updated**: 2024
**Review Date**: Annually
**Contact**: Security Team

**Remember: Security is everyone's responsibility.**
