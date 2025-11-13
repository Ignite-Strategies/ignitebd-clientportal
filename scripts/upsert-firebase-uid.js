/**
 * Script to upsert firebaseUid for a contact
 * 
 * Usage:
 *   node scripts/upsert-firebase-uid.js <email> <firebaseUid>
 * 
 * Example:
 *   node scripts/upsert-firebase-uid.js john@example.com Nwbu8tYrwTXZQpUq6YrkEFAg58O2
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upsertFirebaseUid(email, firebaseUid) {
  try {
    console.log(`🔍 Looking up contact by email: ${email}`);
    
    // Find contact by email
    const contact = await prisma.contact.findFirst({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (!contact) {
      console.error(`❌ Contact not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found contact: ${contact.id} (${contact.firstName} ${contact.lastName})`);
    console.log(`📝 Current firebaseUid: ${contact.firebaseUid || 'null'}`);

    // Check if another contact already has this firebaseUid
    if (firebaseUid) {
      const existingContact = await prisma.contact.findUnique({
        where: { firebaseUid },
      });

      if (existingContact && existingContact.id !== contact.id) {
        console.error(`❌ Firebase UID ${firebaseUid} is already assigned to contact ${existingContact.id} (${existingContact.email})`);
        process.exit(1);
      }
    }

    // Upsert firebaseUid
    console.log(`🔄 Updating contact with firebaseUid: ${firebaseUid}`);
    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        firebaseUid: firebaseUid,
        isActivated: true, // Mark as activated
      },
    });

    console.log(`✅ Successfully updated contact ${updated.id}`);
    console.log(`   firebaseUid: ${updated.firebaseUid}`);
    console.log(`   isActivated: ${updated.isActivated}`);
    console.log(`   email: ${updated.email}`);
    
    return updated;
  } catch (error) {
    console.error('❌ Error upserting firebaseUid:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const email = process.argv[2];
const firebaseUid = process.argv[3];

if (!email || !firebaseUid) {
  console.error('Usage: node scripts/upsert-firebase-uid.js <email> <firebaseUid>');
  console.error('Example: node scripts/upsert-firebase-uid.js john@example.com Nwbu8tYrwTXZQpUq6YrkEFAg58O2');
  process.exit(1);
}

upsertFirebaseUid(email, firebaseUid)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

