import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink, concat, Operation, split } from "apollo-link";
import { onError } from "apollo-link-error";
import { HttpLink } from "apollo-link-http";
import { withClientState } from "apollo-link-state";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { toast } from "react-toastify";

const isDev = process.env.NODE_ENV === "development";

const getToken = () => {
    const token = localStorage.getItem("jwt");
    if(token) {
        return token;
    } else {
        return "";
    }
}

const cache = new InMemoryCache;

// intercept 하는 middleware!!
const authMiddleware = new ApolloLink((operation: Operation, forward: any) => {
    operation.setContext({
        headers: {
            "X-JWT": getToken()
        }
    });

    // 다음으로 넘긴다는 뜻
    return forward(operation);
});

const httpLink = new HttpLink({
    uri: isDev
    ? "http://localhost:4000/graphql"
    : "production 서버 주소"
});

const wsLink = new WebSocketLink({
    options: {
        connectionParams: {
            "X-JWT": getToken()
        },
        reconnect: true
    },
    uri: isDev
      ? "ws://localhost:4000/subscription"
      : "production 서버 주소"
});

// websocket 을 보고 아니라면 http 를 실행시킨다.
const combinedLinks = split(
    ({ query }) => {
        const { kind, operation }: any = getMainDefinition(query);
        return kind === "OperationDefinition" && operation === "subscription";
    },
    wsLink,
    httpLink
);

// 에러에 대한 ㅣink
const errorLink = onError(( {graphQLErrors, networkError}) => {
    if (graphQLErrors) {
        graphQLErrors.map(({message}) => {
            toast.error(`Unexpected error: ${message}`);
        })
    }
    if(networkError) {
        toast.error(`Network error: ${networkError}`);
    }
});

// cache 라는 변수가 생기고 resolver 를 정의
const localStateLink = withClientState({
    cache,
    defaults: {
        auth: {
            __typename: "Auth",
            isLoggedIn: Boolean(localStorage.getItem("jwt"))
        }
    },
    resolvers: {
        Mutation: {
            logUserIn: (_, {token}, {cache: appCache}) => {
                localStorage.setItem("jwt", token);
                appCache.writeData({
                    data: {
                        auth: {
                            __typename: "Auth",
                            isLoggedIn: true
                        }
                    }
                });
                return null;
            },
            logUserOut: (_, __, {cache: appCache}) => {
                localStorage.removeItem("jwt");
                cache.writeData({
                    data: {
                        auth: {
                            __typename: "Auth",
                            isLoggedIn: false
                        }
                    }
                });
                return null;
            }
        }
    }
});

const client = new ApolloClient({
    cache,
    // link: apollo 가 resolvers 와 어떻게 상호작용하는지에 대한 것
    link: ApolloLink.from([
        errorLink,
        localStateLink,
        concat(authMiddleware, combinedLinks)
    ])
});

export default client;

// ================ 아래는 apollo-boost 를 사용할 때 이용했다.
/* import ApolloClient, { Operation } from "apollo-boost";
const client = new ApolloClient({
    clientState: {
        // default state 를 지정할 수 있다.
        // default client 는 Auth, keycode 는 isLoggedIn 이다.
        defaults: {
            auth: {
                __typename: "Auth",
                isLoggedIn: Boolean(localStorage.getItem("jwt"))
            }
        },
        // resolver 를 지정할 수 있다.
        resolvers: {
            Mutation: {
                // login 하기
                logUserIn: (_, {token}, {cache}) => {
                    localStorage.setItem("jwt", token);
                    cache.writeData({
                        data: {
                            auth: {
                                __typename: "Auth",
                                isLoggedIn: true
                            }
                        }
                    });
                    return null;
                },
                // logout 시키기
                logUserOut: (_, __, {cache}) => {
                    localStorage.removeItem("jwt");
                    cache.writeData({
                        data: {
                            auth: {
                                __typename: "Auth",
                                isLoggedIn: false
                            }
                        }
                    });
                    return null;
                }
            }
        }
    },
    // graphql 에서 요청을 보낼때 intercept 한다. => 그 후 query, mutation 등 수행할 때 context 를 넣어준다.
    request: async (operation: Operation) => {
        operation.setContext({
           headers: {
               "X-JWT": localStorage.getItem("jwt") || ""
           }
        })
    },
    // endpoint 를 정해준다.
    uri: "http://localhost:4000/graphql"
});

export default client;
*/