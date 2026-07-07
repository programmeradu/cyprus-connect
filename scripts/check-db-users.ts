import { db } from "@/db";
import { user } from "@/db/schema";
import { sql } from "drizzle-orm";

async function checkUsers() {
  try {
    console.log("\n📊 Checking database users...\n");
    
    const users = await db.select({
      email: user.email,
      companyName: user.companyName,
      createdAt: user.createdAt
    })
    .from(user)
    .orderBy(sql`${user.createdAt} DESC`)
    .limit(25);
    
    console.log(`Found ${users.length} users:\n`);
    users.forEach((u, i) => {
      const date = new Date(u.createdAt * 1000).toISOString().split('T')[0];
      console.log(`${i + 1}. ${u.email} - ${u.companyName} (${date})`);
    });
    
    console.log("\n✅ Done!\n");
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  process.exit(0);
}

checkUsers();
