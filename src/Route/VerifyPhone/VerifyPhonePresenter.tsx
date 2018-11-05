import React from "react";
import { MutationFn } from 'react-apollo';
import Helmet from "react-helmet";
import Form from 'src/Components/Form';
import Button from "../../Components/Button";
import Header from "../../Components/Header";
import Input from "../../Components/Input";
import styled from "../../typed-components";

const Container = styled.div``;

const ExtendedForm = styled(Form)`
    padding: 0px 40px;
`;

const ExtendedInput = styled(Input)`
    margin-bottom: 20px;
`;

interface IProps {
    verificationKey: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: MutationFn;
    loading: boolean;
}

const VerifyPhonePresenter: React.SFC<IProps> = ({
    verificationKey, 
    onChange, 
    onSubmit,
    loading
}) => (
    <Container>
        <Helmet>
            <title>VerifyPhone | Number</title>
        </Helmet>
        <Header backTo={"/phone-login"} title={"Verify Phone Number"} />
        <ExtendedForm submitFn={onSubmit}>
            <ExtendedInput
                value={verificationKey}
                placeholder={"Enter Verification Code"}
                onChange={onChange}
                name={"verificationKey"}
            />
            <Button 
                disabled={loading} 
                value={loading ? "Verifying" : "Submit"} 
                onClick={null}
            />
        </ExtendedForm>
    </Container>
);

export default VerifyPhonePresenter;