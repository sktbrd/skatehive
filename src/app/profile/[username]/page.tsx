'use client'

import ProfileHeader from "@/components/Profile/ProfileHeader";
import ProfileTabs from "@/components/Profile/profileTabs";
import useHiveAccount from "@/hooks/useHiveAccount";
import { Box } from "@chakra-ui/react";

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { hiveAccount } = useHiveAccount(params.username)
  if (!hiveAccount) return <div>Loading...</div>
  return (
    <Box w={"100%"}>
      <ProfileHeader user={hiveAccount} />
      <ProfileTabs user={hiveAccount} />
    </Box>
  )
}
