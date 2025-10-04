# スケジュール - Schedule Management System

A professional schedule management and booking system built with Next.js 15, Supabase, and Tailwind CSS.

## 🚀 Quick Start

### Automated Setup (Recommended)
```bash
# Pull latest changes, install dependencies, and start dev server
./start-dev.sh

# Or using npm
npm run dev:auto
```

### Manual Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev --port 3008
```

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Environment Setup
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
Run the SQL scripts in your Supabase dashboard in order:
1. `scripts/001_create_profiles.sql`
2. `scripts/002_profile_trigger.sql`
3. `scripts/003_create_schedules.sql`
4. `scripts/004_add_public_sharing.sql`
5. `scripts/006_add_user_slugs.sql`
6. `scripts/007_add_profiles_rls.sql`

## 📱 Features

- **User Authentication**: Sign up, login, email verification
- **Profile Management**: Business profiles with public sharing
- **Schedule Management**: Monthly schedule creation and editing
- **Public Sharing**: Share schedules via public URLs and QR codes
- **PWA Support**: Installable web app
- **Responsive Design**: Works on desktop and mobile

## 🎯 Usage

1. **Sign Up**: Create an account at `/auth/sign-up`
2. **Set Profile**: Configure your business information
3. **Create Schedules**: Set up monthly opening hours
4. **Share Publicly**: Enable public sharing and get a shareable link
5. **View Schedule**: Access via `/your-slug` URL

## 🔧 Scripts

- `pnpm dev` - Start development server
- `pnpm dev:auto` - Automated setup (pull + install + start)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting

## 🏗️ Tech Stack

- **Framework**: Next.js 15
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: Supabase Auth
- **Package Manager**: pnpm

## 📁 Project Structure

```
├── app/                    # Next.js app router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── [slug]/           # Public schedule pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard components
│   └── schedule/         # Schedule components
├── lib/                  # Utility libraries
│   └── supabase/         # Supabase client configs
├── scripts/              # Database migration scripts
└── public/               # Static assets
```

## 🚀 Deployment

The app is configured for easy deployment to Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📝 License

Private project - All rights reserved.
