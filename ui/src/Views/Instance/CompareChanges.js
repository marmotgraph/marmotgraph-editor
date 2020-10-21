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

import React, { useEffect, useRef } from "react";
import { createUseStyles } from "react-jss";
import { observer } from "mobx-react";
import CompareFieldsChanges from "./CompareFieldsChanges";
import instancesStore, {createInstanceStore} from "../../Stores/InstancesStore";

const useStyles = createUseStyles({
  container: {
    padding: "12px 15px"
  }
});

const CompareChanges = observer(({ instanceId, onClose }) => {

  const classes = useStyles();

  const savedInstanceStore = useRef();

  useEffect(() => {
    if (!savedInstanceStore.current) {
      savedInstanceStore.current = createInstanceStore();
    }
    const savedInstance = savedInstanceStore.current.createInstanceOrGet(instanceId);
    const instance = instancesStore.instances.get(instanceId);
    const data = instance.cloneInitialData;
    savedInstance.initializeData(data);
    return () => {
      savedInstanceStore.current.flush();
    };
  }, [instanceId]);

  const instance = instancesStore.instances.get(instanceId);
  const savedInstance = savedInstanceStore.current && savedInstanceStore.current.instances.get(instanceId);
  if (!instance || !savedInstance) {
    return null;
  }

  return(
    <div className={classes.container}>
      <CompareFieldsChanges
        instanceId={instanceId}
        leftInstance={savedInstance}
        rightInstance={instance}
        leftInstanceStore={instancesStore}
        rightInstanceStore={instancesStore}
        leftChildrenIds={savedInstance.childrenIds}
        rightChildrenIds={instance.childrenIds}
        onClose={onClose}
      />
    </div>
  );
});

export default CompareChanges;