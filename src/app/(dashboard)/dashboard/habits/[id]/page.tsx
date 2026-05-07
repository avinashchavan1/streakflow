import { HabitDetail } from "@/components/habits/HabitDetail";
import { HabitForm } from "@/components/habits/HabitForm";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <HabitDetail habitId={id} />
      <HabitForm />
    </>
  );
}
