import React from "react";
import { Mutation } from 'react-apollo';
import { RouteComponentProps } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GET_PLACES } from '../../sharedQueries';
import { addPlace, addPlaceVariables } from '../../types/api';
import AddplacePresenter from './AddPlacePresenter';
import { ADD_PLACE } from './AddPlaceQuery';

interface IState {
    address: string;
    name: string;
    lat: number;
    lng: number;
}

interface IProps extends RouteComponentProps<any> {}

class AddPlaceMutation extends Mutation<addPlace, addPlaceVariables> {}

class AddPlaceContainer extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        // map 에서 place 를 추가 하여 돌아온 경우에는 state 에 값을 넣어주고 아닌 경우에는 초기화 시킨다.
        const { location: {state = {} } = {} } = props;
        this.state = {
            address: state.address || "",
            lat: state.lat || 0,
            lng: state.lng || 0,
            name: state.name || ""
        }
    }

    public render() {
        const {address, name, lat, lng} = this.state;
        const { history } = this.props;

        return (
            <AddPlaceMutation 
                mutation={ADD_PLACE}
                refetchQueries={[{query: GET_PLACES}]}
                onCompleted={data => {
                    const {AddPlace} = data;
                    if(AddPlace.ok) {
                        toast.success("Place added");
                        setTimeout(() => {
                            history.push("places");
                        }, 2000);
                    } else {
                        toast.error(AddPlace.error);
                    }
                }}
                variables={{
                    address,
                    isFav: false,
                    lat,
                    lng,
                    name,
                }}
            >
                {(addplaceFn, { loading }) => (
                    <AddplacePresenter
                        address={address}
                        name={name}
                        loading={loading}
                        onSubmit={addplaceFn}
                        onInputChange={this.onInputChange}
                        pickedAddress={lat !== 0 && lng !== 0}
                    />
                )}
            </AddPlaceMutation>
        )
    }

    public onInputChange: React.ChangeEventHandler<HTMLInputElement> = async event => {
        const { target: { name, value} } = event;

        this.setState({
            [name]: value
        } as any)
    }
}

export default AddPlaceContainer;