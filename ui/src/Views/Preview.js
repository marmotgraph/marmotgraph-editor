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

import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { createUseStyles } from "react-jss";
import Form from "react-bootstrap/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "react-bootstrap/Button";
import { Scrollbars } from "react-custom-scrollbars";

import { useStores } from "../Hooks/UseStores";

import Field from "../Fields/Field";
import FetchingLoader from "../Components/FetchingLoader";
import BGMessage from "../Components/BGMessage";
import Status from "./Instance/Status";
// import BookmarkStatus from "./Instance/BookmarkStatus";
import Actions from "./Preview/Actions";
import GlobalFieldErrors from "../Components/GlobalFieldErrors";

const useStyles = createUseStyles({
  container: {
    height: "100%",
    padding: "10px 0"
  },
  noPermission: {
    padding: "10px"
  },
  content: {
    display: "grid",
    gridTemplateRows: "auto 1fr",
    gridTemplateColumns: "100%",
    height: "100%",
    "& > .header": {
      padding: "0 10px"
    },
    "& .popover-popup": {
      display: "none !important"
    },
    "&:hover .popover-popup": {
      display: "block !important"
    }
  },
  status: {
    position: "absolute",
    top: "6px",
    right: "-54px",
    fontSize: "25px"
  },
  bookmarkStatus: {
    marginRight: "5px",
    fontSize: "1em"
  },
  type: {
    display: "inline-block",
    paddingRight: "8px",
    verticalAlign: "text-bottom",
  },
  titlePanel: {
    position: "relative",
    width: "calc(100% - 70px)"
  },
  title: {
    fontSize: "1.5em",
    fontWeight: "300"
  },
  metadataTitle: {
    display: "inline-block",
    marginBottom: "10px"
  },
  info: {
    fontSize: "0.75em",
    color: "var(--ft-color-normal)",
    marginTop: "20px",
    marginBottom: "20px"
  },
  field: {
    marginBottom: "10px",
    wordBreak: "break-word"
  },
  duplicate: {
    extend: "action"
  },
  errorReport: {
    margin: "10px"
  },
  errorMessage: {
    marginBottom: "15px",
    fontWeight:"300",
    fontSize:"1em",
    color: "var(--ft-color-error)",
    "& path":{
      fill:"var(--ft-color-error)",
      stroke:"rgba(200,200,200,.1)",
      strokeWidth:"3px"
    }
  },
  form: {
    padding: "0 10px"
  }
});

const Preview  = observer(({ className, instanceId, instanceName, showEmptyFields=true, showAction=true, showTypes=false, showStatus=true, showMetaData=true}) => {

  const classes = useStyles();

  const { instancesStore } = useStores();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => fetchInstance(), [instanceId]);

  const fetchInstance = (forceFetch=false) =>  {
    const instance = instancesStore.createInstanceOrGet(instanceId);
    instance.fetch(forceFetch);
  };

  const handleRetry = () => fetchInstance(true);

  const instance = instanceId?instancesStore.instances.get(instanceId):null;
  if (!instance) {
    return null;
  }

  if(instance.hasFetchError) {
    return(
      <div className={`${classes.container} ${className?className:""}`}>
        <BGMessage icon={"ban"}>
                There was a network problem fetching the instance &quot;<i>{instanceId}&quot;</i>.
          <br />
                If the problem persists, please contact the support.
          <br />
          <small>{instance.fetchError}</small>
          <br />
          <br />
          <Button variant={"primary"} onClick={handleRetry}>
            <FontAwesomeIcon icon={"redo-alt"} /> &nbsp; Retry
          </Button>
        </BGMessage>
      </div>
    );
  }

  if(!instance.isFetched || instance.isFetching) {
    return(
      <div className={`${classes.container} ${className?className:""}`}>
        <FetchingLoader>
          <span>Fetching instance &quot;<i>{instanceId}&quot;</i>information...</span>
        </FetchingLoader>
      </div>
    );
  }

  if(instance.isFetched && !instance.permissions.canRead) {
    const fieldStore = instance.fields[instance.labelField];
    return(
      <Form className={`${classes.container} ${className?className:""} ${classes.noPermission}`} >
        <Field name={instance.labelField} fieldStore={fieldStore} readMode={true} className={classes.field} />
        <div className={classes.errorMessage}>
          <FontAwesomeIcon icon="ban" /> You do not have permission to view the instance.
        </div>
      </Form>
    );
  }

  const fields = [...instance.promotedFields, ...instance.nonPromotedFields];

  return (
    <div className={`${classes.container} ${showEmptyFields?"":"hide-empty-fields"}  ${className?className:""}`}>
      <div className={classes.content}>
        <div className="header">
          {showAction && (
            <Actions instance={instance} />
          )}
          <div className={classes.titlePanel}>
            {/* {showBookmarkStatus && (
                  <BookmarkStatus className={classes.bookmarkStatus} id={instanceId} />
                )} */}
            {showTypes && (
              <div className={classes.type} style={instance.primaryType.color ? { color: instance.primaryType.color } : {}} title={instance.primaryType.name}>
                <FontAwesomeIcon fixedWidth icon="circle" />
              </div>
            )}
            <span className={classes.title}>
              {instanceName?instanceName:instance.name}
            </span>
            {showStatus && (
              <div className={`${classes.status}`}>
                <Status
                  darkmode={true}
                  id={instanceId}
                />
              </div>
            )}
          </div>
          <div className={classes.info}>
            <div>ID: {instanceId}</div>
            <div>Workspace: {instance.workspace}</div>
          </div>
        </div>
        <Scrollbars autoHide>
          {instance.hasFieldErrors ?
            <div className={classes.errorReport}>
              <GlobalFieldErrors instance={instance} />
            </div>:
            <Form className={`${classes.form}`}>
              {fields.map(name => {
                const fieldStore = instance.fields[name];
                return (
                  <Field key={name} name={name} className={classes.field} fieldStore={fieldStore} readMode={true} showIfNoValue={showEmptyFields} />
                );
              })}
              {showMetaData && instance.metadata && instance.metadata.length > 0 && (
                <div>
                  <hr />
                  <span className={`${classes.title} ${classes.metadataTitle}`}>
                    {" "}
                      Metadata{" "}
                  </span>
                  {instance.metadata.map(field => (
                    <div key={instanceId + field.label} className={classes.field}>
                      <label>{field.label}: </label> {field.value}
                    </div>
                  ))}
                </div>
              )}
            </Form>}
        </Scrollbars>
      </div>
    </div>
  );
});

export default Preview;