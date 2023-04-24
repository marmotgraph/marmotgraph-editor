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

import { useStores } from "../../../Hooks/useStores";

import ErrorModal from "../../../Components/ErrorModal";
import SpinnerModal from "../../../Components/SpinnerModal";
import { useLocation, useNavigate } from "react-router-dom";
import Matomo from "../../../Services/Matomo";

const useStyles = createUseStyles({
  error: {
    color: "var(--ft-color-error)"
  },
  btn: {
    "&[disabled]": {
      cursor: "not-allowed"
    }
  },
  deleteErrorMessage: {
    margin: "20px 0",
    color: "var(--ft-color-error)"
  },
  deleteErrorActions: {
    marginBottom: "10px",
    width: "100%",
    textAlign: "center",
    wordBreak: "keep-all",
    whiteSpace: "nowrap",
    "& button + button": {
      marginLeft: "20px"
    }
  }
});
const Delete = observer(({ status, onClick, classes, fetchStatus }) => {
  if (status && status.hasFetchError) {
    return (
      <div className={classes.error}>
        <FontAwesomeIcon icon={"exclamation-triangle"} />
        &nbsp;&nbsp;{status.fetchError}&nbsp;&nbsp;
        <Button variant="primary" onClick={fetchStatus}>
          <FontAwesomeIcon icon="redo-alt" />
          &nbsp;Retry
        </Button>
      </div>
    );
  }
  if (!status || !status.isFetched) {
    return (
      <>
        <FontAwesomeIcon icon={"circle-notch"} spin />
        &nbsp;&nbsp;Retrieving instance release status
      </>
    );
  }

  return (
    <>
      {status.data !== "UNRELEASED" ? (
        <ul>
          <li>
            This instance has been released and therefore cannot be deleted.
          </li>
          <li>
            If you still want to delete it you first have to unrelease it.
          </li>
        </ul>
      ) : (
        <p>
          <strong>Be careful. Removed instances cannot be restored!</strong>
        </p>
      )}
      <Button
        variant={status.data !== "UNRELEASED" ? "secondary" : "danger"}
        onClick={onClick}
        className={classes.btn}
        disabled={status.data !== "UNRELEASED"}
      >
        <FontAwesomeIcon icon={"trash-alt"} />
        &nbsp;&nbsp; Delete this instance
      </Button>
    </>
  );
});

const DeleteInstance = observer(({ instance, className }) => {
  const classes = useStyles();

  const { appStore, statusStore } = useStores();

  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    fetchStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  const fetchStatus = () => statusStore.fetchStatus(instance.id);

  const handleDeleteInstance = () => {
    Matomo.trackEvent("Instance", "Delete", instance.id);
    appStore.deleteInstance(instance.id, location, navigate);
  };

  const handleRetryDeleteInstance = () => appStore.retryDeleteInstance(location, navigate);

  const handleCancelDeleteInstance = () => appStore.cancelDeleteInstance();

  const permissions = instance.permissions;
  const status = statusStore.getInstance(instance.id);

  return (
    <>
      {permissions.canDelete && (
        <div className={className}>
          <h4>Delete this instance</h4>
          <Delete
            status={status}
            onClick={handleDeleteInstance}
            classes={classes}
            fetchStatus={fetchStatus}
          />
        </div>
      )}
      {appStore.deleteInstanceError && (
        <ErrorModal>
          <div className={classes.deleteErrorMessage}>{appStore.deleteInstanceError}</div>
          <div className={classes.deleteErrorActions}>
            <Button onClick={handleCancelDeleteInstance}>Cancel</Button>
            <Button variant="primary" onClick={handleRetryDeleteInstance}><FontAwesomeIcon icon="redo-alt" />&nbsp;Retry</Button>
          </div>
       </ErrorModal>
      )}
      {!appStore.deleteInstanceError &&
        appStore.isDeletingInstance &&
        !!appStore.instanceToDelete && (
          <SpinnerModal
            text={`Deleting instance ${appStore.instanceToDelete}...`}
          />
        )}
    </>
  );
});
DeleteInstance.displayName = "DeleteInstance";

export default DeleteInstance;
