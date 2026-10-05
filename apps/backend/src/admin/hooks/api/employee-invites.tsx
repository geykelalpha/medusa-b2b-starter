import { FetchError } from "@medusajs/js-sdk";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  AdminCreateEmployeeInvite,
  AdminEmployeeInviteResponse,
  AdminEmployeeInvitesResponse,
} from "../../../types";
import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

export const employeeInviteQueryKey = queryKeysFactory("employee_invite");

export const useEmployeeInvites = (
  companyId: string,
  query?: Record<string, any>,
  options?: UseQueryOptions<
    AdminEmployeeInvitesResponse,
    FetchError,
    AdminEmployeeInvitesResponse,
    QueryKey
  >
) => {
  return useQuery({
    queryKey: employeeInviteQueryKey.list({ companyId, ...query }),
    queryFn: () =>
      sdk.client.fetch<AdminEmployeeInvitesResponse>(
        `/admin/companies/${companyId}/invites`,
        {
          method: "GET",
          query,
        }
      ),
    ...options,
  });
};

export const useCreateEmployeeInvite = (
  companyId: string,
  options?: UseMutationOptions<
    AdminEmployeeInviteResponse,
    FetchError,
    AdminCreateEmployeeInvite
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invite: AdminCreateEmployeeInvite) =>
      sdk.client.fetch<AdminEmployeeInviteResponse>(
        `/admin/companies/${companyId}/invites`,
        {
          method: "POST",
          body: invite,
        }
      ),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: employeeInviteQueryKey.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useResendEmployeeInvite = (
  companyId: string,
  options?: UseMutationOptions<AdminEmployeeInviteResponse, FetchError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) =>
      sdk.client.fetch<AdminEmployeeInviteResponse>(
        `/admin/companies/${companyId}/invites/${inviteId}/resend`,
        {
          method: "POST",
        }
      ),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: employeeInviteQueryKey.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRevokeEmployeeInvite = (
  companyId: string,
  options?: UseMutationOptions<AdminEmployeeInviteResponse, FetchError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) =>
      sdk.client.fetch<AdminEmployeeInviteResponse>(
        `/admin/companies/${companyId}/invites/${inviteId}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: employeeInviteQueryKey.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
