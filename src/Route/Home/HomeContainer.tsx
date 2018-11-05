import { SubscribeToMoreOptions } from "apollo-client";
import React from "react";
import { graphql, Mutation, MutationFn, Query } from 'react-apollo';
import ReactDOM from "react-dom";
import { RouteComponentProps } from 'react-router';
import { toast } from 'react-toastify';
import { acceptRide, acceptRideVariables, getDrivers, getRides, reportMovement, reportMovementVariables, requestRide, requestRideVariables, userProfile } from '../..//types/api';
import { geoCode, reverseGeoCode } from '../../mapHelpers';
import { USER_PROFILE } from '../../sharedQueries';
import HomePresenter from './HomePresenter';
import { ACCEPT_RIDE, GET_NEARBY_DRIVERS, GET_NEARBY_RIDE, REPORT_LOCATION, REQUEST_RIDE, SUBSCRIBE_NEARBY_RIDES } from './HomeQueries';

interface IState {
    isMenuOpen: boolean;
    toAddress: string;
    toLat: number;
    toLng: number;
    lat: number;
    lng: number;
    distance: string;
    duration?: string;
    price?: string;
    fromAddress: string;
    isDriving: boolean;
}

interface IProps extends RouteComponentProps<any> {
    google: any;
    reportLocation: MutationFn;
}

class ProfileQuery extends Query<userProfile> {}
class NearbyQueries extends Query<getDrivers>{}
class RequestRideMutation extends Mutation<requestRide, requestRideVariables>{}
class GetNearbyRides extends Query<getRides>{}
class AcceptRide extends Mutation<acceptRide, acceptRideVariables>{}

class HomeContainer extends React.Component<IProps, IState> {
    public mapRef: any;
    public map: google.maps.Map;
    public userMarker: google.maps.Marker;
    public toMarker: google.maps.Marker;
    public directions: google.maps.DirectionsRenderer;
    public drivers: google.maps.Marker[];

    public state = {
        distance: "",
        duration: undefined,
        fromAddress: "",
        isDriving: true,
        isMenuOpen: false,
        lat: 0,
        lng: 0,
        price: undefined,
        toAddress: "",
        toLat: 0,
        toLng: 0
    };

    constructor(props: IProps) {
        super(props);
        this.mapRef = React.createRef();
        this.drivers = [];
    }

    public componentDidMount() {
        navigator.geolocation.getCurrentPosition(
            this.handleGeoSuccess,
            this.handleGeoError
        );
    }

    public render() {
        const {
            isMenuOpen, 
            toAddress, 
            price,
            distance,
            fromAddress,
            lat,
            lng,
            toLat,
            toLng,
            duration,
            isDriving
        } = this.state;
        return (
            <ProfileQuery query={USER_PROFILE} onCompleted={this.handleProfileQuery}>
                {({data, loading}) => (
                    <NearbyQueries 
                        query={GET_NEARBY_DRIVERS}
                        pollInterval={5000} // 이렇게 pollInterval 을 통해 query 를 polling 할수도 있다.
                        // user 가 driver 라면 query 를 생략하고 다음 작업을 실행한다.
                        skip={isDriving}
                        onCompleted={this.handleNearbyDrivers}
                    >
                        {() => (
                            <RequestRideMutation
                                mutation={REQUEST_RIDE}
                                onCompleted={this.handleRideRequest}
                                variables={{
                                    distance,
                                    dropOffAddress: toAddress,
                                    dropOffLat: toLat,
                                    dropOffLng: toLng,
                                    duration: duration || "",
                                    pickUpAddress: fromAddress,
                                    pickUpLat: lat,
                                    pickUpLng: lng,
                                    price: price || 0
                                }}
                            >
                                {requestRideFn => (
                                    // driver 가 아닌 경우 ride 가 있는지 확인하는 작업은 생략하고 다음 작업을 진행한다.
                                    <GetNearbyRides query={GET_NEARBY_RIDE} skip={!isDriving}>
                                        {({ subscribeToMore, data: nearbyRide }) => {
                                            // subscribeToMore 를 이용해서 특정 시점에 subscribe 를 지정할 수 있다.
                                            const rideSubscriptionOptions: SubscribeToMoreOptions = {
                                                document: SUBSCRIBE_NEARBY_RIDES,
                                                updateQuery: (prev, {subscriptionData}) => {
                                                    // subscription 에 data(ride) 가 없다면 아무것도 하지 않는다.(이전것을 반환)
                                                    if (!subscriptionData.data) {
                                                        return prev;
                                                    }
                                                    // 새로운 ride 요청이 있다면 가 있다면 ride 를 업데이트 한다. (그러면 homepresenter 설정에 의해 popup 이 생성된다.)
                                                    const newObject = Object.assign({}, prev, {
                                                        GetNearbyRide: {
                                                            ...prev.GetNearbyRide,
                                                            ride: subscriptionData.data.NearbyRideSubscription
                                                        }
                                                    });
                                                    return newObject;
                                                }
                                            };

                                            // 드라이버라면 subscribe 를 실행하도록 한다.
                                            if(isDriving) {
                                                subscribeToMore(rideSubscriptionOptions);
                                            }

                                            return (
                                                <AcceptRide mutation={ACCEPT_RIDE} onCompleted={this.handleRideAcceptance}>
                                                    {acceptRideFn => (
                                                        <HomePresenter
                                                            loading={loading}
                                                            isMenuOpen={isMenuOpen}
                                                            toggleMenu={this.toggleMenu}
                                                            mapRef={this.mapRef}
                                                            toAddress={toAddress}
                                                            onInputChange={this.onInputChange}
                                                            price={price}
                                                            data={data}
                                                            onAddressSubmit={this.onAddressSubmit}
                                                            requestRideFn={requestRideFn}
                                                            nearbyRide={nearbyRide}
                                                            acceptRideFn={acceptRideFn}
                                                        />
                                                    )}
                                                </AcceptRide>
                                            );
                                        }}
                                    </GetNearbyRides>
                                )}
                            </RequestRideMutation>
                        )}
                    </NearbyQueries>
                )}
            </ProfileQuery>
        )
    }

