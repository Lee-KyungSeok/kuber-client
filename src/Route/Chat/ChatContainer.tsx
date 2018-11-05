import { SubscribeToMoreOptions } from "apollo-client";
import React from "react";
import { Mutation, MutationFn, Query } from "react-apollo";
import { RouteComponentProps } from "react-router-dom";
import { USER_PROFILE } from "../../sharedQueries";
import { getChat, getChatVariables, sendMessage, sendMessageVariables, userProfile } from "../../types/api";
import ChatPresenter from "./ChatPresenter";
import { GET_CHAT, SEND_MESSAGE, SUBSCRIBE_TO_MESSAGES } from "./ChatQueries";

interface IProps extends RouteComponentProps<any> {}

interface IState {
    message: "";
}
 
class ProfileQuery extends Query<userProfile> {}
class ChatQuery extends Query<getChat, getChatVariables> {}
class SendMessageMutation extends Mutation<sendMessage, sendMessageVariables> {}

class ChatContainer extends React.Component<IProps, IState> {
    public sendMessageFn: MutationFn;

    constructor(props: IProps) {
        super(props);

        if (!props.match.params.chatId) {
            props.history.push("/");
        }

        this.state = {
            message: ""
        };
    }

    public render() {
        const {match: {params: {chatId} } } = this.props;

        const { message } = this.state;

        return (
            <ProfileQuery query={USER_PROFILE}>
                {({data: userData}) => (
                    <ChatQuery query={GET_CHAT} variables={{chatId}}>
                        {({data, loading, subscribeToMore}) => {
                            const subscribeToMoreOptions = {
                                document: SUBSCRIBE_TO_MESSAGES,
                                updateQuery: (prev, { subscriptionData }) => {
                                    if(!subscriptionData.data) {
                                        return prev;
                                    }

                                    // ===== graph yoga 의 pubsub 버그 때문에 이를 해결하는 간단한 코드 작성 (중복되었으면 subscribe 하지 않고 return 해 버린다.)
                                    const {
                                        data: { MessageSubscription }
                                    } = subscriptionData;
                                    
                                    const {
                                        GetChat: {
                                          chat: { messages }
                                        }
                                    } = prev;
                                    
                                    const newMessageId = MessageSubscription.id;
                                    const latestMessageId = messages[messages.length - 1].id;

                                    if (newMessageId === latestMessageId) {
                                        return;
                                    }

                                    // =====

                                    // 새로운 메시지가 들어오면 이를 메세지 영역에 추가하여 보여준다.
                                    const newObject = Object.assign({}, prev, {
                                        GetChat: {
                                            ...prev.GetChat,
                                            chat: {
                                                ...prev.GetChat.chat,
                                                messages: [
                                                    ...prev.GetChat.chat.messages,
                                                    MessageSubscription
                                                ]
                                            }
                                        }
                                    });
                                    return newObject;
                                }
                            };

                            subscribeToMore(subscribeToMoreOptions);

                            return (
                                <SendMessageMutation mutation={SEND_MESSAGE}>
                                    {sendMessageFn => {
                                        this.sendMessageFn = sendMessageFn;
                                        return (
                                            <ChatPresenter
                                                data={data}
                                                loading={loading}
                                                userData={userData}
                                                messageText={message}
                                                onInputChange={this.onInputChange}
                                                onSubmit={this.onSubmit}
                                            />
                                        );
                                    }}
                                </SendMessageMutation>
                            );
                        }}
                    </ChatQuery>
                )}
            </ProfileQuery>
        )
    }

    public onInputChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        const {
                target: { name, value }
            } = event;
            this.setState({
                [name]: value
            } as any);
    }

    public onSubmit = () => {
        const { message } = this.state;
        const { match: { params: {chatId} } } = this.props;

        if(message !== "") {
            this.setState({
                message: ""
            });

            this.sendMessageFn({
                variables: {
                    chatId,
                    text: message
                }
            });
        }
        return;
    }
}

export default ChatContainer;