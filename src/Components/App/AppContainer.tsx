import React from "react";
import {graphql} from "react-apollo";
import {toast, ToastContainer} from "react-toastify"
import 'react-toastify/dist/ReactToastify.min.css';
import theme from "../../theme"
import { ThemeProvider } from '../../typed-components';
import AppPresenter from "./AppPresenter";
import {IS_LOGGEDIN} from "./AppQueries.local";

const AppContainer = ({data}) => (
    <React.Fragment>
        <ThemeProvider theme={theme}>
            <AppPresenter isLoggedIn={data.auth.isLoggedIn}/>
        </ThemeProvider>
        <ToastContainer draggable={true} position={toast.POSITION.BOTTOM_CENTER} />
    </React.Fragment>
);

// 아래처러 graphql 로 싸게 되면 전체를 <Mutation> 테그로 싸는 것 같이 행동하게 된다.(redux 의 connect 랑 비슷)
export default graphql(IS_LOGGEDIN)(AppContainer);