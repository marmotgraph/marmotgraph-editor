/*
*   Copyright (c) 2020, EPFL/Human Brain Project PCO
*
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*   Unless required by applicable law or agreed to in writing, software
*   distributed under the License is distributed on an "AS IS" BASIS,
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*   See the License for the specific language governing permissions and
*   limitations under the License.
*/

import { observable, computed, action, runInAction, makeObservable } from "mobx";
import * as Sentry from "@sentry/browser";

const rootPath = window.rootPath || "";

export class AuthStore {
  isUserAuthorized = false;
  user = null;
  isRetrievingUserProfile = false;
  userProfileError = false;
  authError = null;
  authSuccess = false;
  isTokenExpired = false;
  isInitializing = true;
  initializationError = null;
  isLogout = false;
  keycloak = null;
  endpoint = null;

  transportLayer = null;

  constructor(transportLayer) {
    makeObservable(this, {
      isUserAuthorized: observable,
      user: observable,
      isRetrievingUserProfile: observable,
      userProfileError: observable,
      authError: observable,
      authSuccess: observable,
      isTokenExpired: observable,
      isInitializing: observable,
      initializationError: observable,
      isLogout: observable,
      accessToken: computed,
      isAuthenticated: computed,
      hasUserProfile: computed,
      hasWorkspaces: computed,
      workspaces: computed,
      logout: action,
      retrieveUserProfile: action,
      initializeKeycloak: action,
      login: action,
      authenticate: action,
      firstName: computed
    });

    if (Storage === undefined) {
      throw "The browser must support WebStorage API";
    }

    this.transportLayer = transportLayer;
  }

  get accessToken() {
    return this.isAuthenticated ? this.keycloak.token: "";
  }

  get isAuthenticated() {
    return this.authSuccess;
  }

  get hasUserProfile() {
    return !!this.user;
  }

  get hasWorkspaces() {
    return this.user && this.user.workspaces instanceof Array && !!this.user.workspaces.length;
  }

  get workspaces() {
    return this.hasWorkspaces ? this.user.workspaces: [];
  }

  get firstName() {
    const firstNameReg = /^([^ ]+) .*$/;
    if (this.hasUserProfile && this.user) {
      if (this.user.givenName) {
        return this.user.givenName;
      }
      if (this.user.name) {
        if (firstNameReg.test(this.user.name)) {
          return this.user.name.match(firstNameReg)[1];
        }
        return this.user.name;
      }
      if (this.user.username) {
        return this.user.username;
      }
    }
    return "";
  }

  logout() {
    this.authSuccess = false;
    this.isTokenExpired = true;
    this.isUserAuthorized = false;
    this.user = null;
    this.keycloak.logout({redirectUri: `${window.location.protocol}//${window.location.host}${rootPath}/logout`});
    this.isLogout = true;
  }

  async retrieveUserProfile() {
    if (this.isAuthenticated && !this.user) {
      this.userProfileError = false;
      this.isRetrievingUserProfile = true;
      try {
        const { data } = await this.transportLayer.getUserProfile();
        //throw {response: { status: 403}};
        runInAction(() => {
          this.isUserAuthorized = true;
          const user = (data && data.data)?data.data:{ workspaces: []};
          user.workspaces = Array.isArray(user.workspaces)?user.workspaces.sort((a, b) => a.name.localeCompare(b.name)):[];
          //user.workspaces = []; // uncomment to simulate a user without any workspace
          this.user = user;
          this.isRetrievingUserProfile = false;
        });
      } catch (e) {
        runInAction(() => {
          if (e.response && e.response.status === 403) {
            this.isUserAuthorized = false;
            this.isRetrievingUserProfile = false;
          } else {
            this.isUserAuthorized = false;
            this.userProfileError = e.message ? e.message : e;
            this.isRetrievingUserProfile = false;
          }
        });
      }
    }
    return this.hasUserProfile;
  }

  initializeKeycloak(resolve, reject) {
    const keycloak = window.Keycloak({
      "realm": "hbp",
      "url":  this.endpoint,
      "clientId": "kg"
    });
    runInAction(() => this.keycloak = keycloak);
    keycloak.onAuthSuccess = () => {
      runInAction(() => {
        this.authSuccess = true;
        this.isInitializing = false;
      });
      resolve(true);
    };
    keycloak.onAuthError = error => {
      runInAction(() => {
        this.authError = error.error_description;
      });
      reject(error.error_description);
    };
    keycloak.onTokenExpired = () => {
      runInAction(() => {
        this.authSuccess = false;
        this.isTokenExpired = true;
      });
      // keycloak
      //   .updateToken(30)
      //   .catch(() => runInAction(() => {
      //     this.authSuccess = false;
      //     this.isTokenExpired = true;
      //   }));
    };
    //keycloak.init({ onLoad: "login-required", pkceMethod: "S256" });
    keycloak.init({ onLoad: "login-required", flow: "implicit" });
  }

  login() {
    if(!this.isAuthenticated && this.keycloak) {
      this.keycloak.login();
    }
  }

  async authenticate() {
    this.isLogout = false;
    this.isInitializing = true;
    this.authError = null;
    try {
      const { data } = await this.transportLayer.getAuthEndpoint();
      runInAction(() => {
        this.endpoint =  data && data.data? data.data.endpoint :null;
        const sentryUrl = data && data.data? data.data.sentryUrl :null;
        if (sentryUrl) {
          Sentry.init({
            dsn: sentryUrl,
            environment: window.location.host
          });
        }
      });
      if(this.endpoint) {
        try {
          await new Promise((resolve, reject) => {
            const keycloakScript = document.createElement("script");
            keycloakScript.src = this.endpoint + "/js/keycloak.js";
            keycloakScript.async = true;

            document.head.appendChild(keycloakScript);
            keycloakScript.onload = () => {
              this.initializeKeycloak(resolve, reject);
            };
            keycloakScript.onerror = () => {
              document.head.removeChild(keycloakScript);
              runInAction(() => {
                this.isInitializing = false;
                this.authError = `Failed to load resource! (${keycloakScript.src})`;
              });
              reject(this.authError);
            };
          });
        } catch (e) {
          // error are already set in the store so no need to do anything here
          // window.console.log(e);
        }
      } else {
        runInAction(() => {
          this.isInitializing = false;
          this.authError = "service endpoints configuration is not correctly set";
        });
      }
    } catch (e) {
      runInAction(() => {
        this.isInitializing = false;
        this.authError = `Failed to load service endpoints configuration (${e && e.message?e.message:e})`;
      });
    }
    return this.authSuccess;
  }

  // async saveProfilePicture(picture) {
  //   try {
  //     await this.transportLayer.updateUserPicture(picture);
  //     runInAction(() => {
  //       this.user.picture = picture;
  //     });
  //   } catch (e) {
  //     // Catch Error
  //   }
  // }

}

export default AuthStore;