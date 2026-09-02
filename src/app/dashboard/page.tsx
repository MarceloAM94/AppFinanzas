import MesSelectorWrapper from "@/components/MesSelectorWrapper";
import DashboardContent from "@/components/DashboardContent";
import PageHeader from "@/components/ui/PageHeader";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Dashboard" />
        <MesSelectorWrapper />
      </div>
      <DashboardContent />
    </div>
  );
}
