import { HabitDetail } from "@/components/habits/HabitDetail";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-2xl mx-auto">
      <HabitDetail habitId={id} />
    </div>
  );
}
