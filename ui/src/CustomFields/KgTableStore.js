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

import { observable, action, runInAction, set, computed } from "mobx";
import { union, debounce, remove, isObject } from "lodash";
import { FormStore } from "hbp-quickfire";

import API from "../Services/API";

class KgTableStore extends FormStore.typesMapping.Default{
    @observable value = [];
    @observable options = [];
    @observable instanceId = null;
    @observable fullyQualifiedName = null;
    @observable instances = []
    @observable allowCustomValues =  false;
    @observable mappingValue = "value";
    @observable mappingLabel = "label";
    @observable mappingReturn = null;
    @observable max = Infinity;
    @observable listPosition = "bottom";
    @observable closeDropdownAfterInteraction = false;

    @observable userInput = "";

    @observable optionsSelectedType = null;
    @observable optionsTypes = [];
    @observable optionsPageStart = 0;
    @observable optionsPageSize = 50;
    @observable optionsCurrentTotal = Infinity;
    @observable fetchingOptions = false;
    @observable visibleInstances = 0;
    @observable instancesMap = new Map();
    @observable isFetchingQueue = false;
    @observable defaultVisibleInstances = 10;
    @observable isInteractive = false;

    instancesQueue = new Set();
    queueThreshold = 5000;
    queueTimeout = 250;

    __emptyValue = () => [];

    static get properties(){
      return union(super.properties,["value", "instanceId", "fullyQualifiedName",  "allowCustomValues", "mappingValue", "mappingLabel", "mappingReturn", "max", "listPosition", "closeDropdownAfterInteraction", "userInput"]);
    }

    constructor(fieldData, store, path){
      super(fieldData, store, path);
      this.injectValue(this.value);
    }


    @computed
    get columns() {
      if(this.isInitialized && !this.hasInitializationError) {
        const label = this.instances[0].mappingLabel;
        const fields = this.instances[0].fields;
        let columns = Object.entries(fields).map(([name, field]) => ({name: name, label: field[label]}));
        columns.push({name: "delete", label: ""});
        return columns;
      }
      return [
        {name: "id", label: "Name"},
        {name: "delete", label: ""}
      ];
    }

    @action
    showInstance(instanceId) {
      const instance = this.instancesMap.get(instanceId);
      if(!instance.show) {
        instance.show = true;
        this.visibleInstances++;
      }
    }

    @computed
    get visibleInstancesCount() {
      const defaultInstances = this.defaultVisibleInstances > this.instances.length ? this.instances.length:this.defaultVisibleInstances;
      let count = defaultInstances + this.visibleInstances;
      for(let i=0; i<defaultInstances && i<this.instances.length; i++ ) {
        const instance = this.instances[i];
        if(instance && instance.show) {
          count--;
        }
      }
      return count;
    }

    isInstanceVisible = (index, instanceId) => {
      if(index < this.defaultVisibleInstances) {
        return true;
      }
      const instance = this.instancesMap.get(instanceId);
      return instance && instance.show;
    }

    @computed
    get isInitialized() {
      return this.hasInitializationError || this.instances.length && typeof this.instances[0].fields == "object" && Object.keys(this.instances[0].fields).length>0;
    }

    @computed
    get hasInitializationError() {
      return this.instances.length && this.instances[0].fetchError;
    }

    @computed
    get list() {
      return this.instances.map(instance => {
        const row = {id:instance.id, instance: instance};
        if(!instance.isFetching && instance.isFetched) {
          this.columns.forEach(col => {
            if(col.name !== "delete") {
              row[col.name] = instance.fields[col.name].value;
            }
          });
        }
        return row;
      });
    }

    addInstance(value, mappingValue, mappingLabel) {
      const id = value[mappingValue];
      if(this.instancesMap.has(id)){
        const instance = this.instancesMap.get(id);
        if(!this.instances.some(instance => instance.id === id)) {
          this.instances.push(instance);
        }
        return instance;
      } else {
        this.instancesMap.set(id, {id: id, mappingValue: mappingValue, mappingLabel: mappingLabel, fetchError:null, isFetching:false, isFetched:false, fields:{}, show:false});
        const instance = this.instancesMap.get(id);
        this.instances.push(instance);
        this.fetchInstance(instance);
        return instance;
      }
    }

    isInstanceVisible = (index, instanceId) => {
      if(index < this.defaultVisibleInstances) {
        return true;
      }
      const instance = this.instancesMap.get(instanceId);
      return instance && instance.show;
    }

