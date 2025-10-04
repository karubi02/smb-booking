import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ScheduleClient } from "@/components/schedule/schedule-client"
import { createClient } from "@/lib/supabase/server"

export default async function SchedulePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <ScheduleClient userId={user.id} />
    </DashboardLayout>
  )
}
