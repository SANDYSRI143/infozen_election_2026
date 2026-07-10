# VOTING — College Association Election System

> Secure Votes. Fair Leadership.

A production-ready, lightweight voting platform built with Next.js, Tailwind CSS, and Supabase for managing college association elections with 400+ concurrent users.

## 🎯 Features

### Student Voting
- ✅ **Secure Authentication**: OTP verification + DOB + Mobile number validation
- ✅ **CAPTCHA Protection**: Google reCAPTCHA v2/v3 integration
- ✅ **6 Electoral Positions**: President, Vice President, Secretary, Joint Secretary, Treasurer, Joint Treasurer
- ✅ **One Vote Per Position**: Prevent duplicate voting
- ✅ **Immutable Votes**: No edits or deletions after submission
- ✅ **Real-time Voting**: Live vote counting
- ✅ **Mobile Responsive**: Works perfectly on all devices
- ✅ **Dark Mode**: Light and dark theme support

### Admin Dashboard
- ✅ **Election Control**: Start, Pause, Resume, End election
- ✅ **Candidate Management**: Add, edit, disable candidates with profiles
- ✅ **Student Management**: Search, filter, bulk import students
- ✅ **Live Statistics**: Real-time vote counts and participation
- ✅ **Results Management**: View results (after election ends), export to CSV/Excel/PDF
- ✅ **Audit Logs**: Track all actions
- ✅ **Role-Based Access**: Super Admin and Admin roles

### Security
- ✅ **Row Level Security (RLS)**: Database-level access control
- ✅ **Rate Limiting**: Prevent abuse (3 OTP/5min, 5 logins/10min, 1 vote/hour)
- ✅ **Middleware Protection**: Route-level authentication
- ✅ **JWT Sessions**: Secure session tokens (30-min expiry)
- ✅ **Input Validation**: Zod schemas for all inputs
- ✅ **SQL Injection Protection**: Parameterized queries
- ✅ **Screen Protection**: Prevent screenshots on voting page
- ✅ **Audit Trail**: All actions logged with IP and timestamp

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, ShadCN UI |
| **Backend** | Node.js, Next.js API Routes |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | JWT + OTP + reCAPTCHA |
| **Real-time** | Supabase Realtime |
| **Deployment** | Vercel (recommended) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google reCAPTCHA keys (optional for development)

### 1. Clone Repository
```bash
git clone <repository-url>
cd antigravity
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase and reCAPTCHA keys
```

### 4. Setup Database
```bash
# In Supabase SQL Editor, paste the contents of:
supabase/schema.sql

# Then run the seed data (optional):
# supabase/seed.sql
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

**Essential:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - Secret key for JWT tokens

**Optional:**
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - Google reCAPTCHA site key
- `RECAPTCHA_SECRET_KEY` - Google reCAPTCHA secret key
- `SMTP_EMAIL` - For email OTP sending
- `SMTP_APP_PASSWORD` - Gmail app password

## 🗄️ Database Schema

### Tables
- **students** - Student records with voting status
- **admins** - Admin accounts with roles
- **candidates** - Election candidates
- **votes** - Votes (immutable)
- **election_settings** - Election control and timing
- **otp_verifications** - OTP records
- **audit_logs** - Action logs

### Key Features
- ✅ UUID primary keys
- ✅ Timezone-aware timestamps
- ✅ Indexes on frequently queried fields
- ✅ Unique constraints on register_number, mobile_number
- ✅ Foreign key relationships
- ✅ CHECK constraints on valid values
- ✅ UNIQUE constraint on (student_id, position) - One vote per student per position

## 🔐 Security Features

### Authentication Flow
1. **Student Login**: Register Number + DOB + Mobile Number
2. **OTP Verification**: 6-digit OTP (expires in 5 minutes)
3. **CAPTCHA Check**: Google reCAPTCHA
4. **Session Created**: JWT token (30-minute expiry)
5. **Vote Submission**: Verified student votes

### Rate Limiting
- OTP Requests: 5 per 5 minutes
- Login Attempts: 15 per 10 minutes
- Vote Submissions: 1 per hour
- Admin Requests: 10 per 5 minutes

### Duplicate Vote Prevention
- Database UNIQUE constraint: `(student_id, position)`
- Session validation before vote
- Rate limiting on submission
- Audit logging of all votes

## 📱 API Endpoints

### Student APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Validate student credentials |
| POST | `/api/auth/send-otp` | Send OTP to mobile |
| POST | `/api/auth/verify-otp` | Verify OTP & create session |
| GET | `/api/election/status` | Get election status |
| GET | `/api/candidates` | Get active candidates |
| POST | `/api/vote/submit` | Submit vote |

### Admin APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/auth/login` | Admin login |
| GET | `/api/admin/election` | Get election settings |
| PUT | `/api/admin/election` | Start/pause/resume/end election |
| GET | `/api/admin/candidates` | List candidates |
| POST | `/api/admin/candidates` | Add candidate |
| PUT | `/api/admin/candidates` | Update candidate |
| GET | `/api/admin/students` | List students (with search) |
| POST | `/api/admin/students` | Bulk import students |
| GET | `/api/admin/results` | Get election results |
| POST | `/api/admin/export` | Export results |

