import { readFileSync } from 'fs';
import { db } from '@db';
import { Assets } from '@db/schema';
import { eq } from 'drizzle-orm';

async function uploadLogo() {
  try {
    // Read and validate the logo file
    const logoPath = './attached_assets/FB-App-OhneBackground.png';
    const logoData = readFileSync(logoPath);

    if (logoData.length === 0) {
      throw new Error('Logo file is empty');
    }

    // Convert to base64
    const base64Data = logoData.toString('base64');

    // Delete existing logo if exists
    await db.delete(Assets).where(eq(Assets.name, 'logo'));

    // Store in database with validation
    const [savedAsset] = await db.insert(Assets).values({
      name: 'logo',
      data: base64Data,
      mime_type: 'image/png',
      created_at: new Date(),
    }).returning();

    if (!savedAsset) {
      throw new Error('Failed to save logo to database');
    }

    console.log('Logo uploaded successfully!');
    console.log('Asset ID:', savedAsset.id);
    console.log('Mime Type:', savedAsset.mime_type);
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

uploadLogo();