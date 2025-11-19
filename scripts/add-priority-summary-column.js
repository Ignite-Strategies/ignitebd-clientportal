const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPrioritySummaryColumn() {
  try {
    console.log('🔄 Adding prioritySummary column to work_packages table...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE work_packages 
      ADD COLUMN IF NOT EXISTS "prioritySummary" TEXT;
    `);
    
    console.log('✅ Successfully added prioritySummary column!');
  } catch (error) {
    console.error('❌ Error adding column:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addPrioritySummaryColumn();

