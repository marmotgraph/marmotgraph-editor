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

import React, {useState, useEffect} from "react";
import instancesStore from "../Stores/InstancesStore";
import Alternatives from "./Alternatives";


const AlternativeValue = ({value:instances}) => instances.map(instance => instance.name).join("; ");

const LinksAlternatives = ({className, list, onSelect, onRemove, mappingValue}) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(list.map(({users, selected, value }) => {
      const instances = value.map(v => {
        if (v[mappingValue]) {
          const instance = instancesStore.createInstanceOrGet(v[mappingValue]);
          instance.fetchLabel();
          return instance;
        }
        return {
          name: "Unknown instance",
          value: value
        };
      });
      return {
        users: users,
        selected: selected,
        value: instances
      };
    }));
  }, [list]);

  return (
    <Alternatives
      className={className}
      list={items}
      onSelect={onSelect}
      onRemove={onRemove}
      parentContainerClassName="form-group"
      // parentRef={formGroupRef}
      ValueRenderer={AlternativeValue}
    />
  );
};

// const LinksAlternatives = React.forwardRef(LinksAlternativesWithRef, this.props.formGroupRef);

export default LinksAlternatives;