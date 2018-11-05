import React from "react";
import { Mutation, Query } from 'react-apollo';
import { RouteComponentProps } from "react-router-dom";
import { USER_PROFILE } from "../../sharedQueries";
import { getRide, getRideVariables, updateRide, updateRideVariables, userProfile } from '../../types/api';
import RidePresenter from "./RidePresenter";
import { GET_RIDE, RIDE_SUBSCRIPTION, UPDATE_RIDE_STATUS } from "./RideQueries";

interface IProps extends RouteComponentProps<any> {}

class RideQuery extends Query<getRide, getRideVariables> {}
class ProfileQuery extends Query<userProfile> {}
class RideUpdate extends Mutation<updateRide, updateRideVariables> {}

class RideContainer extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);

        // rideId 가 없다면 home 으로 이동시킨다.
        if(!props.match.params.rideId) {
            props.history.push("/");
        }
    }

    public render() {
        const { match : { params: {rideId} } } = this.props;

        return (
            <ProfileQuery query={USER_PROFILE}>
                {({ data: userData }) => (
                    <RideQuery query={GET_RIDE} variables={{ rideId }}>
                    
                        {({data, loading, subscribeToMore}) => {

                            // const subscribeOptions: SubscribeToMoreOptions = {
                            //     document: RIDE_SUBSCRIPTION
                            // };
                            // SubscribeToMoreOptions 을 넣으면 오류나서 잠시 삭제
                            const subscribeOptions = {
                                document: RIDE_SUBSCRIPTION,
                                updateQuery: (prev, { subscriptionData }) => {
                                    if (!subscriptionData.data) {
                                            return prev;
                                    }
                                    const {
                                        data: {
                                            RideStatusSubscription: { status }
                                        }
                                    } = subscriptionData;
                                    // finish 라면 home 으로 보낸다.
                                    if (status === "FINISHED") {
                                        window.location.href = "/";
                                    }
                                }
                            };

                            subscribeToMore(subscribeOptions);

                            return (
                                <RideUpdate mutation={UPDATE_RIDE_STATUS} >
                                    {updateRideFn => (
                                        <RidePresenter
                                            userData={userData}
                                            loading={loading}
                                            data={data}
                                            updateRideFn={updateRideFn}
                                        />
                                    )}
                                </RideUpdate>
                            );
                        }}
                    </RideQuery>
                )}
            </ProfileQuery>
        );
    }
}

export default RideContainer;