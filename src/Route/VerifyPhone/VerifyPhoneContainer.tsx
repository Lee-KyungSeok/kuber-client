import React from "react";
import { Mutation } from 'react-apollo';
import { RouteComponentProps } from "react-router-dom"
import { toast } from 'react-toastify';
import { LOG_USER_IN } from '../../sharedQueries.local';
import { verifyPhone, verifyPhoneVariables } from '../../types/api';
import VerifyPhonePresenter from "./VerifyPhonePresenter";
import { VERIFY_PHONE } from './VerifyPhoneQueries';

interface IState {
    verificationKey: string;
    phoneNumber: string;
}

interface IProps extends RouteComponentProps<any> {}

class VerifyMutation extends Mutation<verifyPhone, verifyPhoneVariables> {}

class VerifyPhoneContainer extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        // 만약 verfy-phone 으로 연결했는데 state 가 없다면 home 으로 라우팅 시킨다.
        if(!props.location.state) {
            props.history.push("/");
        }
        this.state ={
            phoneNumber: props.location.state.phone,
            verificationKey: ""
        }
    }
    public render() {
        const { verificationKey, phoneNumber } = this.state;
        return (
            // sharedQuery 를 사용하기 위해 Mutation 으로 감싸서 사용할 수 있다. (다른 방법은 graphql 로 감싸서 export 시킨다.)
            <Mutation mutation={LOG_USER_IN}>
                {logUserIn => (
                    <VerifyMutation 
                        mutation={VERIFY_PHONE} 
                        variables={{
                            key: verificationKey,
                            phoneNumber
                        }}
                    // update 는 cache 와 API 에서 return 된 data 를 준다.
                    // 하지만 resolver 에서 작업할 것이므로 이를 모든 곳에서 사용하지 않고 sharedQuery 를 만들었다.
                    // update={(cache, {data}) => {
                    //     cache.writeData({
                    //         data: {
                    //             auth: {
                    //                 __typename: "Auth",
                    //                 isLoggedIn: true
                    //             }
                    //         }
                    //     })
                    // }}
                    onCompleted={(data) => {
                        const { CompletePhoneVerification } = data;
                        if(CompletePhoneVerification.ok) {
                            if(CompletePhoneVerification.token) {
                                logUserIn({
                                    variables: {
                                        token: CompletePhoneVerification.token
                                    }
                                });
                            }
                            toast.success("You're verified, loggin in now");
                        } else {
                            toast.error(CompletePhoneVerification.error);
                        }

                    }}
                >
                {(mutation, { loading }) => {
                    return (
                        <VerifyPhonePresenter 
                            onSubmit={mutation}
                            onChange={this.onInputChange} 
                            verificationKey={verificationKey} 
                            loading={loading}
                        />
                    )
                }}
                </VerifyMutation>
                )}
            </Mutation>
        )
    }

    public onInputChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        const {
            target: { name, value }
        } = event;
        this.setState({
            [name]: value
        } as any);
    };
}

export default VerifyPhoneContainer;