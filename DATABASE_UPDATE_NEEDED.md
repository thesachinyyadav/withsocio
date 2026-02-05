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

## Interview Scores Table (Required)

Create a new table to store interviewer scores per applicant:

```sql
CREATE TABLE IF NOT EXISTS interview_scores (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	applicant_id UUID NOT NULL REFERENCES internship_applications(id) ON DELETE CASCADE,
	interviewer TEXT NOT NULL,
	communication INT NOT NULL DEFAULT 0,
	technical_depth INT NOT NULL DEFAULT 0,
	problem_solving INT NOT NULL DEFAULT 0,
	culture_fit INT NOT NULL DEFAULT 0,
	ownership INT NOT NULL DEFAULT 0,
	total INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS interview_scores_unique
ON interview_scores (applicant_id, interviewer);
```
