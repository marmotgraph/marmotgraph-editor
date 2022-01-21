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

import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { createUseStyles } from "react-jss";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReactPiwik from "react-piwik";

import { useStores } from "../../../Hooks/UseStores";

import ErrorModal from "../../../Components/ErrorModal";
import SpinnerModal from "../../../Components/SpinnerModal";

const useStyles = createUseStyles({
  error: {
    color: "var(--ft-color-error)"
  },
  btn: {
    "&[disabled]": {
      cursor: "not-allowed"
    }
  }
});

const DeleteInstance = observer(({instance, className}) => {

  const classes = useStyles();

  const { appStore, statusStore } = useStores();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => fetchStatus(), [instance]);

  const fetchStatus = () => statusStore.fetchStatus(instance.id);

  const handleDeleteInstance = () => {
    ReactPiwik.push(["trackEvent", "Instance", "Delete", instance.id]);
    appStore.deleteInstance(instance.id);
  };

  const handleRetryDeleteInstance = () => appStore.retryDeleteInstance();

  const handleCancelDeleteInstance = () => appStore.cancelDeleteInstance();

  const permissions = instance.permissions;
  const status = statusStore.getInstance(instance.id);

  return (
    <>
      {permissions.canDelete && (
        <div className={className}>
          <h4>Delete this instance</h4>
          {status && status.hasFetchError ?
            <div className={classes.error}>
              <FontAwesomeIcon icon={"exclamation-triangle"} />&nbsp;&nbsp;{status.fetchError}&nbsp;&nbsp;
              <Button variant="primary" onClick={fetchStatus}><FontAwesomeIcon icon="redo-alt" />&nbsp;Retry</Button>
            </div>
            : !status || !status.isFetched ?
              <>
                <FontAwesomeIcon icon={"circle-notch"} spin />&nbsp;&nbsp;Fetching instance release status
              </>
              :
              <>
                {status.data !== "UNRELEASED" ?
                  <ul>
                    <li>This instance has been released and therefore cannot be deleted.</li>
                    <li>If you still want to delete it you first have to unrelease it.</li>
                  </ul>
                  :
                  <p>
                    <strong>Be careful. Removed instances cannot be restored!</strong>
                  </p>
                }
                <Button variant={status.data !== "UNRELEASED"?"secondary":"danger"} onClick={handleDeleteInstance} className={classes.btn} disabled={status.data !== "UNRELEASED"} >
                  <FontAwesomeIcon icon={"trash-alt"} />&nbsp;&nbsp; Delete this instance
                </Button>
              </>
          }
        </div>
      )}
      {appStore.deleteInstanceError && (
        <ErrorModal message={appStore.deleteInstanceError} onCancel={handleCancelDeleteInstance} onRetry={handleRetryDeleteInstance} />
      )}
      {!appStore.deleteInstanceError && appStore.isDeletingInstance && !!appStore.instanceToDelete && (
        <SpinnerModal text={`Deleting instance "${appStore.instanceToDelete}" ...`} />
      )}
    </>
  );
});
DeleteInstance.displayName = "DeleteInstance";

export default DeleteInstance;