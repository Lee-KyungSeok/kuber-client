import React from "react";
import { Mutation, MutationFn } from "react-apollo";
import { RouteComponentProps } from "react-router-dom";
import { toast } from "react-toastify";
import { startPhoneVerification, startPhoneVerificationVariables } from '../../types/api';
import PhoneLoginPresenter from "./PhoneLoginPresenter";
import { PHONE_SIGN_IN } from "./PhoneQueries";

interface IState {
    countryCode: string;
    phoneNumber: string;
}

// Mutation 을 만들기 위해 아래와 가이 class 로 만들며 codegen 을 이용해 interface 를 만들도록하여 사용한다.
class PhoneSignInMutation extends Mutation<startPhoneVerification, startPhoneVerificationVariables> {}

class PhoneLoginContainer extends React.Component<
    RouteComponentProps<any>,
    IState
    > {
    public phoneMutation: MutationFn;
    public state = {
        countryCode: "+82",
        phoneNumber: ""
    };

    public render() {
        const { history } = this.props;
        const { countryCode, phoneNumber } = this.state;
        return (
            <PhoneSignInMutation
                mutation={PHONE_SIGN_IN}
                variables={{
                    phoneNumber: `${countryCode}${phoneNumber}`
                }}

                onCompleted={data => {
                    const {StartPhoneVerification} = data;
                    const phone = `${countryCode}${phoneNumber}`
                    // graphql 에서 ok 에 true 가 오면 history 에 push 한다.
                    if (StartPhoneVerification.ok) {
                        toast.success("SMS Sent! Redirecting you...");
                        setTimeout(() => {
                            // 아래처럼 하면 location 객체에 값이 들어가면서 라우팅시킬수 있다.
                            history.push({
                                pathname: "/verify-phone",
                                state: {
                                    phone
                                }
                            })
                        }, 2000);
                    } else {
                        toast.error(StartPhoneVerification.error);
                    }
                }}
            >
                {(phoneMutation, { loading }) => {
                    this.phoneMutation = phoneMutation;
                    return (
                        <PhoneLoginPresenter
                            countryCode={countryCode}
                            phoneNumber={phoneNumber}
                            onInputChange={this.onInputChange}
                            onSubmit={this.onSubmit}
                            loading={loading}
                        />
                    );
                }}
            </PhoneSignInMutation>
        );
    }
    // HTMLInputElement 와 HTMLSelectElemenent 에서 발생하는 event 를 관리한다.
    public onInputChange: React.ChangeEventHandler<
        HTMLInputElement | HTMLSelectElement
        > = event => {
            const {
                target: { name, value }
            } = event;
            this.setState({
                [name]: value
            } as any);
        };

    public onSubmit: React.FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault();
        const {countryCode, phoneNumber} = this.state;
        const phone = `${countryCode}${phoneNumber}`;
        const isValid = /^\+[1-9]{1}[0-9]{7,11}$/.test(phone);
        if (isValid) {
            this.phoneMutation();
        } else {
            toast.error("Please write a valid phone number");
        }
    };
}

export default PhoneLoginContainer;