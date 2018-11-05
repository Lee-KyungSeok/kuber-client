import {gql} from "apollo-boost";

// gql 에 적용되며, API 에 자동으로 실행될 쿼리가 된다.
// @client로 보내면 API 에 보내지 않고 캐쉬에 보내게 된다.
export const IS_LOGGEDIN = gql`
    {
        auth {
            isLoggedIn @client
        }   
    }
`;