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

import { useState, useEffect, useRef } from "react";
import { AxiosError } from "axios";
import { UserProfile, Space } from "../../src/types";
import useAPI from "./useAPI";

export interface GetUserProfileQuery {
  data?: UserProfile;
  isUninitialized: boolean;
  isFetching: boolean;
  error?: string;
  isError: boolean;
  isSuccess?: boolean;
  refetch: () => Promise<void>;
}

const useGetUserProfileQuery = (): GetUserProfileQuery => {
  const initializedRef = useRef(false);

  const [isUninitialized, setUninitialized] = useState(true);
  const [isFetching, setFetching] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setSuccess] = useState<boolean | undefined>(undefined);
  const [data, setData] = useState<UserProfile | undefined>(undefined);

  const API = useAPI();

  const spaceComparer = (a: Space, b: Space) => a.name.localeCompare(b.name);

  const sortSpaces = (spaces?: Space[]) => {
    if (Array.isArray(spaces)) {
      return spaces.sort(spaceComparer);
    }
    return [];
  }

  const getUserProfile = async (): Promise<void> => {
    setUninitialized(false);
    setFetching(true);
    setError(undefined);
    setIsError(false);
    setSuccess(undefined);
    setData(undefined);
    try {
      const userProfile = await API.getUserProfile();
      userProfile.spaces = sortSpaces(userProfile.spaces);
      setData(userProfile);
      setSuccess(true);
    } catch (e) {
      const err = e as AxiosError;
      if (err.response && err.response.status === 403) {
        setSuccess(true);
      } else {
        setError(err.message);
        setIsError(true);
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      getUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data: data,
    isUninitialized: isUninitialized,
    isFetching: isFetching,
    error: error,
    isError: isError,
    isSuccess: isSuccess,
    refetch: getUserProfile
  };
};

export default useGetUserProfileQuery;
