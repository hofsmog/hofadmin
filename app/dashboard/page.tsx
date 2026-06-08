import type { ComponentType } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertCircle, AlertTriangle, BarChart3, CalendarDays, CalendarRange, Car, CheckCircle2, CheckSquare, ClipboardList, FileCheck2, FileSignature, GraduationCap, Handshake, Inbox, KeyRound, Lightbulb, MapPin, Megaphone, Network, Package, PackageCheck, PiggyBank, Plus, ScanLine, ShieldAlert, UserCheck, UserMinus, UserPlus, UsersRound, Vote } from "lucide-react";
import { OrganizationAvatar } from "@/components/dashboard/organization-avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getModulesForOrganization } from "@/lib/modules";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getResponseTitle, groupSubmissionValues } from "@/lib/forms/submissions";

export default async function DashboardPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const db = supabase as any;
  const organizationName =
    organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name;
  const organizationLogo =
    organizationContext.activeOrganization.logoUrl ?? organizationContext.activeOrganization.avatarUrl;
  const accentColor = organizationContext.activeOrganization.accentColor ?? "#111827";
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysFromToday = new Date(todayStart);
  sevenDaysFromToday.setDate(sevenDaysFromToday.getDate() + 7);

  const [
    { count: todayCheckins },
    { count: totalMembers },
    { count: totalForms },
    { count: totalInventoryItems },
    { count: newSubmissionsCount },
    { count: submissionsNeedingHandling },
    { data: latestNewSubmissions },
    { count: inventoryNeedsAttention },
    { count: activeInventoryLoans },
    { count: overdueInventoryLoans },
    { count: dueSoonInventoryLoans },
    { count: pendingInvitations },
    { data: activityEvents },
    { data: recentInventoryEvents },
    { count: openIssues },
    { count: newFaultReports },
    { count: todaysBookings },
    { count: overdueKeys },
    { count: incompleteChecklists },
    { count: checkedInVisitors },
    { count: upcomingPlannerTasks },
    { count: warrantyExpiringSoon },
    { count: assetsDueForReplacement },
    { count: assetsInRepair },
    { count: activeOnboarding },
    { count: activeOffboarding },
    { count: policiesAwaitingAcknowledgement },
    { count: expiringCertifications },
    { count: overdueTraining },
    { count: activeVotes },
    { count: upcomingElections },
    { data: budgetRowsForDashboard },
    { count: upcomingVehicleInspections },
    { count: upcomingVehicleService },
    { count: totalLocations },
    { count: upcomingEvents },
    { count: eventRegistrations },
    { count: eventsThisWeek },
    { count: activeAnnouncements },
    { count: scheduledAnnouncements },
    { count: activeProjects },
    { count: overdueProjectTasks },
    { count: upcomingMilestones },
    { count: expiringContracts },
    { count: contractsRequiringRenewal },
    { count: recentlyUpdatedArticles },
    { count: pendingProcurementRequests },
    { count: approvedPurchases },
    { count: outstandingOrders },
    { count: departmentOverview },
    { data: dashboardTimeEntries },
    { count: pendingTimeApprovals },
    { count: activeSponsors },
    { count: upcomingSponsorRenewals },
    { count: newIdeas },
    { count: ideaVotes },
    { count: openRisks },
    { data: dashboardRisks },
    { count: reportUsage },
  ] = await Promise.all([
    supabase
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("forms")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("read_status", "new"),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("handling_status", ["unhandled", "partially_handled"]),
    supabase
      .from("form_submissions")
      .select("id, form_id, submitter_email, read_status, handling_status, created_at")
      .eq("organization_id", organizationId)
      .eq("read_status", "new")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["maintenance", "lost"]),
    supabase
      .from("inventory_loans")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("inventory_loans")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .lt("due_date", todayStart.toISOString().slice(0, 10)),
    supabase
      .from("inventory_loans")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .gte("due_date", todayStart.toISOString().slice(0, 10))
      .lte("due_date", sevenDaysFromToday.toISOString().slice(0, 10)),
    supabase
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
    supabase
      .from("activity_events")
      .select("id, type, title, description, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("inventory_events")
      .select("id, event_type, note, created_at, inventory_items(name, asset_tag)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(3),
    db.from("issues").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["new", "in_progress", "waiting"]),
    db.from("fault_reports").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "new"),
    db.from("bookings").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("start_at", todayStart.toISOString()).lt("start_at", new Date(todayStart.getTime() + 86_400_000).toISOString()),
    db.from("key_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "on_loan").lt("return_date", todayStart.toISOString().slice(0, 10)),
    db.from("checklists").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).neq("status", "completed"),
    db.from("visitors").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "checked_in"),
    db.from("annual_planner_tasks").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).neq("status", "completed").lte("due_date", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("inventory_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("warranty_expiration", todayStart.toISOString().slice(0, 10)).lte("warranty_expiration", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("inventory_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("expected_replacement_date", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("inventory_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("lifecycle_status", "in_repair"),
    db.from("onboarding_processes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["pending", "in_progress"]),
    db.from("offboarding_processes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["pending", "in_progress"]),
    db.from("policy_acknowledgements").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending"),
    db.from("training_records").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("expires_at", todayStart.toISOString().slice(0, 10)).lte("expires_at", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("training_records").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).neq("status", "completed").lt("due_date", todayStart.toISOString().slice(0, 10)),
    db.from("votes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "open"),
    db.from("votes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("vote_type", "election").gte("starts_at", todayStart.toISOString()),
    db.from("budget_categories").select("id, planned_amount, actual_amount").eq("organization_id", organizationId).limit(500),
    db.from("vehicles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("inspection_date", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("vehicles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("next_service_date", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("locations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("events").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("start_at", todayStart.toISOString()),
    db.from("event_registrations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("events").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("start_at", todayStart.toISOString()).lte("start_at", sevenDaysFromToday.toISOString()),
    db.from("announcements").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "published"),
    db.from("announcements").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "scheduled"),
    db.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    db.from("project_tasks").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).neq("status", "completed").lt("due_date", todayStart.toISOString().slice(0, 10)),
    db.from("project_milestones").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("completed_at", null).lte("due_date", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("contracts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("expiration_date", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("contracts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("renewal_date", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("knowledge_articles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("updated_at", new Date(todayStart.getTime() - 30 * 86_400_000).toISOString()),
    db.from("procurement_requests").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "submitted"),
    db.from("procurement_requests").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "approved"),
    db.from("procurement_requests").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "ordered"),
    db.from("departments").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("time_entries").select("id, hours, started_at").eq("organization_id", organizationId).gte("started_at", new Date(todayStart.getTime() - 7 * 86_400_000).toISOString()).limit(500),
    db.from("time_entries").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "submitted"),
    db.from("sponsors").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    db.from("sponsors").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("renewal_date", sevenDaysFromToday.toISOString().slice(0, 10)),
    db.from("ideas").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "new"),
    db.from("idea_votes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("risks").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "open"),
    db.from("risks").select("id, impact_level, probability_level").eq("organization_id", organizationId).limit(500),
    db.from("reports").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
  ]);

  const latestSubmissionIds = (latestNewSubmissions ?? []).map((submission) => submission.id);
  const formIds = [...new Set((latestNewSubmissions ?? []).map((submission) => submission.form_id))];
  const [{ data: latestSubmissionValues }, { data: submissionForms }] = await Promise.all([
    latestSubmissionIds.length
      ? supabase
          .from("form_submission_values")
          .select("id, submission_id, field_label, value")
          .eq("organization_id", organizationId)
          .in("submission_id", latestSubmissionIds)
      : Promise.resolve({ data: [] }),
    formIds.length
      ? supabase
          .from("forms")
          .select("id, title")
          .eq("organization_id", organizationId)
          .in("id", formIds)
      : Promise.resolve({ data: [] }),
  ]);
  const valuesBySubmissionId = groupSubmissionValues(latestSubmissionValues ?? []);
  const formsById = new Map((submissionForms ?? []).map((form) => [form.id, form.title]));
  const overBudgetCategories = (budgetRowsForDashboard ?? []).filter((row: any) => Number(row.actual_amount ?? 0) > Number(row.planned_amount ?? 0)).length;
  const hoursThisWeek = (dashboardTimeEntries ?? []).reduce((sum: number, row: any) => sum + Number(row.hours ?? 0), 0);
  const highRiskItems = (dashboardRisks ?? []).filter((risk: any) => risk.impact_level === "high" || risk.probability_level === "high").length;
  const organizationModules = getModulesForOrganization(organizationContext.activeOrganization);
  const enabledModuleIds = new Set(organizationModules.filter((module) => module.status === "enabled").map((module) => module.id));
  const hasModule = (moduleId: string) => enabledModuleIds.has(moduleId);
  const checklistItems = [
    { done: (totalForms ?? 0) > 0, label: "Create your first form", href: "/dashboard/forms/new" },
    { done: (totalMembers ?? 0) > 0, label: "Add your first member", href: "/dashboard/members/create#add-member" },
    { done: (totalInventoryItems ?? 0) > 0, label: "Add your first inventory item", href: "/dashboard/inventory/create" },
    {
      done: Boolean(organizationContext.activeOrganization.logoUrl || organizationContext.activeOrganization.accentColor),
      label: "Customize branding",
      href: "/dashboard/settings",
    },
  ];
  const incompleteChecklist = checklistItems.filter((item) => !item.done);
  const attentionItems = [
    {
      label: "New form submissions",
      value: newSubmissionsCount ?? 0,
      href: "/dashboard/forms/submissions?readStatus=new",
      moduleId: "forms",
    },
    {
      label: "Responses needing handling",
      value: submissionsNeedingHandling ?? 0,
      href: "/dashboard/forms/submissions?handlingStatus=unhandled",
      moduleId: "forms",
    },
    {
      label: "Inventory alerts",
      value: inventoryNeedsAttention ?? 0,
      href: "/dashboard/inventory/items?status=maintenance",
      moduleId: "inventory",
    },
    {
      label: "Overdue inventory",
      value: overdueInventoryLoans ?? 0,
      href: "/dashboard/inventory/items?status=overdue",
      moduleId: "inventory",
    },
    {
      label: "Pending invitations",
      value: pendingInvitations ?? 0,
      href: "/dashboard/team",
      moduleId: "members",
    },
    { label: "Open issues", value: openIssues ?? 0, href: "/dashboard/issues", moduleId: "issue-management" },
    { label: "New fault reports", value: newFaultReports ?? 0, href: "/dashboard/fault-reports", moduleId: "fault-reports" },
    { label: "Overdue keys", value: overdueKeys ?? 0, href: "/dashboard/keys", moduleId: "key-management" },
    { label: "Incomplete checklists", value: incompleteChecklists ?? 0, href: "/dashboard/checklists", moduleId: "checklists" },
    { label: "Warranty expiring soon", value: warrantyExpiringSoon ?? 0, href: "/dashboard/assets", moduleId: "asset-lifecycle" },
    { label: "Assets due for replacement", value: assetsDueForReplacement ?? 0, href: "/dashboard/assets", moduleId: "asset-lifecycle" },
    { label: "Assets in repair", value: assetsInRepair ?? 0, href: "/dashboard/assets", moduleId: "asset-lifecycle" },
    { label: "Active onboarding", value: activeOnboarding ?? 0, href: "/dashboard/onboarding", moduleId: "onboarding" },
    { label: "Active offboarding", value: activeOffboarding ?? 0, href: "/dashboard/offboarding", moduleId: "offboarding" },
    { label: "Policies awaiting acknowledgement", value: policiesAwaitingAcknowledgement ?? 0, href: "/dashboard/policies", moduleId: "policies" },
    { label: "Expiring certifications", value: expiringCertifications ?? 0, href: "/dashboard/training", moduleId: "training" },
    { label: "Overdue training", value: overdueTraining ?? 0, href: "/dashboard/training", moduleId: "training" },
    { label: "Active votes", value: activeVotes ?? 0, href: "/dashboard/voting", moduleId: "voting" },
    { label: "Over budget categories", value: overBudgetCategories ?? 0, href: "/dashboard/budgets", moduleId: "budgets" },
    { label: "Upcoming vehicle inspections", value: upcomingVehicleInspections ?? 0, href: "/dashboard/vehicles", moduleId: "vehicles" },
    { label: "Upcoming vehicle service", value: upcomingVehicleService ?? 0, href: "/dashboard/vehicles", moduleId: "vehicles" },
    { label: "Upcoming events", value: upcomingEvents ?? 0, href: "/dashboard/events", moduleId: "events" },
    { label: "New registrations", value: eventRegistrations ?? 0, href: "/dashboard/events", moduleId: "events" },
    { label: "Active announcements", value: activeAnnouncements ?? 0, href: "/dashboard/announcements", moduleId: "announcements" },
    { label: "Overdue project tasks", value: overdueProjectTasks ?? 0, href: "/dashboard/projects", moduleId: "projects" },
    { label: "Expiring contracts", value: expiringContracts ?? 0, href: "/dashboard/contracts", moduleId: "contracts" },
    { label: "Pending purchase requests", value: pendingProcurementRequests ?? 0, href: "/dashboard/procurement", moduleId: "procurement" },
    { label: "Pending time approvals", value: pendingTimeApprovals ?? 0, href: "/dashboard/time-tracking", moduleId: "time-tracking" },
    { label: "Upcoming sponsor renewals", value: upcomingSponsorRenewals ?? 0, href: "/dashboard/sponsors", moduleId: "sponsors" },
    { label: "New ideas", value: newIdeas ?? 0, href: "/dashboard/ideas", moduleId: "ideas" },
    { label: "Open risks", value: openRisks ?? 0, href: "/dashboard/risks", moduleId: "risk-management" },
    { label: "High-risk items", value: highRiskItems, href: "/dashboard/risks", moduleId: "risk-management" },
  ].filter((item) => item.value > 0 && hasModule(item.moduleId));
  const quickActions = [
    { href: "/dashboard/forms/new", icon: ClipboardList, label: "Create form", moduleId: "forms" },
    { href: "/dashboard/members/create#add-member", icon: UserPlus, label: "Add member", moduleId: "members" },
    { href: "/dashboard/inventory/create", icon: Package, label: "Add inventory item", moduleId: "inventory" },
    { href: "/dashboard/inventory/items", icon: ScanLine, label: "Start loan", moduleId: "loans" },
    { href: "/dashboard/inventory/loans?filter=overdue", icon: AlertTriangle, label: "View overdue loans", moduleId: "loans" },
    { href: "/dashboard/forms/submissions", icon: Inbox, label: "Open form inbox", moduleId: "forms" },
    { href: "/dashboard/onboarding", icon: UserPlus, label: "Start onboarding", moduleId: "onboarding" },
    { href: "/dashboard/assets", icon: PackageCheck, label: "Review assets", moduleId: "asset-lifecycle" },
    { href: "/dashboard/events", icon: CalendarDays, label: "Create event", moduleId: "events" },
    { href: "/dashboard/announcements", icon: Megaphone, label: "Post announcement", moduleId: "announcements" },
    { href: "/dashboard/projects", icon: Network, label: "Create project", moduleId: "projects" },
  ].filter((action) => hasModule(action.moduleId));
  const miniMetrics = [
    { href: "/dashboard/issues", icon: AlertCircle, label: "Open Issues", value: openIssues ?? 0, moduleId: "issue-management" },
    { href: "/dashboard/fault-reports", icon: Inbox, label: "New Fault Reports", value: newFaultReports ?? 0, moduleId: "fault-reports" },
    { href: "/dashboard/bookings", icon: CalendarDays, label: "Today's Bookings", value: todaysBookings ?? 0, moduleId: "bookings" },
    { href: "/dashboard/keys", icon: KeyRound, label: "Overdue Keys", value: overdueKeys ?? 0, moduleId: "key-management" },
    { href: "/dashboard/checklists", icon: CheckSquare, label: "Incomplete Checklists", value: incompleteChecklists ?? 0, moduleId: "checklists" },
    { href: "/dashboard/visitors", icon: UserCheck, label: "Checked-In Visitors", value: checkedInVisitors ?? 0, moduleId: "visitor-management" },
    { href: "/dashboard/annual-planner", icon: CalendarRange, label: "Upcoming Planner Tasks", value: upcomingPlannerTasks ?? 0, moduleId: "annual-planner" },
    { href: "/dashboard/members/list", icon: UsersRound, label: "Members", value: totalMembers ?? 0, moduleId: "members" },
    { href: "/dashboard/assets", icon: PackageCheck, label: "Warranty Expiring Soon", value: warrantyExpiringSoon ?? 0, moduleId: "asset-lifecycle" },
    { href: "/dashboard/onboarding", icon: UserPlus, label: "Active Onboarding", value: activeOnboarding ?? 0, moduleId: "onboarding" },
    { href: "/dashboard/offboarding", icon: UserMinus, label: "Active Offboarding", value: activeOffboarding ?? 0, moduleId: "offboarding" },
    { href: "/dashboard/policies", icon: FileCheck2, label: "Policy Acknowledgements", value: policiesAwaitingAcknowledgement ?? 0, moduleId: "policies" },
    { href: "/dashboard/training", icon: GraduationCap, label: "Overdue Training", value: overdueTraining ?? 0, moduleId: "training" },
    { href: "/dashboard/voting", icon: Vote, label: "Active Votes", value: activeVotes ?? 0, moduleId: "voting" },
    { href: "/dashboard/voting", icon: Vote, label: "Upcoming Elections", value: upcomingElections ?? 0, moduleId: "voting" },
    { href: "/dashboard/budgets", icon: PiggyBank, label: "Over Budget", value: overBudgetCategories ?? 0, moduleId: "budgets" },
    { href: "/dashboard/vehicles", icon: Car, label: "Vehicle Service", value: upcomingVehicleService ?? 0, moduleId: "vehicles" },
    { href: "/dashboard/locations", icon: MapPin, label: "Locations", value: totalLocations ?? 0, moduleId: "locations" },
    { href: "/dashboard/events", icon: CalendarDays, label: "Events This Week", value: eventsThisWeek ?? 0, moduleId: "events" },
    { href: "/dashboard/announcements", icon: Megaphone, label: "Scheduled Announcements", value: scheduledAnnouncements ?? 0, moduleId: "announcements" },
    { href: "/dashboard/projects", icon: Network, label: "Active Projects", value: activeProjects ?? 0, moduleId: "projects" },
    { href: "/dashboard/projects", icon: Network, label: "Upcoming Milestones", value: upcomingMilestones ?? 0, moduleId: "projects" },
    { href: "/dashboard/contracts", icon: FileSignature, label: "Contracts Renewal", value: contractsRequiringRenewal ?? 0, moduleId: "contracts" },
    { href: "/dashboard/knowledge-base", icon: FileCheck2, label: "Updated Articles", value: recentlyUpdatedArticles ?? 0, moduleId: "knowledge-base" },
    { href: "/dashboard/procurement", icon: PackageCheck, label: "Approved Purchases", value: approvedPurchases ?? 0, moduleId: "procurement" },
    { href: "/dashboard/procurement", icon: PackageCheck, label: "Outstanding Orders", value: outstandingOrders ?? 0, moduleId: "procurement" },
    { href: "/dashboard/departments", icon: UsersRound, label: "Departments", value: departmentOverview ?? 0, moduleId: "departments" },
    { href: "/dashboard/time-tracking", icon: CalendarRange, label: "Hours This Week", value: hoursThisWeek, moduleId: "time-tracking" },
    { href: "/dashboard/sponsors", icon: Handshake, label: "Active Sponsors", value: activeSponsors ?? 0, moduleId: "sponsors" },
    { href: "/dashboard/ideas", icon: Lightbulb, label: "Idea Votes", value: ideaVotes ?? 0, moduleId: "ideas" },
    { href: "/dashboard/risks", icon: ShieldAlert, label: "Open Risks", value: openRisks ?? 0, moduleId: "risk-management" },
    { href: "/dashboard/reports", icon: BarChart3, label: "Report Usage", value: reportUsage ?? 0, moduleId: "reporting" },
  ].filter((metric) => hasModule(metric.moduleId));
  const coreModules = organizationModules.filter((module) => module.status === "enabled" && module.href).slice(0, 8);

  return (
    <>
      <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <OrganizationAvatar name={organizationName} avatarUrl={organizationLogo} className="h-14 w-14" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{organizationName}</h1>
                <Badge className="capitalize">{organizationContext.activeMembership.role}</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                A simple place to see what needs attention and jump into today&apos;s work.
              </p>
            </div>
          </div>
          <ButtonLink href="/dashboard/forms/new" className="shrink-0" style={{ backgroundColor: accentColor }}>
            <Plus className="h-4 w-4" />
            Create form
          </ButtonLink>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New responses" value={`${newSubmissionsCount ?? 0}`} detail={`${submissionsNeedingHandling ?? 0} need handling`} icon={Inbox} />
        <StatCard label="Attendance today" value={`${todayCheckins ?? 0}`} detail="QR check-ins recorded today" icon={CheckCircle2} />
        <StatCard label="Members" value={`${totalMembers ?? 0}`} detail="People in this organization" icon={UsersRound} />
        <StatCard label="Active loans" value={`${activeInventoryLoans ?? 0}`} detail={`${dueSoonInventoryLoans ?? 0} due soon`} icon={Package} />
        <StatCard label="Overdue loans" value={`${overdueInventoryLoans ?? 0}`} detail={`${inventoryNeedsAttention ?? 0} inventory alerts`} icon={AlertTriangle} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {miniMetrics.map((metric) => (
          <MiniMetric key={metric.label} href={metric.href} icon={metric.icon} label={metric.label} value={metric.value} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>Only items that may need a decision or follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {attentionItems.length ? (
                attentionItems.map((item) => (
                  <ButtonLink key={item.label} href={item.href} variant="ghost" className="h-auto w-full justify-between rounded-xl bg-zinc-50 p-3 text-left dark:bg-zinc-900/60">
                    <span className="text-sm font-medium">{item.label}</span>
                    <Badge>{item.value}</Badge>
                  </ButtonLink>
                ))
              ) : (
                <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <p className="text-sm font-semibold">Everything looks good.</p>
                  <p className="mt-1 text-sm opacity-80">No new submissions, inventory alerts, or pending invitations right now.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest organization updates.</CardDescription>
              </div>
              <ButtonLink href="/dashboard/audit-logs" variant="ghost" className="h-8 px-2">
                View all
              </ButtonLink>
            </CardHeader>
            <CardContent className="space-y-2">
              {(activityEvents ?? []).length ? (
                activityEvents?.map((event) => (
                  <div key={event.id} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{event.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleDateString()}</span>
                    </div>
                    {event.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Create a form, add a member, or add inventory to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>New submissions</CardTitle>
              <CardDescription>Latest unread form responses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(latestNewSubmissions ?? []).length ? (
                latestNewSubmissions?.map((submission) => {
                  const values = valuesBySubmissionId.get(submission.id) ?? [];

                  return (
                    <ButtonLink key={submission.id} href={`/dashboard/forms/submissions/${submission.id}`} variant="ghost" className="h-auto w-full justify-between rounded-xl bg-emerald-50/80 p-3 text-left dark:bg-emerald-950/20">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{getResponseTitle(values, submission.id)}</span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {formsById.get(submission.form_id) ?? "Unknown form"} - {new Date(submission.created_at).toLocaleString()}
                        </span>
                      </span>
                      <Badge className="ml-3 border-emerald-200 bg-white text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                        New
                      </Badge>
                    </ButtonLink>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">No new submissions</p>
                  <p className="mt-1 text-sm text-muted-foreground">Unread responses will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div>
                <CardTitle>Inventory updates</CardTitle>
                <CardDescription>Latest asset changes and assignments.</CardDescription>
              </div>
              <ButtonLink href="/dashboard/inventory/activity" variant="ghost" className="h-8 px-2">
                View all
              </ButtonLink>
            </CardHeader>
            <CardContent className="space-y-2">
              {(recentInventoryEvents ?? []).length ? (
                recentInventoryEvents?.map((event) => (
                  <ButtonLink key={event.id} href="/dashboard/inventory/activity" variant="ghost" className="h-auto w-full justify-start rounded-xl bg-zinc-50 p-3 text-left dark:bg-zinc-900/60">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{event.inventory_items?.name ?? "Inventory item"}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {event.event_type.replaceAll("_", " ")} - {new Date(event.created_at).toLocaleString()}
                      </span>
                    </span>
                  </ButtonLink>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">No inventory updates yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Item assignments and status changes will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Common things to do next.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {quickActions.map((action) => (
                <QuickAction key={action.label} href={action.href} icon={action.icon} label={action.label} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Active modules</CardTitle>
              <CardDescription>Your main work areas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {coreModules.map((module) => (
                <div key={module.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                  <p className="text-sm font-medium">{module.name}</p>
                  {module.href ? <ButtonLink href={module.href} variant="ghost" className="h-8 px-2">Open</ButtonLink> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          {incompleteChecklist.length ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Setup checklist</CardTitle>
                <CardDescription>Finish the basics, then this gets out of your way.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {incompleteChecklist.map((item) => (
                  <ButtonLink key={item.label} href={item.href} variant="ghost" className="h-auto w-full justify-start rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                    {item.label}
                  </ButtonLink>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <ButtonLink href={href} variant="secondary" className="h-11 justify-start px-3">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </ButtonLink>
  );
}

function MiniMetric({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <ButtonLink href={href} variant="secondary" className="h-auto justify-start rounded-xl p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{value} current</span>
      </span>
    </ButtonLink>
  );
}
