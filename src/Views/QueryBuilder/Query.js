import React from "react";
import injectStyles from "react-jss";
import { observer } from "mobx-react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import queryBuilderStore from "../../Stores/QueryBuilderStore";
import FetchingLoader from "../../Components/FetchingLoader";
import User from "../User";
import Field from "./Field";

const styles = {
  container:{
    display: "grid",
    gridTemplateRows: "auto 1fr",
    gridTemplateColumns: "1fr",
    gridGap: "10px",
    height: "100%"
  },
  info: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gridColumnGap: "30px",
    background: "var(--bg-color-ui-contrast2)",
    border: "1px solid var(--border-color-ui-contrast1)",
    color: "var(--ft-color-loud)",
    padding: "10px",
    "&:not(.available)": {
      display: "none",
      "& + $schemas": {
        gridRowStart: "span 2"
      }
    },
    "& h4": {
      marginTop: 0,
      marginBottom: "8px"
    }
  },
  description: {
    gridColumnStart: "span 2",
    marginTop: "20px",
    "& textarea": {
      minWidth: "100%",
      maxWidth: "100%",
      minHeight: "10rem"
    },
    "& + $save": {
      marginTop: "20px"
    }
  },
  input:{
    borderRadius: "2px",
    backgroundColor: "var(--bg-color-blend-contrast1)",
    color: "var(--ft-color-loud)",
    width:"100%",
    border:"1px solid transparent",
    "&:focus":{
      borderColor: "rgba(64, 169, 243, 0.5)"
    },
    "&.disabled,&:disabled":{
      backgroundColor: "var(--bg-color-blend-contrast1)",
      color: "var(--ft-color-normal)",
      cursor: "text"
    }
  },
  queryIdError: {
    gridColumnStart: "span 2",
    marginTop: "6px",
    color: "var(--ft-color-error)"
  },
  author: {
    gridColumnStart: "span 2",
    marginTop: "6px",
    color: "var(--ft-color-normal)",
    "& + $save": {
      marginTop: "20px"
    }
  },
  save: {
    gridColumnStart: "span 2",
    display: "flex",
    "& span": {
      color: "var(--ft-color-normal)"
    },
    "& small": {
      color:"var(--ft-color-quiet)",
      fontStyle:"italic"
    },
    "& small, & span": {
      flex: 1,
      paddingTop: "6px"
    },
    "& button": {
      marginLeft: "10px"
    }
  },
  schemas:{
    position:"relative",
    background: "var(--bg-color-ui-contrast2)",
    border: "1px solid var(--border-color-ui-contrast1)",
    overflow:"auto",
    color:"var(--ft-color-normal)"
  },
  savingLoader:{
    position:"fixed",
    top:0,
    left:0,
    width: "100%",
    height: "100%",
    zIndex: 10000,
    background: "var(--bg-color-blend-contrast1)",
    "& .fetchingPanel": {
      width: "auto",
      padding: "30px",
      border: "1px solid var(--border-color-ui-contrast1)",
      borderRadius: "4px",
      color: "var(--ft-color-loud)",
      background: "var(--list-bg-hover)"
    }
  },
  saveErrorPanel: {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    background: "var(--bg-color-blend-contrast1)",
    zIndex: "1200",
    "& > div": {
      position: "absolute",
      top: "50%",
      left: "50%",
      minWidth: "220px",
      transform: "translate(-50%, -50%)",
      padding: "20px",
      borderRadius: "5px",
      background: "white",
      textAlign: "center",
      boxShadow: "2px 2px 4px #7f7a7a",
      "& h4": {
        margin: "0",
        paddingBottom: "20px",
        color: "red"
      },
      "& button + button, & a + button, & a + a": {
        marginLeft: "20px"
      }
    }
  }
};

@injectStyles(styles)
@observer
export default class Query extends React.Component{

  handleChangeQueryId = event => {
    queryBuilderStore.queryId = event.target.value;
  }

  handleChangeLabel = event => {
    queryBuilderStore.label = event.target.value;
  }

  handleChangeDescription = event => {
    queryBuilderStore.description = event.target.value;
  }

  handleSave = () => {
    queryBuilderStore.saveQuery();
  }

  handleCancelSave = () => {
    queryBuilderStore.cancelSaveQuery();
  }

  handleRevertChanges = () => {
    queryBuilderStore.cancelChanges();
  }

