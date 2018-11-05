import PropTypes from "prop-types";
import React from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

import AddPlace from "../../Route/AddPlace";
import Chat from "../../Route/Chat";
import EditAccount from "../../Route/EditAccount";
import FindAddress from "../../Route/FindAddress";
import Home from "../../Route/Home";
import Login from "../../Route/Login";
import PhoneLogin from "../../Route/PhoneLogin";
import Places from "../../Route/Places";
import Ride from "../../Route/Ride";
import Settings from "../../Route/Settings";
import SocialLogin from "../../Route/SocialLogin";
import VerifyPhone from "../../Route/VerifyPhone";

interface IProps {
    isLoggedIn: boolean;
}

const AppPresenter: React.SFC<IProps> = ({ isLoggedIn }) => 
    <BrowserRouter>{ isLoggedIn ? <LoggedInRoutes/> : <LoggedOutRoutes/> }</BrowserRouter>;

const LoggedOutRoutes: React.SFC = () => (
    <Switch>
        <Route path={"/"} exact={true} component={Login}/>
        <Route path={"/phone-login"} component={PhoneLogin}/>
        <Route path={"/verify-phone"} component={VerifyPhone}/>
        <Route path={"/social-login"} component={SocialLogin}/>
        {/* temp */}
        <Route path={"/home"} exact={true} component={Home}/>
        <Redirect from={"*"} to={"/"}/>
    </Switch>
)

const LoggedInRoutes: React.SFC = () => (
    <Switch>
        <Route path={"/"} exact={true} component={Home}/>
        <Route path={"/ride/:rideId"} exact={true} component={Ride}/>
        <Route path={"/chat/:chatId"} exact={true} component={Chat}/>
        <Route path={"/edit-account"} exact={true} component={EditAccount}/>
        <Route path={"/settings"} exact={true} component={Settings}/>
        <Route path={"/places"} exact={true} component={Places}/>
        <Route path={"/add-place"} exact={true} component={AddPlace}/>
        <Route path={"/find-address"} exact={true} component={FindAddress}/>
        <Redirect from={"*"} to={"/"}/>
    </Switch>
)

AppPresenter.propTypes = {
    isLoggedIn: PropTypes.bool.isRequired
}

export default AppPresenter;