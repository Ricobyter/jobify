ALTER TABLE "user_resumes" ADD COLUMN "id" uuid;
--> statement-breakpoint
ALTER TABLE "user_resumes" ADD COLUMN "title" varchar;
--> statement-breakpoint
UPDATE "user_resumes"
SET "id" = gen_random_uuid()
WHERE "id" IS NULL;
--> statement-breakpoint
UPDATE "user_resumes"
SET "title" = 'Resume'
WHERE "title" IS NULL OR btrim("title") = '';
--> statement-breakpoint
ALTER TABLE "user_resumes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
--> statement-breakpoint
ALTER TABLE "user_resumes" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_resumes" ALTER COLUMN "title" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_resumes" DROP CONSTRAINT "user_resumes_pkey";
--> statement-breakpoint
ALTER TABLE "user_resumes" ADD CONSTRAINT "user_resumes_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "job_listing_applications" ADD COLUMN "resumeId" uuid;
--> statement-breakpoint
UPDATE "job_listing_applications" AS jla
SET "resumeId" = ur."id"
FROM "user_resumes" AS ur
WHERE ur."userId" = jla."userId";
--> statement-breakpoint
ALTER TABLE "job_listing_applications" ALTER COLUMN "resumeId" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "job_listing_applications" ADD CONSTRAINT "job_listing_applications_resumeId_user_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."user_resumes"("id") ON DELETE no action ON UPDATE no action;