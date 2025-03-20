import { readFileSync } from 'fs';
import { db } from '@db';
import { Assets } from '@db/schema';
import { eq } from 'drizzle-orm';

async function uploadLogo() {
  try {
    console.log('Starting logo upload process...');

    // Read and validate the logo file
    const logoPath = './attached_assets/FB-App-OhneBackground.png';
    const logoData = readFileSync(logoPath);

    if (logoData.length === 0) {
      throw new Error('Logo file is empty');
    }

    console.log('Read logo file successfully, size:', logoData.length, 'bytes');

    // Delete existing logo if exists
    console.log('Removing existing logo...');
    await db.delete(Assets).where(eq(Assets.name, 'logo'));

    // Store raw binary data in database
    console.log('Storing new logo in database...');
    const [savedAsset] = await db.insert(Assets).values({
      name: 'logo',
      data: logoData,
      mime_type: 'image/png',
      created_at: new Date(),
    }).returning();

    if (!savedAsset) {
      throw new Error('Failed to save logo to database');
    }

    console.log('Logo uploaded successfully!');
    console.log('Asset ID:', savedAsset.id);
    console.log('Mime Type:', savedAsset.mime_type);
    console.log('Data length:', logoData.length);

    // Verify the uploaded data
    const [verifiedAsset] = await db
      .select()
      .from(Assets)
      .where(eq(Assets.id, savedAsset.id))
      .limit(1);

    if (!verifiedAsset || !verifiedAsset.data) {
      throw new Error('Logo verification failed');
    }

    console.log('Logo verified successfully!');
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

uploadLogo();