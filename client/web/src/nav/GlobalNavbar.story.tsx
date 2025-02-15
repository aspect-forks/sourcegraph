import { DecoratorFn, Meta, Story } from '@storybook/react'

import { NOOP_TELEMETRY_SERVICE } from '@sourcegraph/shared/src/telemetry/telemetryService'
import {
    mockFetchSearchContexts,
    mockGetUserSearchContextNamespaces,
} from '@sourcegraph/shared/src/testing/searchContexts/testHelpers'
import { extensionsController } from '@sourcegraph/shared/src/testing/searchTestHelpers'
import { Grid, H3 } from '@sourcegraph/wildcard'

import { AuthenticatedUser } from '../auth'
import { WebStory } from '../components/WebStory'
import { useExperimentalFeatures } from '../stores'

import { GlobalNavbar, GlobalNavbarProps } from './GlobalNavbar'

const defaultProps: GlobalNavbarProps = {
    isSourcegraphDotCom: false,
    settingsCascade: {
        final: null,
        subjects: null,
    },
    extensionsController,
    telemetryService: NOOP_TELEMETRY_SERVICE,
    globbing: false,
    platformContext: {} as any,
    selectedSearchContextSpec: '',
    setSelectedSearchContextSpec: () => undefined,
    searchContextsEnabled: false,
    batchChangesEnabled: false,
    batchChangesExecutionEnabled: false,
    batchChangesWebhookLogsEnabled: false,
    routes: [],
    fetchSearchContexts: mockFetchSearchContexts,
    getUserSearchContextNamespaces: mockGetUserSearchContextNamespaces,
    showKeyboardShortcutsHelp: () => undefined,
    showSearchBox: false,
    authenticatedUser: null,
    setFuzzyFinderIsVisible: () => {},
    notebooksEnabled: true,
    codeMonitoringEnabled: true,
    showFeedbackModal: () => undefined,
}

const allNavItemsProps: Partial<GlobalNavbarProps> = {
    searchContextsEnabled: true,
    batchChangesEnabled: true,
    batchChangesExecutionEnabled: true,
    batchChangesWebhookLogsEnabled: true,
    codeInsightsEnabled: true,
    enableLegacyExtensions: true,
}

const allAuthenticatedNavItemsProps: Partial<GlobalNavbarProps> = {
    authenticatedUser: {
        username: 'alice',
        organizations: { nodes: [{ id: 'acme', name: 'acme' }] },
        siteAdmin: true,
    } as AuthenticatedUser,
}

const decorator: DecoratorFn = Story => {
    useExperimentalFeatures.setState({ codeMonitoring: true })

    return (
        <WebStory>
            {() => (
                <div className="mt-3">
                    <Story args={defaultProps} />
                </div>
            )}
        </WebStory>
    )
}

const config: Meta = {
    title: 'web/nav/GlobalNav',
    decorators: [decorator],
    parameters: {
        chromatic: {
            disableSnapshot: false,
            viewports: [320, 576, 978],
        },
    },
}

export default config

export const Default: Story<GlobalNavbarProps> = props => (
    <Grid columnCount={1}>
        <div>
            <H3 className="ml-2">Anonymous viewer</H3>
            <GlobalNavbar {...props} />
        </div>
        <div>
            <H3 className="ml-2">Anonymous viewer with all possible nav items</H3>
            <GlobalNavbar {...props} {...allNavItemsProps} />
        </div>
        <div>
            <H3 className="ml-2">Authenticated user with all possible nav items</H3>
            <GlobalNavbar {...props} {...allNavItemsProps} {...allAuthenticatedNavItemsProps} />
        </div>
        <div>
            <H3 className="ml-2">Authenticated user with all possible nav items and search input</H3>
            <GlobalNavbar {...props} {...allNavItemsProps} {...allAuthenticatedNavItemsProps} showSearchBox={true} />
        </div>
    </Grid>
)
