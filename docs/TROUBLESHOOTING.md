# Client Portal Troubleshooting Guide

## Prisma Client Generation Issues

### Problem: `Unknown argument 'firebaseUid'` Error

**Symptoms:**
```
Invalid `prisma.contact.findUnique()` invocation:
Unknown argument `firebaseUid`. Available options are marked with ?.
```

**Root Cause:**
Prisma Client wasn't being regenerated during Vercel builds, so the generated TypeScript client didn't know about schema changes (like `firebaseUid @unique`).

**Solution:**

### 1️⃣ Ensure Prisma Client is generated during Vercel builds

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "postinstall": "prisma generate",
    "start": "next start"
  }
}
```

**Why both?**
- `postinstall`: Runs automatically after `npm install` (Vercel runs this)
- `build`: Ensures it happens before `next build` (belt and suspenders)

### 2️⃣ Save and commit the fix

```bash
git add package.json
git commit -m "fix: ensure prisma generate runs during Vercel build"
```

### 3️⃣ Push to main to trigger deploy

```bash
git push origin main
```

### 4️⃣ (Optional) Clear old build cache on Vercel for a clean compile

**Via Vercel CLI:**
```bash
vercel --prod --force --confirm --token=$VERCEL_TOKEN
```

**Via Vercel Dashboard:**
1. Go to your project
2. Click on the deployment
3. Click "Redeploy" → "Clear build cache"
4. Redeploy

### 5️⃣ After deployment, verify in logs

Look for:
- ✅ `Firebase Admin initialized`
- ✅ `Firebase token verified`
- ✅ `Found contact for firebaseUid: ...`

**Expected Success Log:**
```
✅ Firebase Admin initialized
🔍 GET /api/contacts/by-firebase-uid - Starting...
🔍 Verifying Firebase token...
✅ Firebase token verified: { uid: '...', email: '...' }
🔍 Looking up contact by firebaseUid: ...
✅ Contact found successfully: <contactId>
```

---

## Common Prisma Workflow Issues

### Schema Updated but Client Not Regenerated

**Local Development:**
```bash
# After updating schema.prisma
npx prisma db push        # Updates database
npx prisma generate       # Regenerates TypeScript client
# Restart Next.js dev server
```

**Production (Vercel):**
- Ensure `postinstall` and `build` scripts include `prisma generate`
- Push to trigger new deployment
- Vercel will run `npm install` → `postinstall` → `build`

### Next.js Caching Old Prisma Client

**Local Fix:**
```bash
rm -rf .next              # Clear Next.js build cache
npx prisma generate       # Regenerate client
npm run dev               # Restart dev server
```

**Production Fix:**
- Clear Vercel build cache (see step 4 above)
- Or push a new commit to trigger fresh build

---

## Firebase Authentication Issues

### "Contact not found" After Login

**Check:**
1. Is `firebaseUid` set in the Contact record?
   ```bash
   # Use the upsert script
   node scripts/quick-upsert-firebase-uid.js <firebaseUid> <contactId>
   ```

2. Is `isActivated` set to `true`?
   - The upsert script sets this automatically

3. Is Prisma Client up to date?
   - See "Prisma Client Generation Issues" above

### Firebase Admin Not Initialized

**Check Environment Variables:**
- `FIREBASE_SERVICE_ACCOUNT_KEY` must be set in Vercel
- Should be a JSON string (not a file path)

**Verify in Logs:**
```
✅ Firebase Admin initialized
```

If you see:
```
⚠️ Firebase admin not initialized: FIREBASE_SERVICE_ACCOUNT_KEY missing
```

→ Check Vercel environment variables

---

## Database Connection Issues

### "PrismaClientKnownRequestError: The column X does not exist"

**Cause:** Schema drift - database schema doesn't match Prisma schema

**Fix:**
```bash
# Update database to match schema
npx prisma db push

# Regenerate client
npx prisma generate
```

**For Production:**
- Run `prisma db push` locally (it updates the shared database)
- Or use migrations: `npx prisma migrate deploy`

---

## Quick Reference

### After Schema Changes

**Local:**
```bash
npx prisma db push && npx prisma generate && npm run dev
```

**Production:**
1. Update `package.json` if needed (ensure `prisma generate` in build)
2. `git push` to trigger Vercel deploy
3. Wait for deployment to complete

### Verify Prisma Client is Up to Date

**Check generated client:**
```bash
cat node_modules/@prisma/client/index.d.ts | grep firebaseUid
```

Should show `firebaseUid` in the Contact model types.

---

## Still Having Issues?

1. **Check Vercel Build Logs:**
   - Look for `prisma generate` in the build output
   - Should see: `✔ Generated Prisma Client`

2. **Check Runtime Logs:**
   - Look for Prisma errors in function logs
   - Check if `firebaseUid` is recognized

3. **Verify Schema:**
   ```bash
   # In client portal directory
   cat prisma/schema.prisma | grep -A 5 "model Contact"
   ```
   Should show `firebaseUid String? @unique`

4. **Nuclear Option:**
   - Clear Vercel build cache
   - Force redeploy
   - Check all environment variables are set

