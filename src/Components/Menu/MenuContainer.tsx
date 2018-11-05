import React from "react";
import { Mutation, Query } from 'react-apollo';
import { USER_PROFILE } from '../../sharedQueries';
import { toggleDriving, userProfile } from "../../types/api"
import MenuPresenter from './MenuPresenter';
import { TOGGLE_DRIVING } from './MenuQueries';

class ProfileQuery extends Query<userProfile>{}
class ToggleDrivingMutation extends Mutation<toggleDriving>{}

class MenuContainer extends React.Component {
    public render() {
        return (
            <ToggleDrivingMutation 
                mutation={TOGGLE_DRIVING}
                // update={(cache, { data }) => { // 만약 local 에서만 캐시를 조절하고 싶다면 이와 같이 실행할 수도 있다.
                //     if (data) {
                //         const { ToggleDrivingMode } = data;
                //         if (!ToggleDrivingMode.ok) {
                //             toast.error(ToggleDrivingMode.error);
                //             return;
                //         }
                //         const query: userProfile | null = cache.readQuery({
                //             query: USER_PROFILE
                //         });
                //         if (query) {
                //             const { GetMyProfile: { user } } = query;
                //             if (user) {
                //                 user.isDriving = !user.isDriving;
                //             }
                //         }
                //         cache.writeQuery({ query: USER_PROFILE, data: query });
                //     }
                // }}
                refetchQueries={ [ {query: USER_PROFILE} ] } // mutation 이 complete 되었을 때 배열로 원하는 만큼 query 를 보낼 수 있다.(apollo 가 자동으로 전체 refetch 를 한다.)
            >
                {toggleDrivingFn => (
                    <ProfileQuery query={USER_PROFILE}>
                        {({data, loading}) => (
                            <MenuPresenter 
                                data={data} 
                                loading={loading}
                                toggleDrivingFn={toggleDrivingFn} />
                        )}
                    </ProfileQuery>
                )}
            </ToggleDrivingMutation>
        )
    }
}

export default MenuContainer;