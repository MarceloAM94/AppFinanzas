import MesSelectorWrapper from "@/components/MesSelectorWrapper";
import DashboardContent from "@/components/DashboardContent";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <MesSelectorWrapper />
      </div>
      <DashboardContent />
    </div>
  );
}
