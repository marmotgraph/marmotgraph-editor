/*
*   Copyright (c) 2021, EPFL/Human Brain Project PCO
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

import React from "react";
import { observer } from "mobx-react-lite";
import { createUseStyles } from "react-jss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import IncomingLinkInstance from "./IncomingLinkInstance";

const useStyles = createUseStyles({
  container: {
    "& > ul": {
      listStyle: "none",
      paddingLeft: "20px",
      "& > li": {
        display: "inline",
        "& + li:before": {
          content: "', '"
        }
      }
    }
  },
  type: {
    paddingRight: "10px"
  },
});

const IncomingLinkInstances = observer(({ link, readMode }) => {

  const classes = useStyles();

  return (
    <div className={classes.container}>
      <div>
        {link.types.map(({name, label, color}) => (
          <span key={name} className={classes.type} title={name}><FontAwesomeIcon icon={"circle"} color={color}/>&nbsp;&nbsp;<span>{label?label:name}</span></span>
        ))}
      </div>
      <ul>
        {link.instances.map((instance, index) => (
          <li key={index}>
            <IncomingLinkInstance instance={instance} types={link.types} space={link.space} readMode={readMode} />
          </li>
        ))}
      </ul>
    </div>
  );

});
IncomingLinkInstances.displayName = "IncomingLinkInstances";

export default IncomingLinkInstances;