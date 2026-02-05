# Database Schema Update Required

You need to add two new columns to your `internship_applications` table in Supabase:

## SQL Commands to Run in Supabase SQL Editor:

```sql
ALTER TABLE internship_applications 
ADD COLUMN preference1 TEXT,
ADD COLUMN preference2 TEXT;
```

Or you can add them manually in the Table Editor:
1. Go to Supabase Dashboard → Table Editor → internship_applications
2. Add column: `preference1` (type: text)
3. Add column: `preference2` (type: text)

These columns will store the startup preferences (SOCIO or MedBro) selected by applicants.
