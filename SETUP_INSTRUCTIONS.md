# Enzyme Activity Calculator - Setup Instructions

## ✅ What's Been Created

Your multi-user enzyme activity calculator is now ready! Here's what was built:

### Pages:
- **login.html** - Login/Signup with Google OAuth
- **dashboard.html** - View all samples with statistics
- **measurement.html** - Create new measurements
- **sample.html** - View detailed sample analysis with mean/std dev
- **index.html** - Auto-redirects to login

### Database Setup Required

You need to run the SQL schema in your Supabase dashboard:

## 🚀 Setup Steps

### Step 1: Set Up Database Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `cqrtczrltjdqrolhpryp`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire content of `setup_database.sql` file
6. Paste it into the SQL editor
7. Click "Run" to execute

This will create:
- `samples` table
- `measurements` table
- `sample_statistics` view
- Row Level Security policies
- Indexes for performance

### Step 2: Enable Google OAuth (Optional but Recommended)

1. In Supabase dashboard, go to "Authentication" > "Providers"
2. Find "Google" and click "Enable"
3. You'll need:
   - Google Client ID
   - Google Client Secret
4. To get these:
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Enable Google+ API
   - Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
   - Add authorized redirect URIs:
     - `https://cqrtczrltjdqrolhpryp.supabase.co/auth/v1/callback`
   - Copy the Client ID and Secret to Supabase

### Step 3: Test the Application

1. Open `index.html` in your browser
2. You'll be redirected to login page
3. Create an account or sign in with Google
4. You'll be taken to the dashboard
5. Click "New Measurement" to create your first measurement

## 📊 How It Works

### Creating Measurements:
1. Enter a sample name (e.g., "Sample A")
2. Upload CSV file with x,y data
3. Click "Analyze Data" - the app will find the linear region automatically
4. Enter volume/dilution parameters
5. Click "Calculate Enzyme Activity"
6. Click "Save to Database"

### Repeated Measurements:
- Use the **same sample name** for repeated measurements
- The system automatically groups them together
- View statistics (mean, std dev) on the dashboard
- Click any sample card to see detailed analysis

### Sample Detail Page:
- Shows mean, standard deviation, and CV%
- Bar chart of all measurements with mean line
- Table with all measurement details
- Delete individual measurements if needed

## 🎯 Key Features

✅ **Automatic Linear Region Detection** - Excludes lag/saturation phases
✅ **Multi-User Support** - Each user sees only their data
✅ **Sample Grouping** - Repeated measurements automatically grouped
✅ **Statistics** - Mean, std dev, CV% calculated automatically
✅ **Data Persistence** - All data saved to Supabase
✅ **Google OAuth** - Easy login with Google account
✅ **Excel Export** - Download results as CSV

## 📝 Database Schema

```
samples
├── id (UUID)
├── user_id (FK to auth.users)
├── sample_name (TEXT)
├── created_at
└── updated_at

measurements
├── id (UUID)
├── user_id (FK to auth.users)
├── sample_id (FK to samples)
├── slope, r_squared, enzyme_activity
├── volume_sample, volume_assay, dilution_factor
├── linear_region_start, linear_region_end
├── csv_filename, notes
└── measurement_date

sample_statistics (VIEW)
├── sample_id
├── mean_activity ← Average of all measurements
├── std_dev_activity ← Standard deviation
└── measurement_count
```

## 🔒 Security

- Row Level Security (RLS) enabled - users can only access their own data
- Authentication required for all pages except login
- Secure password requirements (min 6 characters)
- OAuth integration for enhanced security

## 💰 Cost

Everything runs on **100% free tiers**:
- Supabase Free: 500MB database, unlimited API requests
- No server hosting needed (static files)

## 🐛 Troubleshooting

**Can't login?**
- Check browser console for errors (F12)
- Verify database schema was created successfully

**Google OAuth not working?**
- Make sure you added the correct redirect URI in Google Console
- Verify Client ID and Secret in Supabase

**Data not saving?**
- Check browser console for errors
- Verify Row Level Security policies are set up correctly

**Sample statistics not showing?**
- The `sample_statistics` view might not be created
- Re-run the SQL setup script

## 🎉 You're Ready!

Your enzyme activity calculator is now a full-featured multi-user application with:
- User authentication
- Data persistence
- Automatic grouping of repeated measurements
- Statistical analysis (mean, std dev)
- Beautiful UI with charts

Start by running the database setup SQL, then open the application and create your first account!
