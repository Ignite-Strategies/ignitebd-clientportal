/**
 * Quick script to find contact by firebaseUid or check if it exists
 */

require('dotenv').config({ path: '../IgniteBd-Next-combine/.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findContact(firebaseUid) {
  try {
    console.log(`🔍 Checking firebaseUid: ${firebaseUid}`);
    
    // Check if already assigned
    const existing = await prisma.contact.findUnique({
      where: { firebaseUid },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (existing) {
      console.log(`✅ Already assigned to contact:`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Email: ${existing.email}`);
      console.log(`   Name: ${existing.firstName} ${existing.lastName}`);
      return existing;
    }

    console.log(`❌ No contact found with firebaseUid: ${firebaseUid}`);
    console.log(`\n💡 To assign this firebaseUid, run:`);
    console.log(`   node scripts/upsert-firebase-uid.js ${firebaseUid} <email>`);
    
    return null;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const firebaseUid = process.argv[2];
if (!firebaseUid) {
  console.error('Usage: node scripts/find-contact-by-firebase-uid.js <firebaseUid>');
  process.exit(1);
}

findContact(firebaseUid)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

