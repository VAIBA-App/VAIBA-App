import nodemailer from 'nodemailer';
import { users, verificationTokens } from '@db/schema';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'vaiba.app@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// HTML email template
const getVerificationEmailTemplate = (verificationLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Verification</title>
  <style>
    body { 
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      font-size: 0.9em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to VAIBA!</h2>
    <p>Thank you for registering. Please verify your email address by clicking the button below:</p>

    <a href="${verificationLink}" class="button">Verify Email Address</a>

    <p>This verification link will expire in 24 hours.</p>

    <p>If you did not create an account, no further action is required.</p>

    <div class="footer">
      <p>Best regards,<br>The VAIBA Team</p>
    </div>
  </div>
</body>
</html>
`;

export async function generateVerificationToken(email: string): Promise<string> {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');

  // Set expiration to 24 hours from now
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Store the token in the database
  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  return token;
}

export async function sendVerificationEmail(email: string, name: string): Promise<void> {
  // Generate verification token
  const token = await generateVerificationToken(email);

  // Get base URL and ensure it doesn't end with a slash
  const appUrl = (process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '');

  // Create verification link with encoded token
  const verificationLink = `${appUrl}/auth/verify?token=${encodeURIComponent(token)}`;

  // Send email
  await transporter.sendMail({
    from: '"VAIBA Team" <vaiba.app@gmail.com>',
    to: email,
    subject: "Verify your email address",
    html: getVerificationEmailTemplate(verificationLink),
  });
}

export async function verifyEmail(token: string): Promise<boolean> {
  try {
    // Find the token in the database
    const [verificationToken] = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token))
      .limit(1);

    if (!verificationToken) {
      return false;
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));
      return false;
    }

    // Update user's email verification status
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, verificationToken.identifier));

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));

    return true;
  } catch (error) {
    console.error('Error verifying email:', error);
    return false;
  }
}

// HTML-Vorlage für Kontaktformulare
const getContactFormEmailTemplate = (
  name: string,
  email: string,
  subject: string,
  message: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Neue Kontaktanfrage</title>
  <style>
    body { 
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .message-box {
      background-color: #f9f9f9;
      border-left: 4px solid #007bff;
      padding: 15px;
      margin: 20px 0;
    }
    .field {
      margin-bottom: 10px;
    }
    .field strong {
      display: inline-block;
      width: 100px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Neue Kontaktanfrage</h2>
    <p>Sie haben eine neue Anfrage über Ihr Website-Kontaktformular erhalten:</p>
    
    <div class="field">
      <strong>Name:</strong> ${name}
    </div>
    <div class="field">
      <strong>E-Mail:</strong> ${email}
    </div>
    <div class="field">
      <strong>Betreff:</strong> ${subject}
    </div>
    
    <div class="message-box">
      <p>${message.replace(/\n/g, '<br>')}</p>
    </div>
    
    <p>Sie können direkt auf diese E-Mail antworten, um mit dem Absender in Kontakt zu treten.</p>
    
    <div class="footer">
      <p>Diese Nachricht wurde über Ihr VAIBA-generiertes Website-Kontaktformular gesendet.</p>
    </div>
  </div>
</body>
</html>
`;

// Funktion zum Senden von Kontaktformular-E-Mails
export async function sendContactFormEmail(
  recipientEmail: string,
  senderName: string,
  senderEmail: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    // E-Mail senden
    await transporter.sendMail({
      from: '"VAIBA Kontaktformular" <vaiba.app@gmail.com>',
      to: recipientEmail,
      replyTo: senderEmail,
      subject: `Neue Kontaktanfrage: ${subject}`,
      html: getContactFormEmailTemplate(senderName, senderEmail, subject, message),
    });
    
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der Kontaktformular-E-Mail:', error);
    return false;
  }
}