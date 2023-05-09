/*
 * Copyright 2018 - 2021 Swiss Federal Institute of Technology Lausanne (EPFL)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This open source software code was developed in part or in whole in the
 * Human Brain Project, funded from the European Union's Horizon 2020
 * Framework Programme for Research and Innovation under
 * Specific Grant Agreements No. 720270, No. 785907, and No. 945539
 * (Human Brain Project SGA1, SGA2 and SGA3).
 *
 */

import React, { Suspense } from "react";
import { observer } from "mobx-react-lite";
import { Navigate, useSearchParams, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "react-jss";

import API from "../Services/API";
import RootStore from "../Stores/RootStore";
import StoresProvider from "./StoresProvider";
import AuthAdapter from "../Services/AuthAdapter";
import APIProvider from "./APIProvider";
import { Space as SpaceType } from "../types";

import BrowserEventHandler from "./BrowserEventHandler";
import Shortcuts from "./Shortcuts";
import Styles from "./Styles";
import Layout from "./Layout";
import GlobalError from "./GlobalError";
import SpinnerPanel from "../Components/SpinnerPanel";
import Settings from "./Settings";

const AuthProvider = React.lazy(() => import("./AuthProvider"));
const UserProfile = React.lazy(() => import("./UserProfile"));
const Authenticate = React.lazy(() => import("./Authenticate"));
const Space = React.lazy(() => import("./Space"));
const Types = React.lazy(() => import("./Types"));
const NotFound = React.lazy(() => import("./NotFound"));
const Home = React.lazy(() => import("./Home"));
const Help = React.lazy(() => import("./Help"));
const Browse = React.lazy(() => import("./Browse"));

const Instance = React.lazy(() => import("./Instance"));
const RawInstance = React.lazy(() => import("./RawInstance"));
const InstanceCreation = React.lazy(() => import("./InstanceCreation"));
const InstanceView = React.lazy(() => import("./InstanceView"));
const Logout = React.lazy(() => import("./Logout"));

interface AppProps {
  stores: RootStore;
  api: API;
  authAdapter?: AuthAdapter;
}

const App = observer(({ stores, api, authAdapter } : AppProps) => {

  const { appStore, typeStore } = stores;

  const [searchParams] = useSearchParams();

  const theme = appStore.currentTheme;

  const currentSpace = appStore.currentSpace as SpaceType|null;
  const isTypeFetched = currentSpace && typeStore.space === currentSpace.id && typeStore.isFetched;
  const spaceParam = searchParams.get("space");
  const skipHistory = searchParams.get("skipHistory") === "true";

  const InstanceComponent = isTypeFetched?Instance:RawInstance;

  return (
    <ThemeProvider theme={theme}>
      <Styles />
      <APIProvider api={api}>
        <AuthProvider adapter={authAdapter} >
          <StoresProvider stores={stores}>
            <Layout>
              {appStore.globalError?
                <GlobalError />
                :
                <Settings authAdapter={authAdapter}>
                  <Suspense fallback={<SpinnerPanel text="Loading resource..." />} >
                    <Routes>
                      <Route path={"/logout"} element={<Logout />}/>
                      <Route path={"*"} element={
                        <Authenticate >
                          <UserProfile>
                            <Shortcuts />
                            <BrowserEventHandler />
                            <Suspense fallback={<SpinnerPanel text="Loading resource..." />} >
                              <Routes>
                                <Route
                                  path="/instances/:id/create"
                                  element={
                                    <>
                                    {isTypeFetched?
                                      <InstanceCreation>
                                        <InstanceView mode="create" />
                                      </InstanceCreation>
                                      :
                                      <Navigate to="/browse" />
                                    }
                                    </>
                                  } 
                                />
                                <Route
                                  path="/instances/:id/raw"
                                  element={
                                    <RawInstance>
                                      {(_, space) => (
                                        <Space space={space} skipHistory={skipHistory} >
                                          <Types>
                                            <InstanceView mode="raw" />
                                          </Types>
                                        </Space>
                                      )}  
                                    </RawInstance>
                                  } 
                                />
                                <Route 
                                  path="/instances/:id/*" 
                                  element={
                                    <InstanceComponent>
                                      {(instanceId, space) => (
                                        <Space space={space} skipHistory={skipHistory} >
                                          <Types>
                                            <Routes>
                                              <Route path="" element={<InstanceView mode="view" />} />
                                              <Route path="edit" element={<InstanceView mode="edit" />} />
                                              <Route path="graph" element={<InstanceView mode="graph" />} />
                                              <Route path="release" element={<InstanceView mode="release" />} />
                                              <Route path="manage"  element={<InstanceView mode="manage" />} />
                                              <Route path="*" element={<Navigate to={`/instances/${instanceId}`} />} />
                                            </Routes>
                                          </Types>
                                        </Space>
                                      )}  
                                    </InstanceComponent>
                                  } 
                                />
                                <Route
                                  path="/browse"
                                  element={
                                    <Space space={spaceParam} skipHistory={skipHistory} >
                                      <Types>
                                        <Browse />
                                      </Types>
                                    </Space>
                                  } 
                                />
                                <Route path="/help/*" element={<Help/>} />
                                <Route
                                  path="/"
                                  element={
                                    <Space space={spaceParam} skipHistory={skipHistory} >
                                      <Types>
                                        <Home />
                                      </Types>
                                    </Space>
                                  } 
                                />
                                <Route path="*" element={<NotFound/>} />
                              </Routes>
                            </Suspense>
                          </UserProfile>
                        </Authenticate>
                      }/>
                    </Routes>
                  </Suspense>
                </Settings>
              }
            </Layout>
          </StoresProvider>
        </AuthProvider>
      </APIProvider>
    </ThemeProvider>
  );
});
App.displayName = "App";

export default App;