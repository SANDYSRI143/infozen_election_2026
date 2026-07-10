# VOTING — Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
- [ ] All `.env.local` variables configured
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` is strong (use generator)
- [ ] Database credentials secured
- [ ] API keys not exposed in code
- [ ] RECAPTCHA keys validated

### 2. Database
- [ ] Schema fully applied (supabase/schema.sql)
- [ ] All indexes created
- [ ] RLS policies tested
- [ ] Backups configured
- [ ] Connection pooling enabled
- [ ] Read replicas considered for scaling

### 3. Security
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting thresholds tuned
- [ ] Audit logging enabled
- [ ] Session expiry set to 30 minutes
- [ ] CSRF protection verified
- [ ] SQL injection prevention tested
- [ ] XSS protection verified
- [ ] Security headers configured

### 4. Scalability
- [ ] Load testing completed (400+ users)
- [ ] Database query performance optimized
- [ ] Image sizes optimized
- [ ] Compression enabled
- [ ] CDN configured
- [ ] Database connection limits set

### 5. Monitoring
- [ ] Error tracking (Sentry/DataDog)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Uptime monitoring configured
- [ ] Alert thresholds set
- [ ] Dashboard configured

## Deployment Steps

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Ensure `NODE_ENV=production`

3. **Deploy**
   ```bash
   vercel deploy --prod
   ```

4. **Verify Deployment**
   - Check Vercel logs for errors
   - Test login flow
   - Test vote submission
   - Test admin functions

### Alternative: Self-Hosted (Docker)

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t voting:latest .
   docker run -p 3000:3000 --env-file .env.production voting:latest
   ```

3. **Use Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name election.college.edu;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## Performance Optimization

### Database Layer
```sql
-- Ensure all indexes exist
CREATE INDEX idx_students_register ON students(register_number);
CREATE INDEX idx_students_mobile ON students(mobile_number);
CREATE INDEX idx_students_voted ON students(is_voted);
CREATE INDEX idx_votes_student ON votes(student_id);
CREATE INDEX idx_votes_candidate ON votes(candidate_id);
CREATE INDEX idx_votes_position ON votes(position);
CREATE INDEX idx_candidates_position ON candidates(position);
```

### Connection Pooling
- Use PgBouncer for connection pooling
- Set max connections based on load
- Monitor active connections

### Query Optimization
- Use EXPLAIN ANALYZE on slow queries
- Avoid N+1 queries
- Batch operations where possible
- Use prepared statements

### API Optimization
- Enable gzip compression
- Minimize JSON payloads
- Cache static assets (1 year)
- Cache API responses when appropriate
- Use CDN for images

### Frontend Optimization
- Code splitting with lazy loading
- Image optimization with next/image
- Remove unused CSS
- Minimize JavaScript bundle
- Use Web Vitals monitoring

## Scaling for 400+ Concurrent Users

### Database Scaling
- Enable Read Replicas
- Connection pooling
- Query optimization
- Regular VACUUM and ANALYZE

### Application Scaling
- Horizontal scaling with multiple instances
- Load balancing (round-robin)
- Sticky sessions for user sessions
- Cache layer (Redis) if needed

### Rate Limiting Tuning
Based on expected load:
```
Total Students: 400
Expected Duration: 8 hours
Peak Concurrent: 50-100 students

Recommended Limits:
- OTP: 5 per 5 minutes (per IP)
- Login: 15 per 10 minutes (per IP)
- Vote: 1 per hour (per student)
- Admin: 10 per 5 minutes (per IP)
```

### Monitoring Endpoints
Add these to monitoring system:
- Health check: `/api/health`
- Election status: `/api/election/status`
- Database status: Should be checked in health endpoint

## Maintenance

### Regular Tasks
- [ ] Monitor error logs daily
- [ ] Review audit logs weekly
- [ ] Check database size/performance
- [ ] Verify backups
- [ ] Update dependencies monthly
- [ ] Security audit quarterly

### Backup Strategy
- Daily automated backups
- 7-day retention minimum
- Test restore procedures
- Store backups in multiple regions

### Backup Verification
```sql
-- Verify data integrity
SELECT COUNT(*) as students FROM students;
SELECT COUNT(*) as votes FROM votes;
SELECT COUNT(*) as candidates FROM candidates;
```

## Security Hardening

### Production Checklist
- [ ] HTTPS certificate installed
- [ ] All default ports secured
- [ ] Firewall configured
- [ ] DDoS protection enabled
- [ ] Security headers set
- [ ] Rate limiting active
- [ ] Logging and monitoring active
- [ ] Incident response plan ready

### Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/
```

## Disaster Recovery

### RTO/RPO Targets
- Recovery Time Objective (RTO): 1 hour
- Recovery Point Objective (RPO): 15 minutes

### Failover Procedure
1. Detect failure (automated monitoring)
2. Switch to backup database (if set up)
3. Restore from latest backup
4. Verify data integrity
5. Notify admins
6. Update DNS if needed

### Testing
- Monthly: Test backup restore
- Quarterly: Full disaster recovery drill
- Document lessons learned

## Post-Launch

### First Week
- Monitor error logs closely
- Check user feedback
- Monitor performance metrics
- Be ready for quick fixes

### First Month
- Analyze usage patterns
- Optimize based on real usage
- Plan for next election improvements
- Document issues and solutions

### Long-term
- Plan for feature enhancements
- Maintain security
- Keep dependencies updated
- Plan infrastructure scaling

## Support

### On-Call Procedures
1. **Alert Response**: 5-minute response time
2. **Issue Investigation**: Check logs, database, API
3. **Rollback**: If critical issue, revert to previous version
4. **Communication**: Update admins via email

### Common Issues & Solutions

**Issue: High Database Latency**
- Solution: Check active queries, optimize slow queries, verify indexes

**Issue: API Timeouts**
- Solution: Check rate limiting, database connection pool, increase timeouts

**Issue: Memory Leaks**
- Solution: Check application logs, restart service, investigate code

**Issue: Certificate Expiration**
- Solution: Auto-renew with Let's Encrypt, set calendar reminder

## Compliance

### Data Privacy
- GDPR compliance (if applicable)
- Data retention policy (delete after specified period)
- Student data encryption
- Access logging

### Audit Requirements
- Maintain audit logs for 1 year
- Regular audit log reviews
- Secure log storage
- Log tamper detection

---

**For questions or issues, contact the development team.**
