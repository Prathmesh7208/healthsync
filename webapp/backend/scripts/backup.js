const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Define backup directories
const BACKUP_DIR = path.join(__dirname, '../../backups');
const DB_PATH = path.join(__dirname, '../prisma/dev.db');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFileName = `healthsync_backup_${timestamp}.db`;
const backupFilePath = path.join(BACKUP_DIR, backupFileName);

console.log('Initiating Secure Database Backup...');

// DPDP Act Compliance Note: Backups should ideally be encrypted at rest.
// For this script, we'll demonstrate a standard copy, but in production,
// this should pipe to an encryption utility like OpenSSL or AWS KMS.

try {
  // If using SQLite:
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, backupFilePath);
    console.log(`✅ Backup successfully created at: ${backupFilePath}`);
    console.log(`🔒 Note: Ensure this directory has restricted access permissions to comply with DPDP Act (Data Privacy).`);
  } else {
    // If using PostgreSQL in production:
    // const pgDumpCommand = `pg_dump ${process.env.DATABASE_URL} > ${backupFilePath}.sql`;
    console.log('No local SQLite database found. Assuming PostgreSQL production environment.');
    console.log('To backup PostgreSQL, uncomment the pg_dump command in this script.');
  }
} catch (error) {
  console.error('❌ Backup failed:', error);
}

// Cleanup old backups (retention policy: keep last 7 days)
// (Implementation omitted for brevity, but would delete files older than 7 days)
