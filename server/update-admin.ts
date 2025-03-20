import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function updateAdminUser() {
  const hashedPassword = await bcrypt.hash("Abdullaoemer31!", 10);
  
  // Update or create admin user
  await db
    .insert(users)
    .values({
      email: "vaiba.app@gmail.com",
      password: hashedPassword,
      name: "VAIBA Admin",
      emailVerified: new Date(), // Set as verified
      role: "admin",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        password: hashedPassword,
        emailVerified: new Date(),
        role: "admin",
      },
    });

  console.log("Admin user updated successfully");
}

updateAdminUser().catch(console.error);
