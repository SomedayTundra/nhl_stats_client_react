import DOMPurify from 'dompurify'

// Payload shapes served by the backend's read-only Jira proxy (/api/jira, see app/routes/jira.py in the server repo).
// The server trims Jira's own payloads down to these, so nothing here is a raw Jira type.

// Jira's statusCategory key: every status, whatever its name, falls into one of these three
export type JiraStatusCategory = 'new' | 'indeterminate' | 'done'
export type JiraComponentCategory = 'CI/CD' | 'client' | 'Jira' | 'server' | 'test'

export type JiraStatus = {
    name: string
    category: JiraStatusCategory | null
}

export type JiraUser = {
    displayName: string | null
    avatarUrl: string | null
}

export type JiraIssueRef = {
    key: string
    summary: string | null
    status: JiraStatus | null
    issueType: string | null
    // loads through /api/jira/issuetype-icons/{id}; null for a type whose icon Jira doesn't serve as an avatar
    issueTypeIconId: string | null
}

export type JiraIssueSummary = JiraIssueRef & {
    components: string[]
    priority: string | null
    assignee: JiraUser | null
    created: string | null
    updated: string | null
}

export type JiraComment = {
    id: string
    author: JiraUser | null
    bodyHtml: string
    created: string | null
    updated: string | null
}

export type JiraIssueDetail = JiraIssueSummary & {
    reporter: JiraUser | null
    labels: string[]
    components: string[]
    fixVersions: string[]
    parent: JiraIssueRef | null
    subtasks: JiraIssueRef[]
    links: { relation: string | null, issue: JiraIssueRef }[]
    resolved: string | null
    descriptionHtml: string
    comments: JiraComment[]
}

const STATUS_CATEGORY_ORDER: Record<JiraStatusCategory, number> = {new: 0, indeterminate: 1, done: 2}

// where a status falls in the workflow: to do -> in progress -> done, then by name within each of those
export function compareStatuses(a: JiraStatus, b: JiraStatus): number {
    const rank = (status: JiraStatus) => status.category ? STATUS_CATEGORY_ORDER[status.category] : 3
    return rank(a) - rank(b) || a.name.localeCompare(b.name)
}

// one entry per status name, in workflow order
export function distinctStatuses(statuses: (JiraStatus | null)[]): JiraStatus[] {
    const byName = new Map<string, JiraStatus>()
    for (const status of statuses) {
        if (status && !byName.has(status.name)) {
            byName.set(status.name, status)
        }
    }
    return [...byName.values()].sort(compareStatuses)
}

// Jira's default priority scheme, highest first; anything custom sorts after these
const PRIORITY_ORDER = ['Highest', 'High', 'Medium', 'Low', 'Lowest']

export function priorityRank(priority: string | null): number {
    const index = priority ? PRIORITY_ORDER.indexOf(priority) : -1
    return index === -1 ? PRIORITY_ORDER.length : index
}

// Jira's rendered HTML points images and some links at paths relative to the (authenticated) Jira API, which mean
// nothing on our origin - drop those images and un-link those anchors rather than render something broken. Absolute
// links open in a new tab so following one doesn't navigate away from the page.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'IMG' && !/^https?:\/\//i.test(node.getAttribute('src') ?? '')) {
        node.remove()
    } else if (node.tagName === 'A') {
        if (/^https?:\/\//i.test(node.getAttribute('href') ?? '')) {
            node.setAttribute('target', '_blank')
            node.setAttribute('rel', 'noopener noreferrer')
        } else {
            node.removeAttribute('href')
        }
    }
})

// the HTML comes from Jira, so it's sanitized before React is allowed anywhere near it
export function sanitizeJiraHtml(html: string): string {
    return DOMPurify.sanitize(html)
}
