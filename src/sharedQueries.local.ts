import { gql } from "apollo-boost";

// 반복되는 로그인 mutation 을 분리해서 사용한다. (@client 를 이용해서 서버가 아니라 apollo.ts 의 logUserIn 를 실행시킨다.)
export const LOG_USER_IN = gql`
    mutation logUserIn($token: String!) {
        logUserIn(token: $token) @client
    }
`;

export const LOG_USER_OUT = gql`
    mutation logUserOut {
        logUserOut @clinet
    }
`;