    public toggleMenu = () => {
        this.setState(state => {
            return {
                isMenuOpen: !state.isMenuOpen
            };
        });
    }

    public handleGeoSuccess: PositionCallback = (position: Position) => {
        const { coords: { latitude, longitude } } = position;
        this.setState({
        lat: latitude,
        lng: longitude
        });

        this.getFromAddress(latitude, longitude);
        this.loadMap(latitude, longitude);
    }

    public handleGeoError: PositionErrorCallback = () => {
        console.log("No location");
    }

    // 현재 ddress 를 세팅한다.
    public getFromAddress = async (lat:number, lng:number) => {
        const address = await reverseGeoCode(lat, lng)
        if(address) {
            this.setState({
                fromAddress: address
            });
        }
    }

    public loadMap = (lat, lng) => {
        // 맵에 대한 정보를 가저ㅕ오고 map 객체를 생성한다.
        const { google } = this.props;
        const maps = google.maps;
        const mapNode = ReactDOM.findDOMNode(this.mapRef.current); 
        // mapNode 가 없다면 다시 loadMap 을 호출한다.
        if(!mapNode) {
            this.loadMap(lat, lng);
            return;
        }
        const mapConfig: google.maps.MapOptions = {
            center: {
                lat,
                lng
            },
            disableDefaultUI: true,
            zoom: 13
        };
        this.map = new maps.Map(mapNode, mapConfig);

        // 마커를 설정한다.
        const userMarkerOptions: google.maps.MarkerOptions = {
            icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: 7
            },
            position: {
                lat, lng
            }
        };
        this.userMarker = new maps.Marker(userMarkerOptions);
        this.userMarker.setMap(this.map);

