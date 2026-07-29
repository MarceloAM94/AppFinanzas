import MesSelectorWrapper from "@/components/MesSelectorWrapper";
import DashboardContent from "@/components/DashboardContent";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <MesSelectorWrapper />
      </div>
      <DashboardContent />
    </div>
  );
}
