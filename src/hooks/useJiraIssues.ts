import {useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'
import type {JiraIssueDetail, JiraIssueSummary, JiraStatus} from '@/lib/jira.ts'

// the server caches Jira for five minutes, so refetching any sooner than that can't turn up anything new
const JIRA_STALE_TIME_MS = 5 * 60 * 1000

// GET /api/jira/issues -> every issue in the NHL Stats Jira space, most recently updated first
export function useJiraIssues() {
    return useQuery<JiraIssueSummary[]>({
        queryKey: ['jiraIssues'],
        queryFn: ({signal}) => apiFetch<JiraIssueSummary[]>('/jira/issues', {signal}),
        staleTime: JIRA_STALE_TIME_MS,
    })
}

// GET /api/jira/statuses -> every status the space's workflows define, including ones no issue is in right now
export function useJiraStatuses() {
    return useQuery<JiraStatus[]>({
        queryKey: ['jiraStatuses'],
        queryFn: ({signal}) => apiFetch<JiraStatus[]>('/jira/statuses', {signal}),
        staleTime: JIRA_STALE_TIME_MS,
    })
}

export function jiraIssueQueryOptions(key: string) {
    return {
        queryKey: ['jiraIssue', key],
        queryFn: ({signal}: { signal: AbortSignal }) => apiFetch<JiraIssueDetail>(`/jira/issues/${encodeURIComponent(key)}`, {signal}),
        staleTime: JIRA_STALE_TIME_MS,
    }
}

// GET /api/jira/issues/{key} -> one issue's full detail, description and comments included
export function useJiraIssue(key: string) {
    return useQuery<JiraIssueDetail>(jiraIssueQueryOptions(key))
}
