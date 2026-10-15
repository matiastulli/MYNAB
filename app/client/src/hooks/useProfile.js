import { api } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PROFILE_KEY = ["profile"];

const fetchProfile = async () => {
  const data = await api.get("/auth/profile");
  if (data.error) throw new Error(data.error);
  return data;
};

const updateProfile = async (payload) => {
  const data = await api.put("/auth/profile", payload);
  if (data.error) throw new Error(data.error);
  return data;
};

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => queryClient.setQueryData(PROFILE_KEY, data),
  });
}
