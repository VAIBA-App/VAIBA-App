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

    // Convert binary data to base64 and store in database
    console.log('Converting to base64 and storing in database...');
    const base64Data = logoData.toString('base64');

    const [savedAsset] = await db.insert(Assets).values({
      name: 'logo',
      data: base64Data,
      mime_type: 'image/png',
      created_at: new Date(),
    }).returning();

    if (!savedAsset) {
      throw new Error('Failed to save logo to database');
    }

    console.log('Logo uploaded successfully:', {
      id: savedAsset.id,
      mime_type: savedAsset.mime_type,
      data_length: base64Data.length
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

uploadLogo();