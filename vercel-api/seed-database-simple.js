/**
 * Simple Database Seed Script for Dates Factory Manager
 *
 * This script populates the database with sample/demo data for testing purposes.
 * It uses the existing sync API to push data to the database.
 *
 * Usage:
 *   node seed-database-simple.js
 *
 * Environment variables required:
 *   NEON_DATABASE_URL - Your Neon database connection string
 */

import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// Sample data for customers (Arabic names and companies)
const sampleCustomers = [
  { name: 'شركة النور للتجارة', type: 'شركة', phone: '0501234567' },
  { name: 'مؤسسة الأفق المحدودة', type: 'مؤسسة', phone: '0502345678' },
  { name: 'محمد أحمد العلي', type: 'فرد', phone: '0503456789' },
  { name: 'شركة البركة للتمور', type: 'شركة', phone: '0504567890' },
  { name: 'عبدالله سالم القحطاني', type: 'فرد', phone: '0505678901' },
  { name: 'مجموعة الخليج التجارية', type: 'شركة', phone: '0506789012' },
  { name: 'سعيد محمد الدوسري', type: 'فرد', phone: '0507890123' },
  { name: 'شركة الواحة للصناعات الغذائية', type: 'شركة', phone: '0508901234' },
  { name: 'فهد عبدالرحمن الشمري', type: 'فرد', phone: '0509012345' },
  { name: 'مؤسسة النخيل الذهبية', type: 'مؤسسة', phone: '0510123456' },
  { name: 'خالد يوسف الحربي', type: 'فرد', phone: '0511234567' },
  { name: 'شركة التمور السعودية', type: 'شركة', phone: '0512345678' },
  { name: 'عمر فاروق المطيري', type: 'فرد', phone: '0513456789' },
  { name: 'مؤسسة الفجر للتجارة', type: 'مؤسسة', phone: '0514567890' },
  { name: 'ناصر إبراهيم العتيبي', type: 'فرد', phone: '0515678901' }
]

// Sample date types
const sampleDateTypes = [
  { name: 'تمر سكري' },
  { name: 'تمر مجدول' },
  { name: 'تمر برحي' },
  { name: 'تمر خضري' },
  { name: 'تمر صفوي' },
  { name: 'تمر عجوة' },
  { name: 'تمر مبروم' },
  { name: 'تمر سوقي' }
]

// Sample crate types
const sampleCrateTypes = [
  { name: 'صندوق كبير', weight: 25.0, is_default: 1 },
  { name: 'صندوق متوسط', weight: 15.0, is_default: 0 },
  { name: 'صندوق صغير', weight: 10.0, is_default: 0 },
  { name: 'صندوق خاص', weight: 30.0, is_default: 0 }
]

// Sample supervisors
const sampleSupervisors = [
  { name: 'أحمد محمد' },
  { name: 'عبدالله علي' },
  { name: 'سعيد أحمد' },
  { name: 'محمد خالد' },
  { name: 'فهد سعود' }
]

// Helper function to generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0]
}

// Helper function to generate random integer
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to generate random float
function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n')

  // Check for database URL
  const databaseUrl = process.env.NEON_DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: NEON_DATABASE_URL environment variable is not set')
    console.log('Please set it in your .env file or run:')
    console.log('  export NEON_DATABASE_URL="your-database-url"')
    process.exit(1)
  }

  console.log('📝 Creating sample data file...')

  // Create sample data JSON file
  const sampleData = {
    customers: sampleCustomers,
    date_types: sampleDateTypes,
    crate_types: sampleCrateTypes,
    supervisors: sampleSupervisors
  }

  // Write sample data to file
  const fs = await import('fs')
  fs.writeFileSync('./sample-data.json', JSON.stringify(sampleData, null, 2))

  console.log('✅ Sample data file created: sample-data.json')
  console.log('\n📋 Sample Data Summary:')
  console.log(`   - Customers: ${sampleCustomers.length}`)
  console.log(`   - Date Types: ${sampleDateTypes.length}`)
  console.log(`   - Crate Types: ${sampleCrateTypes.length}`)
  console.log(`   - Supervisors: ${sampleSupervisors.length}`)
  console.log('\n💡 Next Steps:')
  console.log('   1. Import sample data to your database using the sync API')
  console.log('   2. Or use the sample-data.json file to manually add data')
  console.log('\n📖 For more information, see SEED-README.md')
}

// Run the seed script
seedDatabase()