    hasMoreOptions(){
      return !this.fetchingOptions && this.options.length < this.optionsCurrentTotal;
    }

    fetchInstance(instance){
      this.instancesQueue.add(instance.id);
      this.processQueue();
    }

    _debouncedFetchQueue = debounce(()=>{this.fetchQueue();}, this.queueTimeout);

    _debouncedFetchOptions = debounce((append)=>{this.fetchOptions(append);}, 250);

    @action
    removeInstance(id) {
      this.instancesMap.delete(id);
      remove(this.instances, instance=> instance.id === id);
    }

    @action
    removeAllInstancesAndValues() {
      this.value = [];
      this.instancesMap.clear();
      this.instances = [];
    }

    @action
    processQueue(){
      if(this.instancesQueue.size <= 0){
        this._debouncedFetchQueue.cancel();
      } else if(this.instancesQueue.size < this.queueThreshold){
        this._debouncedFetchQueue();
      } else if(!this.isFetchingQueue){
        this._debouncedFetchQueue.cancel();
        this.fetchQueue();
      }
    }

    @action
    async fetchQueue(){
      if(this.isFetchingQueue){
        return;
      }
      this.isFetchingQueue = true;
      let toProcess = Array.from(this.instancesQueue).splice(0, this.queueThreshold);
      toProcess.forEach(identifier => {
        const instance = this.instancesMap.get(identifier);
        instance.isFetching = true;
        instance.fetchError = null;
      });
      try{
        let response = await API.axios.post(API.endpoints.instancesSummary(), toProcess);
        runInAction(() =>{
          toProcess.forEach(identifier => {
            const instance = this.instancesMap.get(identifier);
            const instanceData =  response && response.data && response.data.data && response.data.data[identifier];
            if(instanceData){
              if(instanceData.error) {
                const message = JSON.stringify(instanceData.error.message); // TODO: check and handle properly error object
                set(instance, "fetchError", message);
              } else {
                if (typeof instanceData.fields !== "object") {
                  instanceData.fields = {};
                }
                instanceData.fields["http://schema.org/name"] = {
                  name: "Name",
                  value: instanceData.name
                };
                set(instance, "fields", instanceData.fields);
                set(instance, "isFetched", true);
              }
            } else {
              set(instance, "fetchError", `Error fetching instance ${identifier}`);
            }
            set(instance, "isFetching", false);
            this.instancesQueue.delete(identifier);
          });
          this.isFetchingQueue = false;
          this.processQueue();
        });
      } catch(e){
        runInAction(() =>{
          toProcess.forEach(identifier => {
            const instance = this.instancesMap.get(identifier);
            set(instance, "fetchError", `Error fetching instance ${identifier} (${e.message?e.message:e})`);
            set(instance, "isFetching", false);
            this.instancesQueue.delete(identifier);
          });
          this.isFetchingQueue = false;
          this.processQueue();
        });
      }
    }

    @action
    injectValue(value){
      if(value !== undefined){
        this.registerProvidedValue(value, true);
      }
      this.value = this.__emptyValue();

      let providedValue = this.getProvidedValue();
      this.instances = [];
      providedValue.forEach(value => {
        if(!value || this.value.length >= this.max){
          return;
        }
        const instance = this.addInstance(value, this.mappingValue, this.mappingLabel);
        this.addValue(instance);
      });
    }

    @action
    async fetchOptions(append){
      this.fetchingOptions = true;
      this.optionsPageStart = append?this.options.length:0;
      const payload = this.store.getValues();
      payload["@type"] = this.store.structure.types.map(t => t.name);
      try {
        const { data: { data: { suggestions: { data: options, total }, types }} } = await API.axios.post(API.endpoints.suggestions(this.instanceId, this.fullyQualifiedName, this.optionsSelectedType, this.optionsPageStart, this.optionsPageSize, this.userInput), payload);
        runInAction(()=>{
          const opts = Array.isArray(options)?options:[];
          if(append){
            this.options = this.options.concat(opts);
          } else {
            this.options = opts;
          }
          this.optionsTypes = types;
          this.optionsCurrentTotal = total;
          this.fetchingOptions = false;
        });
      } catch (e) {
        // TODO: handle error
        this.fetchingOptions = false;
      }
    }

    @action
    setUserInput(userInput){
      this.userInput = userInput;
      this.options = [];
      this._debouncedFetchOptions(false);
    }

    @action
    loadMoreOptions(){
      if(this.hasMoreOptions()){
        this.fetchOptions(true);
      }
    }
}

export default KgTableStore;