import React from "react";
import ReactDOM from "react-dom";
import { RouteComponentProps } from 'react-router-dom';
import { geoCode, reverseGeoCode } from '../../mapHelpers';
import FindAddressPresenter from "./FindAddressPresenter";

interface IProps extends RouteComponentProps<any> {
    google: any;
}

interface IState {
    lat: number;
    lng: number;
    address: string;
}

class FindAddressContainer extends React.Component<IProps,IState> {
    public mapRef: any; // map Object 를 저장한다.
    public map: google.maps.Map; // google 객체에서 maps.Map 을 가져올 수 있다. (index 에서 high order function 으로 설정했으므로)

    constructor(props) {
        super(props);

        // HTML 요소(Presenter 포함)의 구체적이 조절이 필요할 때 ref 를 생성한다. 즉, focus, blur 등 설정할 때 this.input.focus 등으로 설정하게 된다.
        this.mapRef = React.createRef();    
    }

    public componentDidMount() {
        // 현재 좌표를 가져온다. 여기서 성공시, 실패시 동작을 콜백으로 넘길 수 있다.
        navigator.geolocation.getCurrentPosition(this.handleGeoSuccess, this.handleGeoError);
    }

    public render() {
        const {address} = this.state;

        return (
            <FindAddressPresenter 
                mapRef={this.mapRef}
                address={address}
                onInputChange = {this.onInputChange}
                onInputBlur = {this.onInputBlur}
                onPickPlace = {this.onPickPlace}
            />
        );
    }

    public handleGeoSuccess: PositionCallback = (position: Position) => {
        const {coords: {latitude, longitude} } = position; // 현재 위치를 가져올 수 있다.
        this.setState({
            lat: latitude,
            lng: longitude
        })
        // map 을 init
        this.loadMap(latitude, longitude);
        // init 시 주소가 있다면 주소를 업데이트
        this.reverseGeoCodeAddress(latitude, longitude);
    }

    public handleGeoError: PositionErrorCallback = () => {
        console.log("No location");
    }

    public loadMap = (lat, lng) => {
        const {google} = this.props;
        const maps = google.maps;
        const mapNode = ReactDOM.findDOMNode(this.mapRef.current); // DOM 안에서 mapRef 를 가지고 있는 DOMNode 를 찾아준다.
        const mapConfig: google.maps.MapOptions = {
            center: {
                lat, lng
            },
            disableDefaultUI: true,
            minZoom: 8,
            zoom: 11

        }
        // map 을 가진 node 와 configuration 을 가져와서 map 객체를 만들어 준다.
        this.map = new maps.Map(mapNode, mapConfig);
        // map 에서 drag 해주는 기능을 수행한다.
        this.map.addListener("dragend", this.handleDragEnd);
    }

    // 보이는 지도 부분에서 center 를 찾아서 lat, lng 를 state 에 넣어준다.
    public handleDragEnd = () => {
        const newCenter = this.map.getCenter();
        const lat = newCenter.lat();
        const lng = newCenter.lng();

        this.setState({
            lat, lng
        })

        // 좌표에 주소가 있다면 업데이트
        this.reverseGeoCodeAddress(lat, lng);
    }

    public onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {target: {name, value} } = event;

        this.setState({
            [name]: value
        } as any);
    }

    public onInputBlur = async () => {
        const {address} = this.state;
        const result = await geoCode(address);
        if(result !== false) {
            const {lat, lng, formatted_address: formattedAddress} = result;
            this.setState({
                address: formattedAddress,
                lat, lng
            });

            // 맵의 중앙으로 가게 만든다.
            this.map.panTo({ lat, lng});
        }
    }

    // geocode 로 address 를 가져온다.
    public reverseGeoCodeAddress = async (lat:number, lng: number) => {
       // reversedAddress 가 false 가 아닌 경우에만 주소를 업데이트 한다. (좌표만 있고 주소이름은 없을 수도 있기 때문)
       const reversedAddress = await reverseGeoCode(lat, lng);
       if(reversedAddress !== false) {
           this.setState({
               address: reversedAddress
           });
       }
    }

    // place 를 선택하는 경우 place 를 add 하는 곳으로 화면을 이동하면서 state 에 주소, lat, lng 를 넘긴다.
    public onPickPlace = () => {
        const { address, lat, lng } = this.state;
        const { history } = this.props;

        history.push({
            pathname: "/add-place",
            state: {
                address, lat, lng
            }
        });
    }
}

export default FindAddressContainer;