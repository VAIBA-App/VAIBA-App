import { readFileSync } from 'fs';
import { db } from '@db';
import { Assets } from '@db/schema';

async function uploadLogo() {
  try {
    // Read the logo file
    const logoPath = './attached_assets/FB-App-OhneBackground.png';
    const logoData = readFileSync(logoPath);
    const base64Data = logoData.toString('base64');

    // Store in database
    await db.insert(Assets).values({
      name: 'logo',
      data: base64Data,
      mime_type: 'image/png',
      created_at: new Date(),
    });

    console.log('Logo uploaded successfully!');
  } catch (error) {
    console.error('Error uploading logo:', error);
  }
}

uploadLogo();
