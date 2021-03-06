import React, { Component } from 'react';
import propTypes from 'prop-types';
import routerParams from '../../../../Utilities/RouterParams';
import SystemPolicyCards from './SystemPolicyCards';
import SystemRulesTable from './SystemRulesTable';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { ApolloProvider } from 'react-apollo';
import { ApolloClient, HttpLink, InMemoryCache } from 'apollo-boost';
import { Card, CardBody, CardHeader } from '@patternfly/react-core';
import { NotEqualIcon } from '@patternfly/react-icons';
import './compliance.scss';

const COMPLIANCE_API_ROOT = '/r/insights/platform/compliance';

const QUERY = gql`
query System($systemId: String!){
    system(id: $systemId) {
        id
        name
        profiles {
            name
            ref_id
            compliant(system_id: $systemId)
            rules_failed(system_id: $systemId)
            rules_passed(system_id: $systemId)
            last_scanned(system_id: $systemId)
            rules {
                title
                severity
                rationale
                ref_id
                description
                compliant(system_id: $systemId)
            }
        }
	}
}
`;

const SystemQuery = ({ data, loading }) => (
    <React.Fragment>
        <SystemPolicyCards policies={ data.system && data.system.profiles } loading={ loading } />
        <br/>
        <Card>
            <CardBody>
                <SystemRulesTable profileRules={ data.system && data.system.profiles.map((profile) => ({
                    profile: profile.name,
                    rules: profile.rules
                })) }
                loading={ loading }
                />
            </CardBody>
        </Card>
    </React.Fragment>
);

class SystemDetails extends Component {
    componentWillUnmount() {
        const { client } = this.props;
        client && client.clearStore && client.clearStore();
    }

    renderError = (error) => {
        const errorMsg = `Oops! Error loading System data: ${error}`;
        return (
            <Card className="ins-error-card">
                <CardHeader>
                    <NotEqualIcon />
                </CardHeader>
                <CardBody>
                    <div>{ errorMsg }</div>
                </CardBody>
            </Card>
        );
    }

    render() {
        const { match: { params: { inventoryId }}, client } = this.props;
        return (
            <ApolloProvider client={ client }>
                <Query query={ QUERY } variables={ { systemId: inventoryId } }>
                    { ({ data, error, loading }) => (
                        error ?
                            this.renderError(error) :
                            <SystemQuery data={ data } error={ error } loading={ loading } />
                    ) }
                </Query>
            </ApolloProvider>
        );
    }
}

SystemDetails.propTypes = {
    match: propTypes.shape({
        params: propTypes.shape({
            inventoryId: propTypes.string
        })
    }),
    client: propTypes.object
};

SystemDetails.defaultProps = {
    match: {
        params: {}
    },
    client: new ApolloClient({
        link: new HttpLink({ uri: COMPLIANCE_API_ROOT + '/graphql' }),
        cache: new InMemoryCache()
    })
};

SystemQuery.propTypes = {
    data: propTypes.shape({
        system: propTypes.shape({
            profiles: propTypes.array
        })
    }),
    loading: propTypes.bool
};

SystemQuery.defaultProps = {
    data: {
        system: {
            profiles: []
        }
    },
    loading: true
};

export default routerParams(SystemDetails);
