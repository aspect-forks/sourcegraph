import { FC, useEffect, useMemo } from 'react'

import { useLocation } from 'react-router-dom'

import { dataOrThrowErrors, gql } from '@sourcegraph/http-client'
import { displayRepoName } from '@sourcegraph/shared/src/components/RepoLink'
import { TelemetryProps } from '@sourcegraph/shared/src/telemetry/telemetryService'
import { RevisionSpec } from '@sourcegraph/shared/src/util/url'
import { Code, Heading, ErrorAlert } from '@sourcegraph/wildcard'

import { BreadcrumbSetters } from '../../components/Breadcrumbs'
import { useShowMorePagination } from '../../components/FilteredConnection/hooks/useShowMorePagination'
import {
    ConnectionContainer,
    ConnectionList,
    ConnectionLoading,
    ConnectionSummary,
    ShowMoreButton,
    SummaryContainer,
} from '../../components/FilteredConnection/ui'
import { PageTitle } from '../../components/PageTitle'
import {
    GitCommitFields,
    RepositoryFields,
    RepositoryGitCommitsResult,
    RepositoryGitCommitsVariables,
} from '../../graphql-operations'
import { eventLogger } from '../../tracking/eventLogger'
import { basename } from '../../util/path'
import { parseBrowserRepoURL } from '../../util/url'
import { externalLinkFieldsFragment } from '../backend'
import { FilePathBreadcrumbs } from '../FilePathBreadcrumbs'

import { GitCommitNode } from './GitCommitNode'

import styles from './RepositoryCommitsPage.module.scss'

export const gitCommitFragment = gql`
    fragment GitCommitFields on GitCommit {
        id
        oid
        abbreviatedOID
        message
        subject
        body
        author {
            ...SignatureFields
        }
        committer {
            ...SignatureFields
        }
        parents {
            oid
            abbreviatedOID
            url
        }
        url
        canonicalURL
        externalURLs {
            ...ExternalLinkFields
        }
        tree(path: "") {
            canonicalURL
        }
    }

    fragment SignatureFields on Signature {
        person {
            avatarURL
            name
            email
            displayName
            user {
                id
                username
                url
                displayName
            }
        }
        date
    }

    ${externalLinkFieldsFragment}
`

const REPOSITORY_GIT_COMMITS_PER_PAGE = 20

const REPOSITORY_GIT_COMMITS_QUERY = gql`
    query RepositoryGitCommits($repo: ID!, $revspec: String!, $first: Int, $afterCursor: String, $filePath: String) {
        node(id: $repo) {
            ... on Repository {
                externalURLs {
                    url
                    serviceKind
                }
                commit(rev: $revspec) {
                    ancestors(first: $first, path: $filePath, afterCursor: $afterCursor) {
                        nodes {
                            ...GitCommitFields
                        }
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                    }
                }
            }
        }
    }
    ${gitCommitFragment}
`

export interface RepositoryCommitsPageProps extends RevisionSpec, BreadcrumbSetters, TelemetryProps {
    repo: RepositoryFields
}

// A page that shows a repository's commits at the current revision.
export const RepositoryCommitsPage: FC<RepositoryCommitsPageProps> = props => {
    const { useBreadcrumb, repo } = props

    const location = useLocation()
    const { filePath = '' } = parseBrowserRepoURL(location.pathname)

    const { connection, error, loading, hasNextPage, fetchMore, data } = useShowMorePagination<
        RepositoryGitCommitsResult,
        RepositoryGitCommitsVariables,
        GitCommitFields
    >({
        query: REPOSITORY_GIT_COMMITS_QUERY,
        variables: {
            repo: repo.id,
            revspec: props.revision,
            filePath: filePath ?? null,
            first: REPOSITORY_GIT_COMMITS_PER_PAGE,
            afterCursor: null,
        },
        getConnection: result => {
            const { node } = dataOrThrowErrors(result)
            if (!node) {
                return { nodes: [] }
            }
            if (node.__typename !== 'Repository') {
                return { nodes: [] }
            }
            if (!node.commit?.ancestors) {
                return { nodes: [] }
            }
            return node?.commit?.ancestors
        },
        options: {
            fetchPolicy: 'cache-first',
            useAlternateAfterCursor: true,
        },
    })
    const node = data?.node
    const externalURLs = node && node.__typename === 'Repository' ? node.externalURLs : undefined

    useEffect(() => {
        eventLogger.logPageView('RepositoryCommits')
    }, [])

    useBreadcrumb(
        useMemo(() => {
            if (!filePath || !repo) {
                return
            }
            return {
                key: 'treePath',
                className: 'flex-shrink-past-contents',
                element: (
                    <FilePathBreadcrumbs
                        key="path"
                        repoName={repo.name}
                        revision={props.revision}
                        filePath={filePath}
                        isDir={true}
                        telemetryService={props.telemetryService}
                    />
                ),
            }
        }, [filePath, repo, props.revision, props.telemetryService])
    )
    // We need to resolve the Commits breadcrumb at the same time as the
    // filePath, so that the order is correct (otherwise Commits will show
    // before the path)
    useBreadcrumb(
        useMemo(() => {
            if (!repo) {
                return
            }
            return { key: 'commits', element: <>Commits</> }
        }, [repo])
    )

    const getPageTitle = (): string => {
        const repoString = displayRepoName(repo.name)
        if (filePath) {
            return `Commits - ${basename(filePath)} - ${repoString}`
        }
        return `Commits - ${repoString}`
    }

    return (
        <div className={styles.repositoryCommitsPage} data-testid="commits-page">
            <PageTitle title={getPageTitle()} />

            <div className={styles.content}>
                <ConnectionContainer>
                    <Heading as="h2" styleAs="h1">
                        {filePath ? (
                            <>
                                View commits inside <Code>{basename(filePath)}</Code>
                            </>
                        ) : (
                            <>View commits from this repository</>
                        )}
                    </Heading>

                    <Heading as="h3" styleAs="h2">
                        Changes
                    </Heading>

                    {error && <ErrorAlert error={error} className="w-100 mb-0" />}
                    <ConnectionList className="list-group list-group-flush w-100">
                        {connection?.nodes.map(node => (
                            <GitCommitNode
                                key={node.id}
                                className="list-group-item"
                                wrapperElement="li"
                                node={node}
                                externalURLs={externalURLs}
                            />
                        ))}
                    </ConnectionList>
                    {loading && <ConnectionLoading />}
                    {connection && (
                        <SummaryContainer centered={true}>
                            <ConnectionSummary
                                centered={true}
                                first={REPOSITORY_GIT_COMMITS_PER_PAGE}
                                connection={connection}
                                noun="commit"
                                pluralNoun="commits"
                                hasNextPage={hasNextPage}
                                emptyElement={null}
                            />
                            {hasNextPage ? <ShowMoreButton centered={true} onClick={fetchMore} /> : null}
                        </SummaryContainer>
                    )}
                </ConnectionContainer>
            </div>
        </div>
    )
}
