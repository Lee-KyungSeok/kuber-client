import React from "react";
import Helmet from "react-helmet";
import AddressBar from "../../Components/AddressBar";
import Button from "../../Components/Button";
import styled from "../../typed-components";

const Map = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 1;
`;

const Center = styled.div`
    position: absolute;
    width: 40px;
    height: 40px;
    z-index: 2;
    font-size: 30px;
    margin: auto;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
`;

const ExtendedButton = styled(Button)`
    position: absolute;
    bottom: 50px;
    left: 0;
    right: 0;
    margin: auto;
    z-index: 10;
    height: auto;
    width: 80%;
`;

interface IProps {
    mapRef: any;
    address: string;
    onInputBlur: () => void;
    onPickPlace: () => void;
    onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// ref 를 가지려면 class component 를 가져야만 한다.(stateless 하면 가져올 수 없기 때문)
class FindAddressPresenter extends React.Component<IProps> {
    public render() {
        const {mapRef, address, onInputBlur, onInputChange, onPickPlace} = this.props;
        return (
            <React.Fragment>
                <Helmet>
                    <title>Find Address | Kuber</title>
                </Helmet>
                <AddressBar
                    onBlur={onInputBlur}
                    onChange={onInputChange}
                    name={"address"}
                    value={address}
                />
                <Center>📍</Center>
                <ExtendedButton value={"Pick this place"} onClick={onPickPlace} />
                <Map innerRef={mapRef} /> {/* 이를 통해, 이 컴포넌트가 mapRef 를 가지고 있으면 우리는 이 ref 를 찾을 수 있게 된다. */}
            </React.Fragment>
        )
    }
}

export default FindAddressPresenter;