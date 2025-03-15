import { AutoCallController } from "@/components/auto-call/AutoCallController";

export default function AutoCalls() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-8">Auto-Anrufe</h1>
      <div className="flex justify-center">
        <AutoCallController />
      </div>
    </>
  );
}