  handleShowSaveDialog = () => {
    queryBuilderStore.saveAsMode = true;
  }

  handleHideSaveDialog = () => {
    queryBuilderStore.saveAsMode = false;
  }

  render(){
    const { classes } = this.props;

    if (!queryBuilderStore.rootField) {
      return null;
    }

    return (
      <div className={classes.container}>
        <div className={`${classes.info} ${queryBuilderStore.isQuerySaved || queryBuilderStore.isValid?"available":""}`}>
          {(queryBuilderStore.isQuerySaved || queryBuilderStore.saveAsMode) && (
            <React.Fragment>
              <div>
                <h4>Query :</h4>
                <input
                  className={`form-control ${classes.input}`}
                  required="required"
                  pattern={queryBuilderStore.queryIdPattern}
                  disabled={!queryBuilderStore.saveAsMode}
                  placeholder={""}
                  type="text"
                  value={(queryBuilderStore.isQuerySaved && !queryBuilderStore.saveAsMode)?queryBuilderStore.sourceQuery.id:queryBuilderStore.queryId}
                  onChange={this.handleChangeQueryId} />
              </div>
              <div>
                <h4>Label :</h4>
                <input
                  className={`form-control ${classes.input}`}
                  disabled={!(queryBuilderStore.saveAsMode || queryBuilderStore.isOneOfMySavedQueries)}
                  placeholder={""}
                  type="text"
                  value={queryBuilderStore.label}
                  onChange={this.handleChangeLabel} />
              </div>
              {queryBuilderStore.saveAsMode && !queryBuilderStore.isQueryIdValid && queryBuilderStore.queryId !== "" && (
                <div className={classes.queryIdError}>
                  <FontAwesomeIcon icon="exclamation-triangle"/>&nbsp;&quot;{queryBuilderStore.queryId}&quot; is not a valid query name. It should not be empty. Accepted characters are a to z small or capital letters, numbers, minus and underscore!
                </div>
              )}
              {queryBuilderStore.saveAsMode && queryBuilderStore.isQueryIdValid && queryBuilderStore.queryIdAlreadyInUse && (
                <div className={classes.queryIdError}>
                  <FontAwesomeIcon icon="exclamation-triangle"/>&nbsp;A query named &quot;{queryBuilderStore.queryId}&quot; already exists. Please choose another name!
                </div>
              )}
              {queryBuilderStore.saveAsMode && queryBuilderStore.isQueryIdValid && queryBuilderStore.queryIdAlreadyExists && (
                <div className={classes.queryIdError}>
                  <FontAwesomeIcon icon="exclamation-triangle"/>&nbsp;You already created a query named &quot;{queryBuilderStore.queryId}&quot;. Please choose another name!
                </div>
              )}
              <div className={classes.description}>
                <h4>Description :</h4>
                <textarea
                  className={`form-control ${classes.input}`}
                  disabled={!(queryBuilderStore.saveAsMode || queryBuilderStore.isOneOfMySavedQueries)}
                  placeholder={""}
                  type="text"
                  value={queryBuilderStore.description}
                  onChange={this.handleChangeDescription} />
              </div>
              {queryBuilderStore.isQuerySaved && !queryBuilderStore.saveAsMode && !queryBuilderStore.isOneOfMySavedQueries && (
                <div className={classes.author} >
                  <span>by user<User org={queryBuilderStore.sourceQuery.org} userId={queryBuilderStore.sourceQuery.user} /></span>
                </div>
              )}
            </React.Fragment>
          )}
          {queryBuilderStore.isQuerySaved?
            queryBuilderStore.isOneOfMySavedQueries?
              queryBuilderStore.saveAsMode?
                <div className={classes.save}>
                  {(queryBuilderStore.isQueryIdValid && !queryBuilderStore.queryIdAlreadyInUse && !queryBuilderStore.queryIdAlreadyExists)?
                    <small>query api: /query/{queryBuilderStore.rootSchema.id}/{queryBuilderStore.queryId}</small>
                    :
                    <small></small>
                  }
                  <Button bsStyle="default" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError} onClick={this.handleHideSaveDialog}>Cancel</Button>
                  <Button bsStyle="primary" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError || !queryBuilderStore.isValid || !queryBuilderStore.isQueryIdValid || queryBuilderStore.queryIdAlreadyInUse || queryBuilderStore.queryIdAlreadyExists} onClick={this.handleSave}><FontAwesomeIcon icon="save"/>&nbsp;Save</Button>
                </div>
                :
                <div className={classes.save}>
                  <small>query api: /query/{queryBuilderStore.rootSchema.id}/{queryBuilderStore.sourceQuery.id}</small>
                  {queryBuilderStore.hasChanged && (
                    <Button bsStyle="default" onClick={this.handleRevertChanges}><FontAwesomeIcon icon="undo-alt"/>&nbsp;Revert unsaved changes</Button>
                  )}
                  <Button bsStyle="default" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError || !queryBuilderStore.isValid} onClick={this.handleShowSaveDialog}><FontAwesomeIcon icon="save"/>&nbsp;Save As</Button>
                  <Button bsStyle="primary" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError || !queryBuilderStore.hasChanged || !queryBuilderStore.isValid || !queryBuilderStore.isQueryIdValid || queryBuilderStore.queryIdAlreadyInUse || (queryBuilderStore.sourceQuery && queryBuilderStore.sourceQuery.isDeleting)} onClick={this.handleSave}><FontAwesomeIcon icon="save"/>&nbsp;Save</Button>
                </div>
              :
              queryBuilderStore.saveAsMode?
                <div className={classes.save}>
                  {(queryBuilderStore.isQueryIdValid && !queryBuilderStore.queryIdAlreadyInUse && !queryBuilderStore.queryIdAlreadyExists)?
                    <small>query api: /query/{queryBuilderStore.rootSchema.id}/{queryBuilderStore.queryId}</small>
                    :
                    <small></small>
                  }
                  <Button bsStyle="default" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError} onClick={this.handleHideSaveDialog}>Cancel</Button>
                  <Button bsStyle="primary" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError || !queryBuilderStore.isValid || !queryBuilderStore.isQueryIdValid || queryBuilderStore.queryIdAlreadyInUse || queryBuilderStore.queryIdAlreadyExists} onClick={this.handleSave}><FontAwesomeIcon icon="save"/>&nbsp;Save</Button>
                </div>
                :
                <div className={classes.save}>
                  <small>query api: /query/{queryBuilderStore.rootSchema.id}/{queryBuilderStore.sourceQuery.id}</small>
                  {queryBuilderStore.hasChanged && (
                    <Button bsStyle="default" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError} onClick={this.handleRevertChanges}><FontAwesomeIcon icon="undo-alt"/>&nbsp;Revert unsaved changes</Button>
                  )}
                  <Button bsStyle="default" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError || !queryBuilderStore.isValid} onClick={this.handleShowSaveDialog}><FontAwesomeIcon icon="save"/>&nbsp;Save As</Button>
                </div>
            :
            queryBuilderStore.saveAsMode?
              <div className={classes.save}>
                <small>query api: /query/{queryBuilderStore.rootSchema.id}/{queryBuilderStore.queryId}</small>
                <Button bsStyle="default" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError} onClick={this.handleHideSaveDialog}>Cancel</Button>
                <Button bsStyle="primary" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError || !queryBuilderStore.hasChanged || !queryBuilderStore.isValid || !queryBuilderStore.isQueryIdValid || queryBuilderStore.queryIdAlreadyInUse} onClick={this.handleSave}><FontAwesomeIcon icon="save"/>&nbsp;Save</Button>
              </div>
              :
              <div className={classes.save}>
                <span>Click on &quot;Save As&quot; to save your query.</span>
                <Button bsStyle="default" disabled={queryBuilderStore.isSaving || !!queryBuilderStore.saveError || !queryBuilderStore.hasChanged} onClick={this.handleShowSaveDialog}><FontAwesomeIcon icon="save"/>&nbsp;Save As</Button>
              </div>
          }
        </div>
        <div className={classes.schemas}>
          <Field field={queryBuilderStore.rootField}/>
        </div>
        {queryBuilderStore.isSaving && (
          <div className={classes.savingLoader}>
            <FetchingLoader>{`Saving query "${queryBuilderStore.queryId}"...`}</FetchingLoader>
          </div>
        )}
        {queryBuilderStore.saveError && (
          <div className={classes.saveErrorPanel}>
            <div>
              <h4>{queryBuilderStore.saveError}</h4>
              <div>
                <Button bsStyle="default" onClick={this.handleCancelSave}>Cancel</Button>
                <Button bsStyle="primary" onClick={this.handleSave}>Retry</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}