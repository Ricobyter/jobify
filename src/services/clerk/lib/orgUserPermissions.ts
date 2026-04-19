import { auth } from "@clerk/nextjs/server"

type UserPermission =
  | "org:job_listings:create"
  | "org:job_listings:update"
  | "org:job_listings:delete"
  | "org:job_listings:change_status"
  | "org:job_listing_applications:change_rating"
  | "org:job_listing_applications:change_stage"

export async function hasOrgUserPermission(permission: UserPermission) {
  const { has, orgRole } = await auth()

  if (orgRole === "org:admin") {
    return true
  }

  return has({ permission })
}