        // watching 하도록 만든다.
        const watchOptions: PositionOptions = {
            enableHighAccuracy: true
        };
        navigator.geolocation.watchPosition(
            this.handleGeoWatchSuccess,
            this.handleGeoWatchError,
            watchOptions
        );
    }

    public handleGeoWatchSuccess = (position: Position) => {
        const { reportLocation } = this.props;
        const { coords: { latitude, longitude } } = position;
        this.userMarker.setPosition({lat: latitude, lng: longitude});
        this.map.panTo({lat:latitude, lng:longitude});

        reportLocation({
            variables: {
                lat: parseFloat(latitude.toFixed(10)),
                lng: parseFloat(longitude.toFixed(10)),
            }
        });
    }

    public handleGeoWatchError = () => {
        console.log("Error watching you");
    }

    public onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {target: { name, value }} = event;
        this.setState({
            [name]: value
        } as any);
    }

    public onAddressSubmit = async () => {
        const { toAddress } = this.state;
        const { google } = this.props;
        const maps = google.maps;
        const result = await geoCode(toAddress);
        if(result !== false) {
            const {lat, lng, formatted_address: formattedAddress} = result;

            // 도착지에 마커를 세팅한다.
            if(this.toMarker) {
                this.toMarker.setMap(null);
            }
            const toMarkerOptions: google.maps.MarkerOptions = {
                position: {
                    lat, lng
                }
            };
            this.toMarker = new maps.Marker(toMarkerOptions);
            this.toMarker.setMap(this.map);

            // user 와 도착점까지의 lat, lng 을 bounds 로 설정
            const bounds = new maps.LatLngBounds();
            bounds.extend({lat, lng});
            bounds.extend({lat: this.state.lat, lng: this.state.lng});
            this.map.fitBounds(bounds);

            // 도착지에 대한 정보를 state 에 세팅한다. 세팅 후에 craetePath 를 호출한다.
            this.setState({
                toAddress: formattedAddress,
                toLat: lat,
                toLng: lng
            }, this.createPath);
        }
    }

    // route 를 그러준다.
    public createPath = () => {
        const { toLat, toLng, lat, lng} = this.state;

        if(this.directions) {
            this.directions.setMap(null);
        }

        // 마커 등 설정
        const renderOptions: google.maps.DirectionsRendererOptions = {
            polylineOptions: {
                strokeColor: "#000" // direction 색을 검정으로 지정
            },
            suppressMarkers: true
        };
        this.directions = new google.maps.DirectionsRenderer(renderOptions);

        const directionService: google.maps.DirectionsService = new google.maps.DirectionsService();
        const to = new google.maps.LatLng(toLat, toLng);
        const from = new google.maps.LatLng(lat, lng);
        // 위치 및 옵션 설정
        const directionOptions: google.maps.DirectionsRequest = {
            destination: to,
            origin: from,
            travelMode: google.maps.TravelMode.DRIVING // 자전거모드, driving 모드 등 선택 가능
        };

        // route 를 계산한 후 이를 map 에 적용한다.
        directionService.route(directionOptions, this.handleRouteRequest);
    }

    public handleRouteRequest = (
        result: google.maps.DirectionsResult,
        status: google.maps.DirectionsStatus
    ) => {
        if(status === google.maps.DirectionsStatus.OK) {
            // route 를 그릴 때, distance 와 duration 을 가져올 수 있다.
            const { routes } = result;
            const {
                distance: {text: distance}, 
                duration: {text: duration}
            } = routes[0].legs[0];

            // route 를 map 그린다.
            this.directions.setDirections(result);
            this.directions.setMap(this.map);

            // 거리와 시간을 계산을 state 에 저장한다. 그 후 price 를 계산하여 세팅한다.
            this.setState({
                distance, duration
            }, this.setPrice);

        } else {
            toast.error("There is no route there, you have to swim");
        }
    }

    // 가격을 결정한다.
    public setPrice = () => {
        const {distance} = this.state;
        if(distance) {
            this.setState({
                price: Number(parseFloat(distance.replace(",", "")) * 3).toFixed(2)
            })
        }
    }

    public handleNearbyDrivers = (data: {} | getDrivers) => {
        if("GetNearbyDrivers" in data) {
            const { GetNearbyDrivers: { drivers, ok } } = data;
            if(ok && drivers) {
                for(const driver of drivers) {
                    if(driver && driver.lastLat && driver.lastLng) {

                        // api 에서 온 driver id 와 markerId 가 동일하면 driver 를 찾았다는 의미이다.
                        const exisitingDriver: google.maps.Marker | undefined = this.drivers.find(
                            (driverMarker: google.maps.Marker) => {
                                const markerID = driverMarker.get("ID");
                                return markerID === driver.id;
                            }
                        );

                        // 만약 driver 가 존재한다면 찾았다면 driver 의 lat, lng 를 업데이트 해주고
                        // 못찾았다면 내 근처 driver pool 에 push 하여 생성해준다.
                        if(exisitingDriver) {
                            exisitingDriver.setPosition({
                                lat: driver.lastLat,
                                lng: driver.lastLng
                            });
                            exisitingDriver.setMap(this.map);
                        } else {
                            const markerOptions: google.maps.MarkerOptions = {
                                icon: {
                                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                    scale: 5
                                },
                                position: {
                                    lat: driver.lastLat,
                                    lng: driver.lastLng
                                }
                            };
    
                            const newMarker : google.maps.Marker = new google.maps.Marker(
                                markerOptions
                            );
    
                            this.drivers.push(newMarker);
                            newMarker.set("ID", driver.id);
                            newMarker.setMap(this.map);
                        }
                    }
                }
            }
        }
    }

    // ride request 에 대한 응답을 처리한다.
    public handleRideRequest = (data: requestRide) => {
        const { history } = this.props;
        const { RequestRide } = data;
        if (RequestRide.ok) {
            toast.success("Drive requested, finding a driver");
            // rideRequest 를 하면 ride 페이지로 이동한다.
            history.push({
                pathname: `/ride/${RequestRide.ride!.id}`
            })
        } else {
            toast.error(RequestRide.error);
        }   
    }

    // get profile 에 대한 응답을 처리하고 성공한다면 driving 를 변경 로 변경한다.
    public handleProfileQuery = (data: userProfile) => {
        const {GetMyProfile} = data;
        if(GetMyProfile.user) {
            const { user: {isDriving} } = GetMyProfile;
            this.setState({
                isDriving
            })
        }
    }

    public handleRideAcceptance = (data: acceptRide) => {
        const { history } = this.props;
        const { UpdateRideStatus } = data;
        // accept 를 누르면 ride 페이지로 이동한다.
        if(UpdateRideStatus.ok) {
            history.push(`/ride/${UpdateRideStatus.rideId}`);
        }
    }
}

// 만약 high order component 방식으로 만들고 싶은 경우에는 name 을 반드시 주도록 하자!
// 하지만 이렇게 한 경우 한가지 mutation 밖에 사용할 수 없는 단점이 존재한다.
export default graphql<any, reportMovement, reportMovementVariables>(
    REPORT_LOCATION, 
    {
        name: "reportLocation"
    }
)(HomeContainer);