import { CallController } from "@/components/call/CallController";

export default function Calls() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-8">Anrufsteuerung</h1>
      <div className="flex justify-center">
        <CallController />
      </div>
    </>
  );
}