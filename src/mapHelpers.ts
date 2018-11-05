import axios from "axios";
import { toast } from 'react-toastify';
import { MAPS_KEY } from './keys';

// 주소를 받아 좌표를 얻는다.
export const geoCode = async (address: string) => {
  const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${MAPS_KEY}`;
  const { data } = await axios(URL);
  if(!data.error_message) {
        const { results } = data;
        const firstPlace = results[0];

        const {
        formatted_address,
        geometry: { location: { lat, lng } }
        } = firstPlace;

        return { formatted_address, lat, lng };
    } else {
        toast.error(data.error_message);
        return false;
    }
};

// 좌표를 받아 주소를 얻는다.
export const reverseGeoCode = async (lat: number, lng: number) => {
    const URL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_KEY}`;
    const {data} = await axios.get(URL);
    
    // 주소를 잘 가져온 경우 address 를, 아닌경우 false 를 반환 (여기서 값들은 google map 에서 정의해놓은 값이다.)
    if(!data.error_message) {
        const { results } = data;
        const firstPlace = results[0];
        // result 가 없는 경우도 생기므로 이를 예외처리한다.
        if(!firstPlace) {
            return false;
        }
        const address = firstPlace.formatted_address;
        return address;
    } else {
        return false;
    }
};