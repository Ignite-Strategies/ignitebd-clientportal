/**
 * Quick upsert - uses contactId and firebaseUid
 * Usage: node scripts/quick-upsert-firebase-uid.js <firebaseUid> <contactId>
 */

require('dotenv').config({ path: '../IgniteBd-Next-combine/.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickUpsert(firebaseUid, contactId) {
  try {
    console.log(`🔍 Upserting firebaseUid: ${firebaseUid} for contactId: ${contactId}`);
    
    // Find contact by ID
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      console.error(`❌ Contact not found: ${contactId}`);
      process.exit(1);
    }

    console.log(`✅ Found: ${contact.id} (${contact.firstName} ${contact.lastName})`);
    console.log(`📧 Email: ${contact.email}`);
    console.log(`📝 Current firebaseUid: ${contact.firebaseUid || 'null'}`);

    // Check if another contact already has this firebaseUid
    const existing = await prisma.contact.findUnique({
      where: { firebaseUid },
    });

    if (existing && existing.id !== contact.id) {
      console.error(`❌ Firebase UID already assigned to contact ${existing.id} (${existing.email})`);
      process.exit(1);
    }

    // Update
    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        firebaseUid: firebaseUid,
        isActivated: true,
      },
    });

    console.log(`✅ Updated!`);
    console.log(`   Contact ID: ${updated.id}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   firebaseUid: ${updated.firebaseUid}`);
    console.log(`   isActivated: ${updated.isActivated}`);
    return updated;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const firebaseUid = process.argv[2];
const contactId = process.argv[3];

if (!firebaseUid || !contactId) {
  console.error('Usage: node scripts/quick-upsert-firebase-uid.js <firebaseUid> <contactId>');
  console.error('Example: node scripts/quick-upsert-firebase-uid.js Nwbu8tYrwTXZQpUq6YrkEFAg58O2 cmhp7hrxn0001nr23mzfk0a2e');
  process.exit(1);
}

quickUpsert(firebaseUid, contactId)
  .then(() => { console.log('✅ Done!'); process.exit(0); })
  .catch(() => process.exit(1));

