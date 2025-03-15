import { useQuery } from "@tanstack/react-query";
import { AddProfileForm } from "@/components/profile/AddProfileForm";
import { ProfileList } from "@/components/profile/ProfileList";
import { profileApi } from "@/lib/api";

export default function Profile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: profileApi.get,
  });

  return (
    <>
      <h1 className="text-4xl font-bold mb-8">Profile Management</h1>

      <div className="grid gap-8">
        <AddProfileForm />
        <ProfileList />
      </div>
    </>
  );
}