## 🎨 UI/UX Design

### Color Scheme
- **Primary**: #4A90E2 (Royal Blue)
- **Light**: #DCEEFF (Light Blue)
- **Success**: #16A34A (Green)
- **Error**: #DC2626 (Red)
- **Background**: White / Dark Navy (#0f172a)

### Responsive Design
- Mobile-first approach
- Breakpoints: 640px, 1024px, 1280px
- Touch-friendly buttons and inputs
- Optimized for 400+ concurrent users

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Environment Setup
1. Set production environment variables in Vercel dashboard
2. Ensure `NODE_ENV=production`
3. Test with `npm run build && npm start`

### Database Migration
- Supabase handles migrations
- Apply schema.sql before first deployment
- Test RLS policies thoroughly

## 📈 Performance Optimization

### For 400+ Concurrent Users
- ✅ Edge deployment (Vercel CDN)
- ✅ Database indexing
- ✅ Lazy loading of images
- ✅ Minimal API payloads
- ✅ Server-side rendering where possible
- ✅ Real-time updates via Supabase Realtime
- ✅ Rate limiting to prevent overload

### Monitoring
- Monitor API response times
- Track database query performance
- Alert on high error rates
- Monitor concurrent connections

## 🧪 Testing

### Manual Testing Checklist
- [ ] Student login and OTP flow
- [ ] Vote submission and confirmation
- [ ] Admin election controls (start/pause/resume/end)
- [ ] Candidate management
- [ ] Results export (CSV, Excel, PDF)
- [ ] Dark mode functionality
- [ ] Mobile responsiveness
- [ ] Duplicate vote prevention
- [ ] Rate limiting
- [ ] Session expiry

## 📚 Documentation

- [Database Schema](supabase/schema.sql)
- [API Documentation](README_API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Security Guide](SECURITY.md)

## 🐛 Troubleshooting

### OTP Not Sending
- Check `SMTP_EMAIL` and `SMTP_APP_PASSWORD` in .env.local
- Gmail requires app-specific passwords
- Dev mode shows OTP in browser

### Votes Not Submitted
- Verify election status is ACTIVE
- Check student hasn't already voted
- Confirm all 6 positions selected
- Check browser console for errors

### Admin Can't Login
- Verify admin exists in Supabase `admins` table
- Check Supabase Auth user exists
- Verify email and password
- Check audit logs for failed attempts

## 📞 Support

For issues or questions:
1. Check documentation
2. Review error messages in console and audit logs
3. Check Supabase dashboard for RLS policy errors
4. Review error messages in API responses

## 📄 License

This project is proprietary and confidential.

---

**VOTING - Secure Votes. Fair Leadership.**

Built with ❤️ for secure, fair college elections.
